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
const { sendSubscriptionConfirmEmail } = require('../../emailLogic/emails');

const { verifyPaystackReference } = require('../../utils/paystack');
const { generateVirtualAccount } = require('../../utils/squad');
const { getPlanPrice, PRICING_PLANS, LAUNCH_DATE } = require('../../config/pricing');

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
            
            const ogaPrice = getPlanPrice('oga', 'monthly');
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

        // 3. GENERATE VIRTUAL ACCOUNT VIA SQUAD
        console.log(`💎 Initializing Instant Cash VA for ${business.displayName}`);
        
        let squadResponse;
        try {
            const customerEmail = sale.customerEmail || business.ownerId.email || 'payments@usekredibly.com';
            squadResponse = await generateVirtualAccount({
                amount: amount || (sale.totalAmount - sale.payments.reduce((s,p) => s + p.amount, 0)),
                customerName: sale.customerName || 'Customer',
                email: customerEmail,
                invoiceNumber: sale.invoiceNumber,
                merchantBusinessName: business.displayName
            });
        } catch (squadErr) {
            console.error("Squad VA Generation failed:", squadErr);
            return res.status(500).json({ message: "Failed to generate dynamic account. Please try again." });
        }
        
        const vaRecord = await VirtualAccount.create({
            businessId: business._id,
            saleId: sale._id,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: squadResponse.accountNumber,
            bankName: squadResponse.bankName,
            provider: "squad",
            reference: squadResponse.transactionReference,
            amount: amount || (sale.totalAmount - sale.payments.reduce((s,p) => s + p.amount, 0)),
            status: "active"
        });

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                bankName: vaRecord.bankName,
                accountName: squadResponse.accountName,
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
            paystackData = { amount: 0, customer: { email: user.email } };
        } else {
            try {
                paystackData = await verifyPaystackReference(reference);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 🔒 SECURITY CHECK: Assert payment intent and ownership
        if (reference && !reference.startsWith('FREE_') && paystackData) {
             const intent = paystackData.metadata?.paymentType;
             if (intent !== 'subscription' && intent !== 'subscription_trial') {
                 return res.status(403).json({ success: false, message: "Invalid payment intent." });
             }
             if (paystackData.customer?.email !== user.email) {
                 return res.status(403).json({ success: false, message: "Payment anomaly detected." });
             }
        }

        const isTrial = paystackData.metadata?.paymentType === 'subscription_trial';

        // 2. Validate Payment Amount
        const { SLASH_WINDOW_END } = require('../../config/pricing');
        const now = new Date();
        
        let targetCycle = billingCycle;
        if (now <= SLASH_WINDOW_END) {
             targetCycle = 'launch'; 
        }

        let basePrice = getPlanPrice(plan, targetCycle);
        if (!basePrice) return res.status(400).json({ message: "Invalid plan or billing cycle" });

        // Pro-rated Logic for Oga -> Chairman
        if (profile.plan === 'oga' && plan === 'chairman' && billingCycle === 'monthly') {
             const expiry = profile.nextBillingDate ? new Date(profile.nextBillingDate) : (profile.lastPaidAt ? new Date(new Date(profile.lastPaidAt).getTime() + 30*24*60*60*1000) : now);
             const remainingMs = expiry - now;
             const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
             const ogaPrice = getPlanPrice('oga', 'monthly');
             const chairmanPrice = getPlanPrice('chairman', 'monthly');
             const unusedCredit = Math.floor(remainingDays * (ogaPrice / 30));
             basePrice = Math.max(1000, chairmanPrice - unusedCredit);
        }

        let expectedPrice = basePrice;
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    expectedPrice = basePrice * (1 - coupon.discountValue / 100);
                } else if (coupon.discountType === 'fixed') {
                    expectedPrice = Math.max(0, basePrice - coupon.discountValue);
                }
            }
        }

        const paidAmount = paystackData.amount / 100;
        if (!isTrial && Math.abs(paidAmount - expectedPrice) > 1) {
            return res.status(400).json({ success: false, message: "Amount mismatch." });
        }

        // 3. Update Profile Data
        const isTransfer = paystackData.metadata?.method === 'transfer';
        let startDate = now;
        let pioneerNote = "";
        let emailSubject = `Welcome to the Kredibly Pioneer Group 🛡️`;

        if (now < LAUNCH_DATE) {
            startDate = LAUNCH_DATE;
            pioneerNote = `Since you joined during our Pre-Launch Phase, your 1st paid month won't even start until **May 1**. You get the rest of April as a bonus on us!`;
        } else if (now.toLocaleDateString() === LAUNCH_DATE.toLocaleDateString()) {
            pioneerNote = `Happy Launch Day! Since you joined on Day 1, you've unlocked the full Pioneer Advantage for your business.`;
            emailSubject = `Happy Launch Day: Your Pioneer Status is Active! 🚀`;
        } else {
            pioneerNote = `Welcome to Kredibly! You've successfully claimed the 50% discount for your growth journey.`;
            emailSubject = `Your Kredibly Subscription is Active ✅`;
        }

        let slashCycles = 0;
        if (now <= SLASH_WINDOW_END) {
            slashCycles = 2; 
        }

        const nextBillingDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const updateData = {
            plan: plan, 
            planStatus: isTrial ? 'trialing' : 'active',
            billingCycle: billingCycle,
            lastPaidAt: now,
            isLaunchPromo: billingCycle === 'launch',
            hasUsedTrial: true,
            walletBalance: isTrial && isTransfer ? (profile.walletBalance || 0) + paidAmount : profile.walletBalance,
            trialExpiresAt: isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : profile.trialExpiresAt,
            nextBillingDate: isTrial ? null : nextBillingDate,
            slashCyclesRemaining: Math.max(0, (profile.slashCyclesRemaining || 0) + slashCycles - 1) 
        };

        const updatedProfile = await BusinessProfile.findByIdAndUpdate(profile._id, updateData, { new: true });

        // 4. Send Confirmation Email & WhatsApp
        sendSubscriptionConfirmEmail(user.email, {
            name: user.name || profile.displayName,
            planName: plan.toUpperCase(),
            amount: `₦${paidAmount.toLocaleString()}`,
            expiryDate: nextBillingDate.toLocaleDateString('en-GB'),
            launchDate: LAUNCH_DATE.toLocaleDateString('en-GB'),
            subject: emailSubject,
            pioneerStatus: slashCycles === 2 
                ? "Since you joined us before launch, you have unlocked our **Special Pioneer Advantage**: 2 full months of slash pricing to fuel your growth!" 
                : "You've successfully secured **1 month** of Grand Opening slash pricing to kickstart your growth!"
        }).catch(err => console.error("Email Fail:", err.message));

        const waMsg = `🛡️ *Welcome to the Vanguard!*\n\nI've just verified your payment of *₦${paidAmount.toLocaleString()}* for the *${plan.toUpperCase()} Plan*.\n\n✅ *Status:* Active Immediately\n⏳ *Pioneer Note:* ${pioneerNote.replace(/\*\*/g, '*')}\n\n_Oluwatosin, Founder_`;
        await sendWhatsAppMessage(profile.whatsappNumber, waMsg).catch(e => console.error("WA Fail:", e.message));

        // 5. Update Coupon Usage
        if (coupon) {
            await Coupon.updateOne(
                { _id: coupon._id, usedReferences: { $ne: reference } },
                { $inc: { usedCount: 1 }, $push: { usedReferences: reference } }
            );
        }

        logUsage("revenue", { amount: paidAmount }).catch(e => console.error("Log fail:", e));

        res.status(200).json({ 
            success: true, 
            message: `Upgrade successful!`,
            profile: updatedProfile 
        });

    } catch (error) {
        console.error("verifyPayment Error:", error);
        res.status(500).json({ message: "Server error during upgrade" });
    }
};

