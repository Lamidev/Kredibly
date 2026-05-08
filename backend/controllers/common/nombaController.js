const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const VirtualAccount = require('../../models/VirtualAccount');
const FINANCIAL_CONFIG = require('../../config/financials');
const Notification = require('../../models/Notification');
const ActivityLog = require('../../models/ActivityLog');
const { logActivity } = require('../../utils/activityLogger');
const { createDynamicVirtualAccount, createNombaCheckoutOrder, verifyWebhookSignature, initiateTransfer, checkPaymentStatusByReference } = require('../../utils/nomba');
const { logUsage } = require('../../utils/usageTracker');
const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');

/**
 * 💳 INITIALIZE NOMBA SUBSCRIPTION (SaaS)
 */
exports.initializeNombaSubscription = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

        if (!['hustler', 'oga', 'chairman'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        // Pioneer Launch Rates (Slashed)
        const pioneerPrices = { 
            hustler: 1500, 
            oga: 3000, 
            chairman: 4500 
        };
        const amount = pioneerPrices[plan];

        const orderReference = `SUB-${plan.toUpperCase()}-${business._id}-${Date.now().toString().slice(-4)}`;
        const checkoutLink = await createNombaCheckoutOrder({
            amount,
            orderReference,
            customerEmail: req.user.email,
            customerName: business.displayName || 'Kredibly Merchant'
        });

        res.status(200).json({ success: true, checkoutLink });
    } catch (err) {
        console.error('❌ initializeNombaSubscription Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate checkout link' });
    }
};

/**
 * ⚡ INITIALIZE NOMBA VIRTUAL ACCOUNT
 */
exports.initializeNombaAccount = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;
        const sale = await Sale.findOne({
            $or: [
                { _id: invoiceId?.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                { invoiceNumber: invoiceId?.toUpperCase() },
                { publicSlug: invoiceId }
            ]
        }).populate('businessId');

        if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        const business = sale.businessId;
        const requestedAmount = amount || (sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0));

        if (requestedAmount <= 0) return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });

        let amountToCharge = requestedAmount;
        let gatewayFee = 0;

        if (business && business.prefersGatewayFeeAbsorption === false || String(business?.prefersGatewayFeeAbsorption) === 'false') {
            amountToCharge = FINANCIAL_CONFIG.calculateGrossAmount(requestedAmount);
            gatewayFee = amountToCharge - requestedAmount;
        }

        const existing = await VirtualAccount.findOne({
            saleId: sale._id,
            provider: 'nomba',
            amount: amountToCharge,
            status: 'active',
            expiresAt: { $gt: new Date() }
        });

        if (existing) {
            return res.status(200).json({
                success: true,
                data: {
                    accountNumber: existing.accountNumber,
                    bankName: existing.bankName,
                    accountName: existing.accountName,
                    amount: existing.amount,
                    baseAmount: requestedAmount,
                    gatewayFee: gatewayFee,
                    reference: existing.reference,
                    expiresAt: existing.expiresAt
                }
            });
        }

        const nombaData = await createDynamicVirtualAccount({
            amount: amountToCharge,
            invoiceNumber: sale.invoiceNumber,
            merchantName: business.displayName || 'Kredibly Merchant',
            customerEmail: sale.customerEmail || ''
        });

        const vaRecord = await VirtualAccount.create({
            businessId: business._id,
            saleId: sale._id,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: nombaData.accountNumber,
            bankName: nombaData.bankName,
            provider: 'nomba',
            reference: nombaData.reference,
            accountName: nombaData.accountName,
            amount: amountToCharge,
            baseAmount: requestedAmount,
            status: 'active',
            expiresAt: new Date(nombaData.expiresAt)
        });

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                bankName: vaRecord.bankName,
                accountName: vaRecord.accountName,
                amount: vaRecord.amount,
                baseAmount: vaRecord.baseAmount,
                gatewayFee: gatewayFee,
                reference: vaRecord.reference,
                expiresAt: vaRecord.expiresAt
            }
        });
    } catch (error) {
        console.error('❌ initializeNombaAccount Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate bank transfer details' });
    }
};

