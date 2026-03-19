const BusinessProfile = require('../../models/BusinessProfile');
const Coupon = require('../../models/Coupon');
const Payment = require('../../models/Payment');
const Sale = require('../../models/Sale');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const VirtualAccount = require('../../models/VirtualAccount');
const User = require('../../models/User');
const crypto = require('crypto');
const { logUsage } = require('../../utils/usageTracker');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');

const { verifyPaystackReference } = require('../../utils/paystack');
const { getPlanPrice, PRICING_PLANS } = require('../../config/pricing');

exports.getUpgradeQuote = async (req, res) => {
    try {
        const { targetPlan, billingCycle = 'monthly' } = req.query; // 'oga' or 'chairman'
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Business profile not found" });

        const currentPlan = profile.plan;
        
        // If they are already on the target plan or higher
        if (currentPlan === 'chairman' || (currentPlan === 'oga' && targetPlan === 'oga')) {
            return res.status(400).json({ message: "You are already on this plan or higher." });
        }

        const targetPrice = getPlanPrice(targetPlan, billingCycle);
        if (!targetPrice) return res.status(400).json({ message: "Invalid target plan or cycle" });

        // If currently Hustler, no credit
        if (currentPlan === 'hustler' || profile.planStatus === 'trialing') {
            return res.status(200).json({ 
                currentPlan, 
                targetPlan, 
                upgradePrice: targetPrice, 
                unusedCredit: 0,
                message: `Upgrade to ${targetPlan} for ₦${targetPrice.toLocaleString()}`
            });
        }

        // Pro-rated Logic for Oga -> Chairman (Monthly only for now)
        if (billingCycle === 'monthly' && currentPlan === 'oga') {
            const now = new Date();
            const expiry = profile.nextBillingDate ? new Date(profile.nextBillingDate) : (profile.lastPaidAt ? new Date(new Date(profile.lastPaidAt).getTime() + 30*24*60*60*1000) : now);
            
            const remainingMs = expiry - now;
            const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
            
            const ogaPrice = 5000;
            const dailyRate = ogaPrice / 30;
            const unusedCredit = Math.floor(remainingDays * dailyRate);
            
            const upgradePrice = Math.max(1000, targetPrice - unusedCredit); // Minimum ₦1000 to upgrade

            return res.status(200).json({
                currentPlan,
                targetPlan,
                remainingDays,
                unusedCredit,
                upgradePrice,
                message: `Upgrade to ${targetPlan} for ₦${upgradePrice.toLocaleString()} (₦${unusedCredit.toLocaleString()} current credit applied)`
            });
        }

        // Yearly or other complex merges skip pro-rate for now
        res.status(200).json({
            currentPlan,
            targetPlan,
            upgradePrice: targetPrice,
            unusedCredit: 0,
            message: `Upgrade to ${targetPlan} for ₦${targetPrice.toLocaleString()}`
        });

    } catch (error) {
        console.error("Upgrade Quote Error:", error);
        res.status(500).json({ message: "Error calculating upgrade price" });
    }
};

