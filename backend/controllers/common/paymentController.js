const BusinessProfile = require('../../models/BusinessProfile');
const Coupon = require('../../models/Coupon');
const Payment = require('../../models/Payment');
const Sale = require('../../models/Sale');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const crypto = require('crypto');
const { logUsage } = require('../../utils/usageTracker');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');

const { verifyPaystackReference } = require('../../utils/paystack');
const { getPlanPrice } = require('../../config/pricing');

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, plan, billingCycle, couponCode } = req.body;
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
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
            // Use Centralized Utility
            try {
                paystackData = await verifyPaystackReference(reference);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 2. Validate Payment Amount (Anti-Fraud Check)
        const basePrice = getPlanPrice(plan, billingCycle);
        if (!basePrice) return res.status(400).json({ message: "Invalid plan or billing cycle" });

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
            subscriptionId: reference, // Using reference as ID for now
            // Extend expiry based on duration (Monthly = 30 days, Yearly = 365)
            trialExpiresAt: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        };

        const updatedProfile = await BusinessProfile.findByIdAndUpdate(
            profile._id, 
            updateData, 
            { new: true }
        );

        // 5. Update Coupon Usage
        if (coupon) {
            coupon.usedCount += 1;
            await coupon.save();
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

        // 2. Find and update Sale atomically
        const sale = await Sale.findOneAndUpdate(
            { 
                $or: [
                    { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                    { invoiceNumber: invoiceId.toUpperCase() },
                    { publicSlug: invoiceId }
                ],
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