/**
 * 🔍 MANUALLY VERIFY NOMBA PAYMENT
 */
exports.verifyNombaPaymentStatus = async (req, res) => {
    try {
        const { accountRef } = req.body;
        if (!accountRef) return res.status(400).json({ success: false, message: 'Account reference required' });

        const va = await VirtualAccount.findOne({ reference: accountRef });
        if (!va) return res.status(404).json({ success: false, message: 'Virtual account not found' });

        // Check if already paid first to avoid redundant logging
        const sale = await Sale.findById(va.saleId);
        if (sale?.status === 'paid') {
            return res.status(200).json({ success: true, message: 'Already paid', data: { paid: true } });
        }

        console.log(`🔍 Checking Nomba payment status for ${accountRef}...`);
        const status = await checkPaymentStatusByReference(va.reference, va.accountNumber);

        if (status.paid) {
            const result = await internalProcessNombaPayment(
                va.reference,
                va.accountNumber,
                status.amount,
                status.transactionReference,
                status.payer,
                { data: { merchant: { walletBalance: status.walletBalance } } } // Mock payload for sweep
            );
            
            if (result.success) {
                return res.status(200).json({ success: true, message: result.message, data: status });
            } else {
                return res.status(400).json({ success: false, message: result.message });
            }
        }

        return res.status(200).json({ success: false, message: 'Payment not found or still pending.' });
    } catch (error) {
        console.error('❌ verifyNombaPaymentStatus Error:', error);
        res.status(500).json({ success: false, message: 'Status check failed' });
    }
};

/**
 * 🔔 HANDLE NOMBA PAYMENT WEBHOOK
 */
