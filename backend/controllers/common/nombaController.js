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
 * Creates a hosted checkout link securely using the date promo logic.
 * Route: POST /api/payments/initialize-subscription
 */
exports.initializeNombaSubscription = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

        if (!['oga', 'chairman'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const basePrices = {
            oga: 6000,
            chairman: 9000
        };

        let amount = basePrices[plan];

        // Ensure Date Promo Logic is computed server-side
        if (billingCycle === 'launch' && new Date() < new Date('2026-06-01')) {
            amount = amount * 0.5; // 50% discount
        }

        const orderReference = `SUB-${plan.toUpperCase()}-${business._id}-${Date.now().toString().slice(-4)}`;

        const checkoutLink = await createNombaCheckoutOrder({
            amount,
            orderReference,
            customerEmail: req.user.email,
            customerName: business.displayName || 'Kredibly Merchant'
        });

        res.status(200).json({
            success: true,
            checkoutLink
        });

    } catch (err) {
        console.error('❌ initializeNombaSubscription Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate checkout link' });
    }
};

/**
 * ⚡ INITIALIZE NOMBA VIRTUAL ACCOUNT
 * Called when customer opens invoice and clicks "Pay via Bank Transfer"
 * Generates a unique dynamic VA tied to this exact invoice amount.
 * Route: POST /api/payments/initialize-nomba-account
 */
exports.initializeNombaAccount = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;

        // 1. Find the sale
        const sale = await Sale.findOne({
            $or: [
                { _id: invoiceId?.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                { invoiceNumber: invoiceId?.toUpperCase() },
                { publicSlug: invoiceId }
            ]
        }).populate('businessId');

        if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        const business = sale.businessId;
        if (business && business.prefersGatewayFeeAbsorption === undefined) {
            business.prefersGatewayFeeAbsorption = true;
        }
        const requestedAmount = amount || (sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0));

        if (requestedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
        }

        // 🛡️ SMART FEE CALCULATION
        // Nomba takes ~0.75% and Auto-sweep takes ₦50.
        // If merchant passes fees to customer, we adjust the total so the merchant gets EXACTLY requestedAmount.
        let amountToCharge = requestedAmount;
        let gatewayFee = 0;

        if (!business.prefersGatewayFeeAbsorption) {
            // Use Centralized Calculator
            amountToCharge = FINANCIAL_CONFIG.calculateGrossAmount(requestedAmount);
            gatewayFee = amountToCharge - requestedAmount;
            console.log(`⚖️ Fee Passing: Base=₦${requestedAmount}, Fee=₦${gatewayFee}, Total=₦${amountToCharge}`);
        }

        const existing = await VirtualAccount.findOne({
            saleId: sale._id,
            provider: 'nomba',
            amount: amountToCharge, // ⚡ CRITICAL: Only reuse if amount matches exactly
            status: 'active',
            expiresAt: { $gt: new Date() }
        });

        if (existing) {
            console.log(`🔄 Reusing existing Nomba VA for Invoice ${sale.invoiceNumber}`);
            return res.status(200).json({
                success: true,
                data: {
                    accountNumber: existing.accountNumber,
                    bankName: existing.bankName,
                    accountName: existing.accountName || (business.displayName ? `KREDS/${business.displayName.toUpperCase()}` : `Pay Invoice ${sale.invoiceNumber}`),
                    amount: existing.amount,
                    baseAmount: requestedAmount,
                    gatewayFee: gatewayFee,
                    reference: existing.reference,
                    expiresAt: existing.expiresAt,
                    expiresIn: '45 minutes'
                }
            });
        }

        // 3. Create a fresh Nomba Dynamic Virtual Account
        console.log(`🟢 Creating Nomba DVA for Invoice ${sale.invoiceNumber} — ₦${amountToCharge}`);
        
        let nombaData;
        try {
            nombaData = await createDynamicVirtualAccount({
                amount: amountToCharge,
                invoiceNumber: sale.invoiceNumber,
                merchantName: business.displayName || 'Kredibly Merchant',
                customerEmail: sale.customerEmail || ''
            });
        } catch (nombaErr) {
            console.error('❌ Nomba DVA Creation Failed:', nombaErr.message);
            return res.status(503).json({
                success: false,
                message: 'Bank transfer temporarily unavailable. Please use card payment.',
                nomba_error: nombaErr.message
            });
        }

        // 4. Save VA record to DB
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
                financialConfig: FINANCIAL_CONFIG.NOMBA,
                reference: vaRecord.reference,
                expiresAt: vaRecord.expiresAt,
                expiresIn: '45 minutes'
            }
        });

    } catch (error) {
        console.error('❌ initializeNombaAccount Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate bank transfer details' });
    }
};

