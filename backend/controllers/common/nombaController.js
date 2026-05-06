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

        if (!['oga', 'chairman'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const basePrices = { oga: 6000, chairman: 9000 };
        let amount = basePrices[plan];

        if (billingCycle === 'launch' && new Date() < new Date('2026-06-01')) {
            amount = amount * 0.5;
        }

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

        console.log(`🔍 Manually verifying Nomba payment for ${accountRef}...`);
        const status = await checkPaymentStatusByReference(va.reference, va.accountNumber);

        if (status.paid) {
            const result = await internalProcessNombaPayment(
                va.accountReference || accountRef,
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
    // 🛡️ Lock to prevent simultaneous double-processing
    const lockKey = `${transactionReference}`;
    if (processingLocks.has(lockKey)) return { success: true, message: "Processing in progress" };
    processingLocks.add(lockKey);

    try {
        let vaRecord = await VirtualAccount.findOne({ reference: accountReference });
        if (!vaRecord && accountNumber) {
            vaRecord = await VirtualAccount.findOne({ accountNumber: accountNumber, status: 'active' });
        }
        
        if (!vaRecord) {
            processingLocks.delete(lockKey);
            return { success: false, message: "Virtual account not found" };
        }

        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) {
            processingLocks.delete(lockKey);
            return { success: false, message: "Sale record not found" };
        }

        if (sale.status === 'paid') {
            processingLocks.delete(lockKey);
            return { success: true, message: "Already paid" };
        }

        const isDuplicate = sale.payments?.some(p => p.reference === transactionReference);
        if (isDuplicate) {
            processingLocks.delete(lockKey);
            return { success: true, message: "Already processed" };
        }

        const creditAmount = (vaRecord.amount && Math.abs(amount - vaRecord.amount) < 2) ? (vaRecord.baseAmount || amount) : amount;
        const netToWallet = FINANCIAL_CONFIG.calculateNetAmount(amount);
        const business = sale.businessId;

        sale.payments.push({
            amount: creditAmount,
            method: 'Nomba',
            reference: transactionReference || accountReference,
            date: new Date()
        });
        
        await sale.save();
        vaRecord.status = 'used';
        await vaRecord.save();

        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: netToWallet } });
        const updatedBusiness = await BusinessProfile.findById(business._id);
        const currentWalletBalance = updatedBusiness.walletBalance;

        // 🔔 Socket Notification (Instant UI Update)
        try {
            const { getIO } = require('../../utils/socket');
            const io = getIO();
            if (io) {
                const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                const newBalance = Math.max(0, sale.totalAmount - totalPaid);
                const payload = { 
                    saleId: sale._id, 
                    invoiceNumber: sale.invoiceNumber, 
                    amountPaid: creditAmount,
                    totalPaid: totalPaid,
                    newBalance: newBalance,
                    status: sale.status
                };
                io.to(business._id.toString().toLowerCase()).emit('sale_updated', payload);
                io.to(`invoice:${sale.invoiceNumber.toLowerCase()}`).emit('sale_updated', payload);
                io.to(`invoice:${sale._id.toString().toLowerCase()}`).emit('sale_updated', payload);
            }
        } catch (sErr) { console.error("Socket error:", sErr.message); }

        // 🚀 BACKGROUND TASK: Execute Sweep "Underground"
        // We do NOT await this so the user gets an instant response
        (async () => {
            try {
                // Execute Sweep
                let nombaActualBalance = parseFloat(nombaPayload?.data?.merchant?.walletBalance || 0);
                
                // 🔄 Manual Verification Fallback: If no payload (manual click) OR payload balance is 0, fetch real-time
                if (!nombaPayload || nombaActualBalance === 0) {
                    const { getMerchantBalance } = require('../../utils/nomba');
                    const realTimeBalance = await getMerchantBalance();
                    if (realTimeBalance !== null) {
                        nombaActualBalance = realTimeBalance;
                        console.log(`💰 Real-time Nomba Balance: ₦${nombaActualBalance}`);
                    } else {
                        console.warn('⚠️ Could not verify real-time balance. Skipping auto-sweep for safety.');
                        nombaActualBalance = 0;
                    }
                }

                const bankDetails = business.bankDetails;
                const isLocked = bankDetails?.bankDetailsLockUntil && new Date() < new Date(bankDetails.bankDetailsLockUntil);
                const threshold = 100; 
                const delay = 15000; // 15s underground delay

                if (bankDetails?.bankCode && bankDetails?.accountNumber && !isLocked && !business.isCompromised && nombaActualBalance > threshold) {
                    const sweepAmount = Math.floor(nombaActualBalance - threshold);
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
                        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: -(sweepAmount + threshold) } });
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

        processingLocks.delete(lockKey);
        return { success: true, message: "Payment processed!" };
    } catch (err) {
        processingLocks.delete(lockKey);
        console.error('❌ internalProcessNombaPayment Error:', err);
        return { success: false, message: err.message };
    }
};

/**
 * 🏆 PROCESS SUBSCRIPTION PLAN UPGRADES
 */
async function processSubscriptionWebhook(reference, amount, payer, txRef) {
    try {
        const parts = reference.split('-');
        const plan = parts[1].toLowerCase();
        const businessId = parts[2];

        const business = await BusinessProfile.findById(businessId);
        if (!business) return;

        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        business.plan = plan;
        business.planStatus = 'active';
        business.trialExpiresAt = nextBilling;
        business.subscriptionHistory.push({ date: new Date(), plan, amount, reference: txRef, provider: 'nomba', expiresAt: nextBilling });

        await business.save();
        if (business.whatsappNumber) {
            const msg = `🎉 *Upgrade Successful!*\n\nHigh Power! Your Kredibly subscription has been upgraded to *${plan.toUpperCase()}*.`;
            await sendWhatsAppAlert(business.whatsappNumber, msg);
        }
    } catch (error) { console.error('❌ Subscription Webhook Error:', error); }
}

exports.processDailyNombaSettlements = async () => {
    // Standard batch settlement logic...
};