exports.handleNombaWebhook = async (req, res) => {
    console.log('⚡ Nomba Webhook Arrived:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ status: 'received' });

    try {
        const signature = req.headers['nomba-signature'] || req.headers['x-nomba-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        const isSandbox = process.env.NOMBA_ENV !== 'production';
        if (!isSandbox) {
            if (!signature || !verifyWebhookSignature(signature, rawBody)) {
                console.warn('🛡️ Nomba Webhook: Security violation (Invalid or missing signature)');
                return;
            }
        }

        const event = req.body;
        if (event.event_type !== 'payment_success' && event.event_type !== 'vact_transfer') {
            console.log(`ℹ️ Ignoring non-payment event: ${event.event_type}`);
            return;
        }

        const txData = event?.data?.transaction || {};
        const custData = event?.data?.customer || {};
        const legacyData = event?.data || {};

        const accountReference = txData?.aliasAccountReference || legacyData?.accountRef || legacyData?.accountReference || legacyData?.orderReference;
        const accountNumber = txData?.aliasAccountNumber || legacyData?.bankAccountNumber || legacyData?.accountNumber;
        const nombaTransactionRef = txData?.transactionId || txData?.sessionId || legacyData?.transactionReference || accountReference;
        const payer = custData?.senderName || legacyData?.payerName || legacyData?.customerName || 'Bank Transfer';
        
        let amountPaid = parseFloat(txData?.transactionAmount || legacyData?.amountPaid || legacyData?.amount || 0);

        if ((!accountReference && !accountNumber) || amountPaid <= 0) return;

        if (typeof accountReference === 'string' && accountReference.startsWith('SUB-')) {
            return await processSubscriptionWebhook(accountReference, amountPaid, payer, nombaTransactionRef);
        }

        await internalProcessNombaPayment(
            accountReference,
            accountNumber,
            amountPaid,
            nombaTransactionRef,
            payer,
            event // Pass the full webhook payload for balance syncing
        );

    } catch (err) {
        console.error('❌ Nomba Webhook Processing Error:', err);
    }
};

// In-memory lock to prevent simultaneous duplicate processing
const processingLocks = new Set();

/**
 * 🛠️ UNIFIED NOMBA PAYMENT PROCESSOR
 */
const internalProcessNombaPayment = async (accountReference, accountNumber, amount, transactionReference, payer, nombaPayload = null) => {
    try {
        // 🛡️ ATOMIC LOCK: Atomically mark the VA as 'processing'
        // This prevents race conditions across multiple server instances
        const vaRecord = await VirtualAccount.findOneAndUpdate(
            { 
                $or: [
                    { reference: accountReference, status: 'active' },
                    { accountNumber: accountNumber, status: 'active' }
                ]
            },
            { status: 'processing' },
            { new: true }
        );
        
        if (!vaRecord) {
            // Check if it was already used by a previous successful request
            const alreadyUsed = await VirtualAccount.findOne({ 
                $or: [{ reference: accountReference }, { accountNumber: accountNumber }],
                status: 'used' 
            });
            return { 
                success: !!alreadyUsed, 
                message: alreadyUsed ? "Already processed" : "Virtual account not found or already processing" 
            };
        }

        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) {
            return { success: false, message: "Sale record not found" };
        }

        if (sale.status === 'paid') {
            return { success: true, message: "Already paid" };
        }

        const isDuplicate = sale.payments?.some(p => 
            p.reference === accountReference || 
            p.reference === transactionReference ||
            p.reference === accountNumber
        );
        if (isDuplicate) {
            console.log(`ℹ️ Duplicate check hit early for Ref ${accountReference}`);
            vaRecord.status = 'used';
            await vaRecord.save();
            return { success: true, message: "Already processed" };
        }

        // If the amount paid matches our (potentially rounded) expected amount, we credit the merchant the exact baseAmount.
        const creditAmount = (vaRecord.amount && Math.abs(amount - vaRecord.amount) < 15) ? (vaRecord.baseAmount || amount) : amount;
        const netToWallet = FINANCIAL_CONFIG.calculateNetAmount(amount);
        const business = sale.businessId;

        // 🛡️ ATOMIC UPDATE: Only push if the reference doesn't already exist
        // This is the final line of defense against duplicates
        const updatedSale = await Sale.findOneAndUpdate(
            { 
                _id: sale._id, 
                "payments.reference": { $ne: accountReference },
                "payments.externalReference": { $ne: transactionReference }
            },
            { 
                $push: { 
                    payments: {
                        amount: creditAmount,
                        method: 'Nomba',
                        reference: accountReference, // 🔑 Always use our internal reference for consistency
                        externalReference: transactionReference, // Keep the provider's ref too
                        date: new Date()
                    } 
                } 
            },
            { new: true }
        );

        if (!updatedSale) {
            // This means the reference was already there (duplicate)
            console.log(`ℹ️ Duplicate payment detected for Sale ${sale.invoiceNumber} with Ref ${accountReference}`);
            vaRecord.status = 'used';
            await vaRecord.save();
            return { success: true, message: "Already processed" };
        }

        vaRecord.status = 'used';
        await vaRecord.save();

        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: netToWallet } });
        const currentWalletBalance = (await BusinessProfile.findById(business._id)).walletBalance;

        // 🔔 Socket Notification (Instant UI Update)
        try {
            const { getIO } = require('../../utils/socket');
            const io = getIO();
            if (io) {
                const totalPaid = updatedSale.payments.reduce((sum, p) => sum + p.amount, 0);
                const newBalance = Math.max(0, updatedSale.totalAmount - totalPaid);
                const payload = { 
                    saleId: updatedSale._id, 
                    invoiceNumber: updatedSale.invoiceNumber, 
                    amountPaid: creditAmount,
                    totalPaid: totalPaid,
                    newBalance: newBalance,
                    status: updatedSale.status
                };
                io.to(business._id.toString().toLowerCase()).emit('sale_updated', payload);
                io.to(`invoice:${sale.invoiceNumber.toLowerCase()}`).emit('sale_updated', payload);
                io.to(`invoice:${sale._id.toString().toLowerCase()}`).emit('sale_updated', payload);
            }
        } catch (sErr) { console.error("Socket error:", sErr.message); }

        // 🔔 Persistent Notification (Bell Icon)
        try {
            const Notification = require('../../models/Notification');
            await Notification.create({
                businessId: business._id,
                title: "Payment Received",
                message: `₦${creditAmount.toLocaleString()} received for invoice #${sale.invoiceNumber}`,
                type: "payment",
                saleId: sale._id
            });

            // 📜 Log to Activity Stream
            const ActivityLog = require('../../models/ActivityLog');
            await ActivityLog.create({
                businessId: business._id,
                action: 'PAYMENT_RECEIVED',
                entityType: 'PAYMENT',
                entityId: sale._id,
                details: `Nomba payment of ₦${creditAmount.toLocaleString()} verified for Invoice #${sale.invoiceNumber} (${sale.customerName || 'Customer'})`
            });
        } catch (nErr) { console.error("Notification/Activity error:", nErr.message); }

        // 🚀 BACKGROUND TASK: Execute Sweep "Underground"
        // We do NOT await this so the user gets an instant response
        (async () => {
            try {
                // Execute Sweep
                let nombaActualBalance = parseFloat(nombaPayload?.data?.merchant?.walletBalance || 0);
                
                if (!nombaPayload || nombaActualBalance === 0) {
                    const { getMerchantBalance } = require('../../utils/nomba');
                    const realTimeBalance = await getMerchantBalance();
                    if (realTimeBalance !== null) {
                        nombaActualBalance = realTimeBalance;
                    }
                }

                /* 🛡️ KYC COMPLIANCE CHECK (The Payout Guard) - [TEMPORARY BYPASS FOR PIONEER PHASE]
                if (business.kyc?.status !== 'verified') {
                    console.log(`🛡️ KYC HOLD: Merchant ${business.displayName} is not verified. Holding ₦${amount} in Escrow.`);
                    
                    const EscrowPayment = require('../../models/EscrowPayment');
                    await EscrowPayment.create({
                        businessId: business._id,
                        saleId: sale._id,
                        amount: amount,
                        reference: transactionReference || accountReference,
                        status: 'pending',
                        releaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days if never verified
                    });

                    // 🛡️ Track the held amount in profile for UI
                    await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { heldBalance: amount } });

                    // 🛡️ Log Activity for Feed
                    const ActivityLog = require('../../models/ActivityLog');
                    await ActivityLog.create({
                        businessId: business._id,
                        action: 'KYC_HOLD',
                        entityType: 'PAYMENT',
                        entityId: sale._id,
                        details: `₦${amount.toLocaleString()} held in escrow. Merchant is not verified.`
                    });

                    // 🔔 Notify Merchant via WhatsApp about the HOLD
                    if (business.whatsappNumber) {
                        const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');
                        const kycMsg = `Chief! ₦${amount.toLocaleString()} has been received for Invoice #${sale.invoiceNumber}. 💰\n\n🛡️ *KYC HOLD:* To release this money to your bank account instantly, please complete your identity verification on your dashboard.`;
                        await sendWhatsAppAlert(business.whatsappNumber, "Boss", kycMsg).catch(e => console.error("KYC Hold WA Fail:", e.message));
                    }
                    return; // ⛔ STOP THE SWEEP
                }
                */

                const bankDetails = business.bankDetails;
                const delay = 15000;
                const threshold = 0; // 🚀 PLATFORM COVERS FEE: Merchant gets full amount. We cover the Nomba transfer charge from our main balance.

                if (bankDetails?.bankCode && bankDetails?.accountNumber && nombaActualBalance > 5) {
                    const sweepAmount = Math.floor(nombaActualBalance);
                    if (sweepAmount > 0) {
                        console.log(`⚡ Underground Settlement Started (₦${sweepAmount}) - Waiting ${delay/1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        
                        const { initiateTransfer } = require('../../utils/nomba');
                        await initiateTransfer({
                            amount: sweepAmount,
                            bankCode: bankDetails.bankCode,
                            accountNumber: bankDetails.accountNumber,
                            accountName: bankDetails.accountName || business.displayName,
                            narration: `Kredibly Settlement (Auto)`
                        });
                        console.log(`✅ Underground Settlement SUCCESS (₦${sweepAmount})`);
                        // Deduct only the swept amount. The fee is covered by Kredibly.
                        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: -sweepAmount } });

                        // 🔔 Notify Merchant Dashboard
                        try {
                            const { getIO } = require('../../utils/socket');
                            const io = getIO();
                            if (io) {
                                io.to(business._id.toString().toLowerCase()).emit('settlement_success', {
                                    amount: sweepAmount,
                                    message: `₦${sweepAmount.toLocaleString()} has been settled to your bank account!`,
                                    timestamp: new Date()
                                });
                            }
                        } catch (sErr) { console.error("Settlement socket error:", sErr.message); }

                        // 🔔 Persistent Notification (Bell Icon)
                        try {
                            const Notification = require('../../models/Notification');
                            await Notification.create({
                                businessId: business._id,
                                title: "Settlement Successful",
                                message: `₦${sweepAmount.toLocaleString()} has been settled to your bank account.`,
                                type: "confirmation"
                            });
                        } catch (nErr) { console.error("Settlement notification error:", nErr.message); }
                    }
                }
            } catch (sweepErr) {
                console.error(`❌ Underground Sweep FAILED:`, sweepErr.message);
            }
        })();

        // WhatsApp Notification (Background)
        if (business.whatsappNumber) {
            const { sendWhatsAppPaymentAlert } = require('../whatsapp/whatsappController');
            sendWhatsAppPaymentAlert(business.whatsappNumber, creditAmount, sale.invoiceNumber, sale.customerName || payer, "", business.displayName, "");
        }

        return { success: true, message: "Payment processed!" };
    } catch (err) {
        console.error('❌ internalProcessNombaPayment Error:', err);
        // Rollback VA status if something failed during processing
        if (accountReference || accountNumber) {
            await VirtualAccount.updateOne(
                { 
                    $or: [
                        { reference: accountReference, status: 'processing' },
                        { accountNumber: accountNumber, status: 'processing' }
                    ]
                },
                { status: 'active' }
            ).catch(e => console.error("Lock rollback failed:", e.message));
        }
        return { success: false, message: err.message };
    }
};

/**
 * 🏆 PROCESS SUBSCRIPTION PLAN UPGRADES
 */
async function processSubscriptionWebhook(reference, amount, payer, txRef) {
    try {
        const Payment = require("../../models/Payment");
        const parts = reference.split('-');
        const plan = parts[1].toLowerCase();
        const businessId = parts[2];
        const billingCycle = 'monthly'; 

        // 🛡️ ATOMIC LOCK: Create the payment record with unique reference
        // This ensures that even across multiple servers, only one process continues.
        try {
            await Payment.create({
                businessId,
                reference: txRef || reference,
                amount,
                plan,
                billingCycle,
                status: 'success',
                paidAt: new Date()
            });
            // Log revenue for platform stats
            logUsage("revenue", { amount }).catch(e => console.error("Log fail:", e));
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                console.log(`ℹ️ Subscription ${txRef || reference} already logged.`);
                return;
            }
            throw dbErr;
        }

        const business = await BusinessProfile.findById(businessId);
        if (!business) return;

        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        business.plan = plan;
        business.planStatus = 'active';
        business.trialExpiresAt = nextBilling;
        business.subscriptionHistory.push({ 
            date: new Date(), 
            plan, 
            amount, 
            reference: txRef || reference, 
            provider: 'nomba', 
            expiresAt: nextBilling 
        });

        await business.save();
        if (business.whatsappNumber) {
            const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');
            const msg = `🎉 *Upgrade Successful!*\n\nHigh Power! Your Kredibly subscription has been upgraded to *${plan.toUpperCase()}*.`;
            await sendWhatsAppAlert(business.whatsappNumber, "Chief", msg).catch(e => console.error("WA Sub Alert Fail:", e.message));
        }
    } catch (error) { 
        console.error('❌ Subscription Webhook Error:', error); 
    }
}

exports.processDailyNombaSettlements = async () => {
    // Standard batch settlement logic...
};