/**
 * 🔍 MANUALLY VERIFY NOMBA PAYMENT (Fallback for localhost/webhooks)
 * Route: POST /api/payments/verify-nomba-payment
 */
exports.verifyNombaPaymentStatus = async (req, res) => {
    try {
        const { accountRef, saleId } = req.body;
        if (!accountRef) return res.status(400).json({ success: false, message: 'Account reference required' });

        const va = await VirtualAccount.findOne({ reference: accountRef });
        if (!va) return res.status(404).json({ success: false, message: 'Virtual account not found' });

        console.log(`🔍 Manually verifying Nomba payment for ${accountRef}...`);
        const status = await checkPaymentStatusByReference(va.reference, va.accountNumber);

        if (status.paid) {
            // Trigger the same processing logic as the webhook
            const result = await internalProcessNombaPayment({
                accountReference: accountRef,
                amount: status.amount,
                transactionReference: status.transactionReference,
                payer: status.payer
            });
            
            if (result.success) {
                return res.status(200).json({ 
                    success: true, 
                    message: result.message || 'Payment verified and processed!',
                    data: status 
                });
            } else {
                return res.status(400).json({ success: false, message: result.message });
            }
        }

        return res.status(200).json({ 
            success: false, 
            message: 'Payment not found or still pending. Please wait 1-2 minutes after transfer.' 
        });
    } catch (error) {
        console.error('❌ verifyNombaPaymentStatus Error:', error);
        res.status(500).json({ success: false, message: 'Status check failed' });
    }
};

/**
 * 🔔 HANDLE NOMBA PAYMENT WEBHOOK
 * Nomba fires this when a customer successfully pays into a virtual account.
 * Route: POST /api/payments/webhook/nomba
 */