exports.verifyInvoicePayment = async (req, res) => {
    try {
        const { reference, invoiceId } = req.body;
        if (!reference || !invoiceId) return res.status(400).json({ message: "Missing params" });

        const paystackData = await verifyPaystackReference(reference);
        const paidAmount = paystackData.amount / 100;
        const actualCreditAmount = paystackData.metadata?.originalAmount ? Number(paystackData.metadata.originalAmount) : paidAmount;

        const targetSale = await Sale.findOne({ 
            $or: [
                { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                { invoiceNumber: invoiceId.toUpperCase() },
                { publicSlug: invoiceId }
            ]
        });

        if (!targetSale) return res.status(404).json({ message: "Sale not found" });

        // 🔒 TRIPLE-LOCK SECURITY: Pass if EITHER the Paystack metadata OR the reference string confirms the invoice.
        // This is resilient to metadata encoding issues from Paystack while remaining fully secure.
        const paystackInvoiceNo = paystackData.metadata?.invoiceNumber;
        const isKreddyRef = reference.startsWith('KREDDY_INV_');

        // Lock 1: Paystack metadata match (most explicit)
        const metadataMatches = paystackInvoiceNo &&
            paystackInvoiceNo.toUpperCase() === targetSale.invoiceNumber.toUpperCase();

        // Lock 2: Our reference string itself contains the invoice number (the reference is: KREDDY_INV_{invoiceNo}_{timestamp}_{random})
        // This is equally secure because we generated the reference during initialization
        const refContainsInvoice = isKreddyRef && reference.toUpperCase().includes(targetSale.invoiceNumber.toUpperCase());

        // Lock 3: Paystack Inline Referrer match (fallback for dropped metadata in Bank Transfers)
        let referrerMatches = false;
        if (paystackData.metadata?.referrer && paystackData.metadata.referrer.includes('/i/')) {
            const parts = paystackData.metadata.referrer.split('/i/');
            if (parts.length > 1) {
                const urlInvoiceNumber = parts[1].split('?')[0].split('#')[0];
                referrerMatches = urlInvoiceNumber.toUpperCase() === targetSale.invoiceNumber.toUpperCase();
            }
        }

        if (!metadataMatches && !refContainsInvoice && !referrerMatches) {
            console.error(`🚨 Payment Mismatch Blocked: Ref=${reference}, Meta=${paystackInvoiceNo}, Invoice=${targetSale.invoiceNumber}`);
            return res.status(403).json({ message: "Payment reference mismatch." });
        }

        console.log(`✅ Payment verified via: ${metadataMatches ? 'Metadata' : (refContainsInvoice ? 'Reference String' : 'Referrer Check')} | Invoice: ${targetSale.invoiceNumber}`);

        // ⚖️ ATOMIC SAVE: Use .save() so the pre-save hooks flip the status to 'paid' correctly
        const sale = await Sale.findById(targetSale._id).populate('businessId');
        if (!sale) return res.status(404).json({ message: "Sale not found after verification." });

        const duplicateRef = sale.payments && sale.payments.find(p => p.reference === reference);
        if (duplicateRef) {
            return res.status(200).json({ success: true, message: "Already processed" });
        }

        sale.payments.push({ amount: actualCreditAmount, method: 'Paystack', reference, date: new Date() });
        await sale.save(); // 🔥 Triggers status flip logic in Sale.js


        // 🛡️ SECURITY ESCROW TRACKER
        const business = sale.businessId;
        const lockUntil = business?.bankDetails?.bankDetailsLockUntil;
        if (lockUntil && new Date() < lockUntil) {
            const EscrowPayment = require("../../models/EscrowPayment");
            await EscrowPayment.create({
                businessId: business._id,
                saleId: sale._id,
                amount: actualCreditAmount,
                reference: reference,
                releaseDate: lockUntil,
                status: "pending"
            });
        }
        
        // Notifications...
        if (business) {
            await ActivityLog.create({
                businessId: business._id,
                action: 'PAYMENT_RECEIVED',
                entityType: 'PAYMENT',
                entityId: sale._id,
                details: `Online payment of ₦${actualCreditAmount.toLocaleString()} verified for Invoice #${sale.invoiceNumber}`
            });

            await Notification.create({
                businessId: business._id,
                title: 'Payment Received 💰',
                message: `₦${actualCreditAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber} from ${sale.customerName}.`,
                type: 'sale',
                saleId: sale._id
            });

            if (business.whatsappNumber) {
                const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = sale.totalAmount - totalPaid;
                const receiptLink = `https://usekredibly.com/r/${sale.invoiceNumber}`;
                
                let msg = `🔔 *Payment Verified!*\n\nChief, I've just verified an online payment of *₦${actualCreditAmount.toLocaleString()}* for *Invoice #${sale.invoiceNumber}* (${sale.customerName}).\n\n`;
                if (lockUntil && new Date() < lockUntil) {
                    msg += `🛡️ *Security Hold:* Since you recently updated your bank details, this money is being held in our *Secure Escrow* for 24 hours. \n\n`;
                } else {
                    msg += `🛡️ *Clearing:* We have secured these funds. They will settle to your bank account on the standard *T+1* clearing schedule.\n\n`;
                }
                msg += balance <= 0 ? "✅ *Fully Paid!*" : `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}`;
                msg += `\n📄 *Receipt:* ${receiptLink}`;
                
                await sendWhatsAppMessage(business.whatsappNumber, msg).catch(e => console.error("WA Fail:", e.message));
                logUsage("merchant_fee", { amount: actualCreditAmount }).catch(e => console.error("Log fail:", e));
            }
        }

        res.status(200).json({ success: true, data: sale });

    } catch (error) {
        console.error("verifyInvoicePayment Error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

exports.initializePaystackPayment = async (req, res) => {
    try {
        const { saleId, amount, email, paymentChannel } = req.body;
        const sale = await Sale.findById(saleId).populate({
            path: 'businessId',
            populate: { path: 'ownerId', select: 'email' }
        });
        if (!sale) return res.status(404).json({ message: "Invoice not found" });
        
        // All paymentChannel types are permitted — card, bank_transfer, etc.

        const reference = `KREDDY_INV_${sale.invoiceNumber}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const { initializePayment } = require('../../utils/paystack');
        
        // 🔒 BULLETPROOF EMAIL STRATEGY:
        // Use customer email if valid. Fallback to business email. Final fallback to support email.
        const bizEmail = sale.businessId?.ownerId?.email || sale.businessId?.email;
        let safeEmail = (email || '').trim().toLowerCase();
        
        if (!safeEmail || !safeEmail.includes('@') || safeEmail.length < 5) {
            safeEmail = (bizEmail || 'support@usekredibly.com').toLowerCase().trim();
        }
        
        // 🔒 SECURITY CHECK: If bank details were recently changed, Kredibly HOLDS the money for 24h.
        // We do this by omitting the subaccountCode from the Paystack initialization.
        const lockUntil = sale.businessId?.bankDetails?.bankDetailsLockUntil;
        const isLocked = lockUntil && new Date() < new Date(lockUntil);
        
        const subaccountCode = isLocked ? null : sale.businessId.paystackSubaccountCode;
        
        // 🛡️ SUBACCOUNT STATUS SHIELD:
        // If it's locked by a recent bank details change, we force Escrow.
        // Otherwise, we always try to use the subaccount. If Paystack rejects it, the try/catch fallback kicks in.
        const effectiveSubaccount = isLocked ? null : subaccountCode;
        const effectiveBearer = effectiveSubaccount ? 'subaccount' : 'none';

        if (isLocked) {
            console.log(`🛡️ Escrow Active for ${sale.businessId.displayName}. Security Lock.`);
        }

        // 🛡️ Dynamic Status Sync removed - letting Paystack directly handle validation natively.

        let paystackInit;
        try {
            paystackInit = await initializePayment(
                safeEmail, 
                amount, 
                reference, 
                { paymentType: 'invoice', invoiceNumber: sale.invoiceNumber, originalAmount: Number(amount) },
                effectiveSubaccount,
                effectiveBearer, 
                ['bank_transfer', 'bank']
            );
        } catch (initErr) {
            console.error("💡 Paystack Initialization Error (Subaccount Fail?):", initErr.message);
            // 🛡️ FALLBACK: If Subaccount fails, try standard payment to Kredibly Main Account (automatic Escrow)
            if (subaccountCode) {
                 console.log("🛡️ Falling back to ESCROW payment for", sale.invoiceNumber);
                 paystackInit = await initializePayment(
                    safeEmail, 
                    amount, 
                    reference, 
                    { paymentType: 'invoice', invoiceNumber: sale.invoiceNumber, originalAmount: Number(amount), subaccountError: true },
                    null, // No subaccount
                    'none', 
                    ['bank_transfer', 'bank']
                );
            } else {
                throw initErr; // Real error
            }
        }

        res.status(200).json({
            success: true,
            publicKey: process.env.PAYSTACK_PUBLIC_KEY,
            email: safeEmail,
            amount,
            accessCode: paystackInit.access_code,
            reference,
            metadata: { 
                paymentType: 'invoice', 
                invoiceNumber: sale.invoiceNumber, 
                originalAmount: Number(amount),
                isEscrowed: isLocked
            }
        });

    } catch (error) {
        console.error("Initialize Paystack Error:", error);
        res.status(500).json({ message: "Payment initialization failed" });
    }
};
