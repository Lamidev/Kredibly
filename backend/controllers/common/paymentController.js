const BusinessProfile = require('../../models/BusinessProfile');
const Coupon = require('../../models/Coupon');
const Payment = require('../../models/Payment');
const Sale = require('../../models/Sale');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const crypto = require('crypto');
const { logUsage } = require('../../utils/usageTracker');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, plan, billingCycle, couponCode } = req.body;
        const profile = await BusinessProfile.findOne({ owner: req.user._id });
        if (!profile) return res.status(404).json({ message: "Business profile not found" });

        // 1. Handle Free Upgrade / 100% Discount Bypass
        let paystackData = null;
        if (reference && reference.startsWith('FREE_')) {
            if (!couponCode) return res.status(400).json({ message: "Coupon required for free upgrade" });
            const cp = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!cp || (cp.discountType === 'percentage' && cp.discountValue !== 100)) {
                return res.status(400).json({ message: "Invalid claim for free upgrade" });
            }
            // Mock paystack data for verification skip
            paystackData = { amount: 0 };
        } else {
            // Standard Paystack Verification
            const https = require('https');
            
            const options = {
                hostname: 'api.paystack.co',
                port: 443,
                path: `/transaction/verify/${reference}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            };

            const verifyRequest = new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => { resolve(JSON.parse(data)); });
                });
                req.on('error', (e) => { reject(e); });
                req.end();
            });

            const paystackRes = await verifyRequest;

            if (!paystackRes.status || paystackRes.data.status !== 'success') {
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }
            paystackData = paystackRes.data;
        }

        // 2. Add 'Oga' status logic
        const updateData = {
            plan: plan, // 'oga' or 'chairman'
            planStatus: 'active',
            billingCycle: billingCycle, // 'monthly' or 'yearly'
            subscriptionId: reference, // Using reference as ID for now
            // Extend expiry based on duration (Monthly = 30 days, Yearly = 365)
            trialExpiresAt: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        };

        // 3. Handle Coupon Usage
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        // 4. Update Profile
        const updatedProfile = await BusinessProfile.findByIdAndUpdate(
            profile._id, 
            updateData, 
            { new: true }
        );

        // 5. Log Internal Payment Record
        await Payment.create({
            businessId: profile._id,
            reference: reference,
            amount: paystackData.amount / 100, // Convert from kobo
            plan: plan,
            billingCycle: billingCycle,
            couponUsed: couponCode || null,
            status: 'success',
            paidAt: new Date()
        });

        // LOG REVENUE (Async)
        logUsage("revenue", { amount: paystackData.amount / 100 }).catch(e => console.error("Revenue log fail:", e));

        res.status(200).json({ 
            success: true, 
            message: "Upgrade successful! Welcome to the Oga life.",
            profile: updatedProfile 
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Server error during upgrade" });
    }
};

exports.verifyInvoicePayment = async (req, res) => {
    try {
        const { reference, invoiceId } = req.body;
        if (!reference || !invoiceId) {
            return res.status(400).json({ success: false, message: "Missing reference or invoiceId" });
        }

        // 1. Verify with Paystack
        const https = require('https');
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${reference}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        };

        const verifyRequest = new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => { resolve(JSON.parse(data)); });
            });
            req.on('error', (e) => { reject(e); });
            req.end();
        });

        const paystackRes = await verifyRequest;

        if (!paystackRes.status || paystackRes.data.status !== 'success') {
            return res.status(400).json({ success: false, message: "Payment verification failed with Paystack" });
        }

        const paystackData = paystackRes.data;
        const paidAmount = paystackData.amount / 100;

        // 2. Find and Update Sale
        let sale;
        if (invoiceId.match(/^[0-9a-fA-F]{24}$/)) {
            sale = await Sale.findById(invoiceId).populate('businessId');
        } else {
            sale = await Sale.findOne({ invoiceNumber: invoiceId.toUpperCase() }).populate('businessId');
        }

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale record not found" });
        }

        // 3. Idempotency Check
        const alreadyProcessed = sale.payments.some(p => p.reference === reference);
        if (alreadyProcessed) {
            return res.status(200).json({ success: true, data: sale, message: "Payment already processed" });
        }

        // 4. Update the Sale
        sale.payments.push({
            amount: paidAmount,
            method: 'Paystack',
            reference: reference,
            date: new Date()
        });

        await sale.save();
        
        // 5. Background Tasks (Notifications, etc)
        const business = sale.businessId;
        if (business) {
             // Log Activity
             await ActivityLog.create({
                businessId: business._id,
                action: 'PAYMENT_RECEIVED',
                entityType: 'PAYMENT',
                entityId: sale._id,
                details: `Online payment of ₦${paidAmount.toLocaleString()} verified for Invoice #${sale.invoiceNumber}`
            });

            // Create Notification
            await Notification.create({
                businessId: business._id,
                title: 'Payment Received 💰',
                message: `₦${paidAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber} from ${sale.customerName}.`,
                type: 'sale',
                saleId: sale._id
            });

            // WhatsApp Notification
            if (business.whatsappNumber) {
                const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = sale.totalAmount - totalPaid;
                const receiptLink = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/i/${sale.invoiceNumber}`;
                
                let msg = `🔔 *Payment Verified!*\n\nChief, I've just verified an online payment of *₦${paidAmount.toLocaleString()}* for *Invoice #${sale.invoiceNumber}* (${sale.customerName}).\n\n`;
                
                if (balance <= 0) {
                    msg += `✅ *Fully Paid!* This debt is now cleared. I've updated your ledger records accordingly.\n\n`;
                } else {
                    msg += `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.\n\n`;
                }

                msg += `📄 *View/Share Receipt:* ${receiptLink}\n\n_Kreddy - Your Digital Trust Assistant_`;
                
                await sendWhatsAppMessage(business.whatsappNumber, msg).catch(err => {
                    console.error(`❌ Failed to send WhatsApp notification for payment ${reference}:`, err.message);
                });
            }
        }

        res.status(200).json({ success: true, data: sale, message: "Payment verified successfully" });

    } catch (error) {
        console.error("verifyInvoicePayment Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
};