exports.handleNombaWebhook = async (req, res) => {
    // 1. Always respond FAST to Nomba (< 5s) to prevent retry storms
    res.status(200).json({ status: 'received' });

    try {
        const signature = req.headers['nomba-signature'] || req.headers['x-nomba-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        // 🛡️ DEBUG LOGGING: Capture webhook for analysis (Remove after verify)
        try {
            const mongoose = require('mongoose');
            const SystemLog = mongoose.models.SystemLog || mongoose.model('SystemLog', new mongoose.Schema({ type: String, data: Object, createdAt: { type: Date, default: Date.now } }));
            await SystemLog.create({ 
                type: 'NOMBA_WEBHOOK', 
                data: { 
                    header: req.headers, 
                    body: req.body,
                    url: req.originalUrl
                } 
            });
        } catch (e) { console.error('Logging failed', e); }

        // ⚠️ Skip signature check in sandbox mode for now
        const isSandbox = process.env.NOMBA_ENV !== 'production';
        if (!isSandbox && signature) {
            const isValid = verifyWebhookSignature(signature, rawBody);
            if (!isValid) {
                console.warn('🛡️ Nomba Webhook: Invalid signature — ignoring');
                return;
            }
        }

        const event = req.body;
        const eventType = event?.event_type || event?.type || event?.event;
        console.log(`🟢 Nomba Webhook received: event_type=${eventType}, requestId=${event?.requestId}`);

        const acceptedEvents = [
            'payment_success', 'payment.success', 
            'charge.success', 'charge_success', 
            'transaction.success', 'transaction_success',
            'order_payment_success', 'order.payment.success',
            'SUCCESS', 'CREDIT'
        ];
        
        const txData = event?.data?.transaction || {};    // DVA transaction data
        const custData = event?.data?.customer || {};     // Payer info
        const legacyData = event?.data || {};             // Fallback for old checkout payloads

        // Check if valid event or has DVA transaction data
        const hasValidEvent = acceptedEvents.includes(eventType);
        const hasDVAPayload = !!(txData?.aliasAccountReference);
        
        if (!hasValidEvent && !hasDVAPayload) {
            console.log(`ℹ️ Nomba Webhook: Ignored event type "${eventType}"`);
            return;
        }

        // Extract using the REAL field names from confirmed payload
        const accountReference = txData?.aliasAccountReference   // ← Real DVA ref (KREDINV-...)
            || legacyData?.accountRef
            || legacyData?.accountReference
            || legacyData?.orderReference;

        const accountNumber = txData?.aliasAccountNumber         // ← Virtual bank account number
            || legacyData?.bankAccountNumber
            || legacyData?.accountNumber;

        const nombaTransactionRef = txData?.transactionId        // ← Nomba's internal ref
            || txData?.sessionId
            || legacyData?.transactionReference
            || accountReference;

        const payer = custData?.senderName                       // ← Real sender name
            || legacyData?.payerName
            || legacyData?.customerName
            || 'Bank Transfer';

        // DVA transactionAmount is already in NAIRA. Legacy amountPaid might be kobo.
        let amountPaid = parseFloat(txData?.transactionAmount || legacyData?.amountPaid || legacyData?.amount || 0);
        
        // Only apply kobo→naira conversion for legacy checkout payloads (no txData)
        if (!txData?.transactionAmount) {
            const strVal = amountPaid.toString();
            if (!strVal.includes('.') && amountPaid > 1000) {
                amountPaid = amountPaid / 100;
            }
        }

        console.log(`💰 Extracted: ref=${accountReference}, acct=${accountNumber}, amount=₦${amountPaid}, payer=${payer}`);

        if ((!accountReference && !accountNumber) || amountPaid <= 0) {
            console.warn('⚠️ Nomba Webhook: Missing reference/accountNumber or amount — ignoring');
            console.warn('⚠️ Payload top-level keys:', Object.keys(event || {}).join(', '));
            return;
        }

        // 4. Intercept Subscriptions
        if (typeof accountReference === 'string' && accountReference.startsWith('SUB-')) {
            console.log(`🚀 Nomba Webhook: Subscription payment detected for ${accountReference}`);
            return await processSubscriptionWebhook(accountReference, amountPaid, payer, nombaTransactionRef);
        }

        // 5. Trigger unified processing logic
        await internalProcessNombaPayment({
            accountReference,
            accountNumber,
            amount: amountPaid,
            transactionReference: nombaTransactionRef,
            payer
        });


    } catch (err) {
        console.error('❌ Nomba Webhook Processing Error:', err);
    }
};

/**
 * 🏆 PROCESS SUBSCRIPTION PLAN UPGRADES
 * Triggers when Nomba confirms payment for a Nomba Hosted Checkout
 */
async function processSubscriptionWebhook(reference, amount, payer, txRef) {
    try {
        const parts = reference.split('-');
        if (parts.length < 3) return console.error('❌ Invalid subscription reference:', reference);
        
        const plan = parts[1].toLowerCase();
        const businessId = parts[2];

        const business = await BusinessProfile.findById(businessId);
        if (!business) return console.error('❌ Subscription webhook: Business not found', businessId);

        // Calculate Next Billing Date
        const currentExpiry = business.trialExpiresAt;
        const now = new Date();
        const start = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
        const nextBilling = new Date(start);
        nextBilling.setMonth(nextBilling.getMonth() + 1); // Add 1 month

        const oldPlan = business.plan;
        
        // Update Business
        business.plan = plan;
        business.planStatus = 'active';
        business.trialExpiresAt = nextBilling;

        if (!business.subscriptionHistory) business.subscriptionHistory = [];
        business.subscriptionHistory.push({
            date: new Date(),
            plan: plan,
            amount,
            reference: txRef,
            provider: 'nomba',
            billingCycle: 'monthly',
            expiresAt: nextBilling
        });

        await business.save();

        console.log(`✅ ${business.displayName} upgraded to ${plan.toUpperCase()}! Next bill: ${nextBilling.toISOString()}`);

        // Welcome Message (WhatsApp Nudge)
        if (business.whatsappNumber) {
            const msg = `🎉 *Upgrade Successful!*\n\nHigh Power! Your Kredibly subscription has been upgraded to the *${plan.toUpperCase()}* plan.\n\nEnjoy the premium features boss! 🔥`;
            await sendWhatsAppAlert(business.whatsappNumber, msg);
        }

    } catch (error) {
        console.error('❌ Subscription Webhook Error:', error);
    }
}

/**
 * 🛠️ UNIFIED NOMBA PAYMENT PROCESSOR
 * Handles idempotency, ledger updates, notifications, and auto-sweeps.
 */
async function internalProcessNombaPayment({ accountReference, accountNumber, amount, transactionReference, payer }) {
    try {
        // 1. Find matching Virtual Account
        // Try by our reference (KREDINV-...) first, then fallback to Nomba's accountNumber
        let vaRecord = accountReference 
            ? await VirtualAccount.findOne({ reference: accountReference })
            : null;
        
        if (!vaRecord && accountNumber) {
            // Fallback: find active VA by the actual bank account number Nomba assigned
            vaRecord = await VirtualAccount.findOne({ 
                accountNumber: accountNumber,
                status: 'active'
            });
            if (vaRecord) console.log(`✅ VA found via accountNumber fallback: ${accountNumber}`);
        }
        
        if (!vaRecord) {
            console.warn(`⚠️ Payment Processor: No VA record found for ref=${accountReference} / acct=${accountNumber}`);
            return { success: false, message: "Virtual account not found" };
        }

        // 2. Find the sale
        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) {
            console.error(`❌ Payment Processor: Sale not found for VA ${vaRecord._id}`);
            return { success: false, message: "Sale record not found" };
        }

        // 3. Idempotency check — don't double-process the same payment
        const isDuplicate = sale.payments?.some(p => 
            p.reference === transactionReference || 
            (p.method === 'Nomba' && Math.abs(p.amount - amount) < 0.1 && Math.abs(new Date() - new Date(p.date)) < 300000)
        );

        if (isDuplicate) {
            console.log(`🔁 Payment Processor: Already processed ${transactionReference} — skipping`);
            return { success: true, message: "Already processed" };
        }

        // 4. Record the payment on the invoice
        const creditAmount = vaRecord.baseAmount || amount;
        
        // ⚡ SMART SETTLEMENT: Calculate what actually lands in merchant's pocket
        // ⚡ SMART SETTLEMENT: Calculate what actually lands in merchant's pocket
        const netToWallet = FINANCIAL_CONFIG.calculateNetAmount(amount);
        
        // Ensure business is captured before save to avoid de-population issues
        const business = sale.businessId;

        sale.payments.push({
            amount: creditAmount,
            method: 'Nomba',
            reference: transactionReference || accountReference,
            date: new Date()
        });
        
        await sale.save(); // Triggers status flip logic in Sale.js

        // 5. Mark VA as used
        vaRecord.status = 'used';
        await vaRecord.save();
        
        const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        const balanceRemaining = sale.totalAmount - totalPaid;

        // 6. Update internal wallet balance FIRST
        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: netToWallet } });
        const updatedBusiness = await BusinessProfile.findById(business._id);
        const currentWalletBalance = updatedBusiness.walletBalance;

        console.log(`💰 Merchant Wallet Updated: Business ${business?._id}, New Balance=₦${currentWalletBalance}`);

        // 7. Check Sweep Threshold
        const bankDetails = business.bankDetails;
        const isLocked = bankDetails?.bankDetailsLockUntil && new Date() < new Date(bankDetails.bankDetailsLockUntil);
        const threshold = FINANCIAL_CONFIG.NOMBA.MIN_INSTANT_SWEEP || 5000;
        const meetsThreshold = currentWalletBalance >= threshold;

        // 8. Notifications & Kreddy Alert
        if (business.whatsappNumber) {
            const receiptLink = `https://usekredibly.com/r/${sale.invoiceNumber}`;
            const statusLine = balanceRemaining <= 0
                ? '✅ Fully Paid!'
                : `⏳ Balance Remaining: ₦${balanceRemaining.toLocaleString()}`;

            let customText = "";
            let msg = `💰 *Bank Transfer Received!*\n\nHigh power! ₦${creditAmount.toLocaleString()} just landed for *Invoice #${sale.invoiceNumber}* (${sale.customerName || payer}).\n\n`;
            
            if (isLocked) {
                customText += `🛡️ *Security:* Since you recently updated your bank details, settlements are escrowed for 24h. \n\n`;
                msg += `🛡️ *Security:* Since you recently updated your bank details, settlements are escrowed for 24h. \n\n`;
            } else if (!meetsThreshold) {
                customText += `🛡️ *Settlement:* Because your wallet balance is under ₦${threshold.toLocaleString()}, this will automatically drop in your bank account tonight by 11:30 PM to save you transfer fees. 🚀\n\n`;
                msg += `🛡️ *Settlement:* Because your wallet balance is under ₦${threshold.toLocaleString()}, this will automatically drop in your bank account tonight by 11:30 PM to save you transfer fees. 🚀\n\n`;
            } else {
                customText += `🛡️ *Settlement:* Threshold met! Money is being swept to your bank account automatically right now. 🚀\n\n`;
                msg += `🛡️ *Settlement:* Threshold met! Money is being swept to your bank account automatically right now. 🚀\n\n`;
            }

            customText += statusLine;
            msg += statusLine;
            msg += `\n\n📄 *Receipt Link:* ${receiptLink}`;
            
            const { sendWhatsAppPaymentAlert } = require('../whatsapp/whatsappController');
            await sendWhatsAppPaymentAlert(
                business.whatsappNumber,
                creditAmount,
                sale.invoiceNumber,
                sale.customerName || payer,
                customText,
                business.displayName || 'Chief',
                msg
            ).catch(e => console.error("WA Fail:", e.message));
        }

        console.log(`✅ Nomba: ₦${creditAmount} recorded for Invoice #${sale.invoiceNumber}`);

        if (business) {
            await Notification.create({
                businessId: business._id,
                title: '💰 Payment Received',
                message: `₦${creditAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber} from ${sale.customerName || payer}.`,
                type: 'payment',
                saleId: sale._id
            });

            await logActivity({
                businessId: business._id,
                action: 'PAYMENT_RECEIVED',
                entityType: 'PAYMENT',
                entityId: sale._id,
                details: `Nomba payment of ₦${creditAmount.toLocaleString()} verified for Invoice #${sale.invoiceNumber} (${payer})`
            });
        }

        // 9. Execute Sweep if Threshold Met
        if (bankDetails?.bankCode && bankDetails?.accountNumber && !isLocked && !business.isCompromised) {
            if (meetsThreshold) {
                try {
                    const sweepAmount = currentWalletBalance - FINANCIAL_CONFIG.NOMBA.SWEEP_FEE_FLAT;
                    if (sweepAmount > 0) {
                        console.log(`⚡ Instant Settlement Triggered (₦${sweepAmount})...`);
                        
                        await new Promise(resolve => setTimeout(resolve, 3000));

                        const sweepRes = await initiateTransfer({
                            amount: sweepAmount,
                            bankCode: bankDetails.bankCode,
                            accountNumber: bankDetails.accountNumber,
                            accountName: bankDetails.accountName || business.displayName,
                            narration: `Kredibly Settlement (Instant)`
                        });
                        
                        // Deduct from wallet since we swept everything
                        await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { walletBalance: -currentWalletBalance } });
                        console.log(`✅ Auto-swept ₦${sweepAmount} instantly. Ref: ${sweepRes?.data?.transactionId || 'N/A'}`);
                    }
                } catch (sweepErr) {
                    console.error(`❌ Auto-sweep FAILED for ${business._id}:`, sweepErr.message);
                }
            } else {
                console.log(`🛡️ Auto-sweep SKIPPED: Balance (₦${currentWalletBalance}) under threshold (₦${threshold}). Funds held in Kredibly wallet until 11:30 PM.`);
            }
        } else if (!meetsThreshold) {
            // Already handled by the meetsThreshold check above, just keeping the structure clean
        } else {
            console.log(`🛡️ Auto-sweep SKIPPED: Missing bank details or account locked.`);
        }

            // 9. Auto-detect UI refresh via Socket
            try {
                const { getIO } = require('../../utils/socket');
                const io = getIO();
                if (io && business) {
                    const payload = {
                        saleId: sale._id,
                        invoiceNumber: sale.invoiceNumber,
                        balance: balanceRemaining,
                        amountPaid: creditAmount
                    };
                    console.log(`🔌 Emitting sale_updated to rooms: business:${business?._id}, invoice:${sale.invoiceNumber}, invoice:${sale._id}`);
                    
                    // Emit to business room (merchant dashboard)
                    if (business && business._id) {
                        io.to(business._id.toString().toLowerCase()).emit('sale_updated', payload);
                    }
                    
                    // Emit to invoice-specific rooms.
                    // We normalize all IDs to lowercase to ensure matching regardless of case in URL
                    if (sale.invoiceNumber) {
                        io.to(`invoice:${sale.invoiceNumber.toLowerCase()}`).emit('sale_updated', payload);
                    }
                    if (sale._id) {
                        io.to(`invoice:${sale._id.toString().toLowerCase()}`).emit('sale_updated', payload);
                    }
                    if (sale.publicSlug) {
                        io.to(`invoice:${sale.publicSlug.toLowerCase()}`).emit('sale_updated', payload);
                    }
                }
            } catch (socketErr) {
                console.error("❌ Socket emit error in nombaController:", socketErr.message);
            }



            // 10. Track Platform Metrics
            logUsage("revenue", { amount: creditAmount }).catch(e => console.error("Revenue log fail:", e));
            logUsage("merchant_fee", { amount: creditAmount }).catch(e => console.error("Fee log fail:", e));

        return { success: true, message: "Payment processed and ledger updated!" };
    } catch (err) {
        console.error('❌ internalProcessNombaPayment Error:', err);
        return { success: false, message: "Internal processing error: " + err.message };
    }
};