exports.initializeVirtualAccountPayment = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;
        // 1. Find the sale
        const sale = await Sale.findOne({ 
             $or: [
                 { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                 { invoiceNumber: invoiceId.toUpperCase() },
                 { publicSlug: invoiceId }
             ]
        }).populate('businessId');

        if (!sale) return res.status(404).json({ message: "Invoice not found" });

        const business = sale.businessId;
        
        // 2. Check if a Virtual Account already exists and is active for this sale
        const existing = await VirtualAccount.findOne({ saleId: sale._id, status: 'active' });
        if (existing) {
             return res.status(200).json({ success: true, data: existing });
        }

        // 3. GENERATE VIRTUAL ACCOUNT (VIA PROVIDER)
        // PLACEHOLDER for Monnify/Paystack Integration
        console.log(`💎 Initializing Instant Cash VA for ${business.displayName}`);
        
        const reference = `KREDDY_VA_${Date.now()}`;
        const accountNumber = `90${Math.floor(Math.random() * 100000000)}`; 
        
        const vaRecord = await VirtualAccount.create({
            businessId: business._id,
            saleId: sale._id,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: accountNumber,
            bankName: "Wema Bank",
            reference: reference,
            amount: amount || (sale.totalAmount - sale.payments.reduce((s,p) => s + p.amount, 0)),
            status: "active"
        });

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                bankName: vaRecord.bankName,
                accountName: `Kredibly / ${business.displayName.substring(0, 15)}`,
                amount: vaRecord.amount,
                reference: vaRecord.reference,
                expiresIn: "60 minutes"
            }
        });

    } catch (error) {
        console.error("Initialize VA Error:", error);
        res.status(500).json({ message: "Failed to load transfer details" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, plan, billingCycle, couponCode } = req.body;
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Business profile not found" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

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
            // Use Centralized Utility
            try {
                paystackData = await verifyPaystackReference(reference);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 🔒 SECURITY CHECK: Assert payment intent
        if (reference && !reference.startsWith('FREE_') && paystackData) {
             if (paystackData.metadata?.paymentType !== 'subscription') {
                 return res.status(403).json({ success: false, message: "Invalid payment intent. Payment was not marked for a subscription." });
             }
             
             // 🔒 SECURITY CHECK: Assert payment ownership (prevent replay/hijack)
             if (paystackData.customer?.email !== user.email) {
                 console.warn(`🚨 Fraud Attempt: Reference ${reference} paid by ${paystackData.customer?.email}, but verified by ${user.email}`);
                 return res.status(403).json({ success: false, message: "Payment anomaly detected. Reference ownership mismatch." });
             }
        }

        // 2. Validate Payment Amount (Anti-Fraud Check)
        let basePrice = getPlanPrice(plan, billingCycle);
        if (!basePrice) return res.status(400).json({ message: "Invalid plan or billing cycle" });

        // If it's an UPGRADE from Oga to Chairman
        if (profile.plan === 'oga' && plan === 'chairman' && billingCycle === 'monthly') {
             const now = new Date();
             const expiry = profile.nextBillingDate ? new Date(profile.nextBillingDate) : (profile.lastPaidAt ? new Date(new Date(profile.lastPaidAt).getTime() + 30*24*60*60*1000) : now);
             const remainingMs = expiry - now;
             const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
             const unusedCredit = Math.floor(remainingDays * (5000 / 30));
             basePrice = Math.max(1000, 8500 - unusedCredit);
        }

        let expectedPrice = basePrice;
        let coupon = null;

        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                // Apply discount logic matching frontend
                if (coupon.discountType === 'percentage') {
                    expectedPrice = basePrice * (1 - coupon.discountValue / 100);
                } else if (coupon.discountType === 'fixed') {
                    expectedPrice = Math.max(0, basePrice - coupon.discountValue);
                }
            }
        }

        // Paystack returns amount in Kobo, convert to Naira
        const paidAmount = paystackData.amount / 100;

        // Verify Currency (Ensure it's NGN)
        if (paystackData.currency !== 'NGN') {
             return res.status(400).json({ 
                success: false, 
                message: "Invalid currency. Payment must be in NGN." 
            });
        }

        // Allow 1 Naira margin for floating point errors
        if (Math.abs(paidAmount - expectedPrice) > 1) {
            console.error(`🚨 Payment Verification Failed: Paid ₦${paidAmount}, Expected ₦${expectedPrice}`);
            return res.status(400).json({ 
                success: false, 
                message: "Payment amount does not match plan price. If initialized correctly, please contact support." 
            });
        }

        // 3. Log Internal Payment Record FIRST (Audit Trail)
        await Payment.create({
            businessId: profile._id,
            reference: reference,
            amount: paidAmount, 
            currency: 'NGN',
            plan: plan,
            billingCycle: billingCycle,
            couponUsed: couponCode || null,
            status: 'success',
            paidAt: new Date()
        });

        // 4. Update Profile
        const updateData = {
            plan: plan, // 'oga' or 'chairman'
            planStatus: 'active',
            billingCycle: billingCycle, // 'monthly' or 'yearly'
            lastPaidAt: new Date(),
            nextBillingDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        };

        const updatedProfile = await BusinessProfile.findByIdAndUpdate(
            profile._id, 
            updateData, 
            { new: true }
        );

        // 5. Update Coupon Usage (Idempotent)
        if (coupon) {
            await Coupon.updateOne(
                { _id: coupon._id, usedReferences: { $ne: reference } },
                { 
                  $inc: { usedCount: 1 }, 
                  $push: { usedReferences: reference } 
                }
            );
        }

        // LOG REVENUE (Async)
        logUsage("revenue", { amount: paidAmount }).catch(e => console.error("Revenue log fail:", e));

        res.status(200).json({ 
            success: true, 
            message: "Upgrade successful! Welcome to the Oga life.",
            profile: updatedProfile 
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        // If it's a duplicate key error (payment reference already used), handle gracefully
        if (error.code === 11000) {
             return res.status(400).json({ message: "This payment reference has already been used." });
        }
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
        let paystackData;
        try {
            paystackData = await verifyPaystackReference(reference);
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const paidAmount = paystackData.amount / 100;

        // 1b. Fetch the target Sale first to validate metadata
        const targetSale = await Sale.findOne({ 
            $or: [
                { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                { invoiceNumber: invoiceId.toUpperCase() },
                { publicSlug: invoiceId }
            ]
        });

        if (!targetSale) {
            return res.status(404).json({ success: false, message: "Sale record not found" });
        }

        // 🔒 SECURITY CHECK: Contextual Validation (Prevent Cross-Ledger Corruption)
        const paystackInvoiceNo = paystackData.metadata?.invoiceNumber;
        if (!paystackInvoiceNo || paystackInvoiceNo.toUpperCase() !== targetSale.invoiceNumber.toUpperCase()) {
            console.warn(`🚨 Fraud Attempt: Reference ${reference} belongs to Invoice ${paystackInvoiceNo}, but verified against ${targetSale.invoiceNumber}`);
            return res.status(403).json({ success: false, message: "Payment anomaly detected. Reference does not match this invoice." });
        }

        // 2. Find and update Sale atomically
        const sale = await Sale.findOneAndUpdate(
            { 
                _id: targetSale._id,
                'payments.reference': { $ne: reference }
            },
            {
                $push: {
                    payments: {
                        amount: paidAmount,
                        method: 'Paystack',
                        reference: reference,
                        date: new Date()
                    }
                }
            },
            { new: true }
        ).populate('businessId');

        if (!sale) {
            // Check if it was already processed
            const exists = await Sale.findOne({ 
                $or: [
                    { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                    { invoiceNumber: invoiceId.toUpperCase() },
                    { publicSlug: invoiceId }
                ]
            });

            if (exists) {
                const alreadyProcessed = exists.payments.some(p => p.reference === reference);
                if (alreadyProcessed) {
                    return res.status(200).json({ success: true, data: exists, message: "Payment already processed" });
                }
            }
            return res.status(404).json({ success: false, message: "Sale record not found or update failed" });
        }
        
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
                const receiptLink = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/r/${sale.invoiceNumber}`;
                
                let msg = `🔔 *Payment Verified!*\n\nChief, I've just verified an online payment of *₦${paidAmount.toLocaleString()}* for *Invoice #${sale.invoiceNumber}* (${sale.customerName}).\n\n`;
                
                if (balance <= 0) {
                    msg += `✅ *Fully Paid!* This debt is now cleared. I've updated your ledger records accordingly.\n\n`;
                } else {
                    msg += `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.\n\n`;
                }

                msg += `📄 *View Receipt:* ${receiptLink}\n\n_Kreddy - Your Digital Trust Assistant_`;
                
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