/**
 * 🧹 DAILY BATCH SETTLEMENT
 * Sweeps all accumulated wallet balances to merchants.
 * This runs at midnight to ensure merchants get their money daily but only pay one ₦50 fee.
 */
exports.processDailyNombaSettlements = async () => {
    console.log("🚀 Starting Daily Nomba Batch Settlements...");
    const businesses = await BusinessProfile.find({ walletBalance: { $gt: 100 } }); // Must be > 100 to cover fee + meaningful sweep
    
    let processed = 0;
    for (const biz of businesses) {
        // 🛡️ Safety Checks
        if (!biz.bankDetails?.bankCode || !biz.bankDetails?.accountNumber) continue;
        if (biz.isCompromised) continue;
        
        // Ensure security lock isn't active
        const isLocked = biz.bankDetails?.bankDetailsLockUntil && new Date() < new Date(biz.bankDetails.bankDetailsLockUntil);
        if (isLocked) {
            console.log(`🛡️ Skipping batch sweep for ${biz.displayName}: Security lock active.`);
            continue;
        }

        try {
            const totalBalance = biz.walletBalance;
            const fee = 50; // Nomba's standard transfer fee
            const amountToSweep = totalBalance - fee;

            if (amountToSweep <= 0) continue;

            console.log(`💸 Sweeping ₦${amountToSweep} for ${biz.displayName} (Total Balance: ₦${totalBalance})`);
            
            await initiateTransfer({
                amount: amountToSweep,
                bankCode: biz.bankDetails.bankCode,
                accountNumber: biz.bankDetails.accountNumber,
                accountName: biz.bankDetails.accountName || biz.displayName,
                narration: `Kredibly Settlement - ${new Date().toLocaleDateString()}`
            });
            
            // Success! Reset wallet
            biz.walletBalance = 0;
            await biz.save();
            processed++;

            // 📱 Notify Merchant (Optional: High-value only or daily summary)
            if (biz.whatsappNumber) {
                const msg = `💰 *Daily Settlement Complete!*\n\nHigh Power! I've just swept your daily total of *₦${amountToSweep.toLocaleString()}* to your bank account.\n\n_Note: A ₦50 fee was deducted by the bank for the transfer._`;
                await sendWhatsAppAlert(biz.whatsappNumber, msg).catch(e => console.error("Batch Notify Fail:", e));
            }

        } catch (err) {
            console.error(`❌ Batch Sweep FAILED for ${biz.displayName}:`, err.message);
        }
    }
    console.log(`✅ Batch Settlement Finished: Processed ${processed} merchants.`);
    return { processed };
};
