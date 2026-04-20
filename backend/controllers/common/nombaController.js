const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const VirtualAccount = require('../../models/VirtualAccount');
const Notification = require('../../models/Notification');
const ActivityLog = require('../../models/ActivityLog');
const { logActivity } = require('../../utils/activityLogger');
const { createDynamicVirtualAccount, verifyWebhookSignature, initiateTransfer, checkPaymentStatusByReference } = require('../../utils/nomba');
const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');

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
        const amountToPay = amount || (sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0));

        if (amountToPay <= 0) {
            return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
        }

        const existing = await VirtualAccount.findOne({
            saleId: sale._id,
            provider: 'nomba',
            amount: amountToPay, // ⚡ CRITICAL: Only reuse if amount matches exactly
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
                    accountName: existing.accountName || (business.displayName ? `AKINBYTE/${business.displayName.toUpperCase()}` : `Pay Invoice ${sale.invoiceNumber}`),
                    amount: existing.amount,
                    reference: existing.reference,
                    expiresAt: existing.expiresAt,
                    expiresIn: '45 minutes'
                }
            });
        }

        // 3. Create a fresh Nomba Dynamic Virtual Account
        console.log(`🟢 Creating Nomba DVA for Invoice ${sale.invoiceNumber} — ₦${amountToPay}`);
        
        let nombaData;
        try {
            nombaData = await createDynamicVirtualAccount({
                amount: amountToPay,
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
            amount: amountToPay,
            status: 'active',
            expiresAt: new Date(nombaData.expiresAt)
        });

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                bankName: vaRecord.bankName,
                accountName: nombaData.accountName,
                amount: vaRecord.amount,
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
        const eventType = event?.type || event?.event;
        console.log(`🟢 Nomba Webhook received: ${eventType}`);

        // 3. Only process successful payment events
        const acceptedEvents = [
            'payment_success', 'payment.success', 
            'charge.success', 'charge_success', 
            'transaction.success', 'transaction_success',
            'transfer.success', 'transfer_success',
            'payout_success', 'payout.success',
            'order_payment_success', 'order.payment.success',
            'SUCCESS'
        ];
        if (!acceptedEvents.includes(eventType)) {
            console.log(`ℹ️ Nomba Webhook: Ignored event type "${eventType}"`);
            return;
        }

        const paymentData = event?.data || event;
        const accountReference = paymentData?.accountReference 
            || paymentData?.account_reference 
            || paymentData?.orderReference
            || paymentData?.transactionReference;
        const amountRaw = paymentData?.amount || paymentData?.amountPaid || 0;
        // Fail-safe: If it looks like Naira (e.g. 100.0 instead of 10000), don't divide by 100
        const amountPaid = amountRaw > 500 ? amountRaw / 100 : amountRaw;

        if (!accountReference || amountPaid <= 0) {
            console.warn('⚠️ Nomba Webhook: Missing reference or amount — ignoring');
            return;
        }

        // 4. Trigger unified processing logic
        await internalProcessNombaPayment({
            accountReference,
            amount: amountPaid,
            transactionReference: paymentData?.transactionReference || paymentData?.reference || accountReference,
            payer: paymentData?.payerName || paymentData?.customerName || 'Bank Transfer'
        });

    } catch (err) {
        console.error('❌ Nomba Webhook Processing Error:', err);
    }
};

/**
 * 🛠️ UNIFIED NOMBA PAYMENT PROCESSOR
 * Handles idempotency, ledger updates, notifications, and auto-sweeps.
 */
async function internalProcessNombaPayment({ accountReference, amount, transactionReference, payer }) {
    try {
        // 1. Find matching Virtual Account
        const vaRecord = await VirtualAccount.findOne({ reference: accountReference });
        if (!vaRecord) {
            console.warn(`⚠️ Payment Processor: No VA record found for reference ${accountReference}`);
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
        // We use the amount reported by Nomba (fail-safe already applied)
        const creditAmount = amount;
        
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

        console.log(`✅ Nomba: ₦${creditAmount} recorded for Invoice #${sale.invoiceNumber}`);

        // 6. Notifications
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

            // 7. WhatsApp Alert to Merchant (Kreddy)
            if (business.whatsappNumber) {
                const statusLine = balanceRemaining <= 0
                    ? '✅ Fully Paid! Invoice is now cleared.'
                    : `⏳ Balance Remaining: ₦${balanceRemaining.toLocaleString()}`;

                // Meta Templates (kreddy_system_alert) often fail if params contain newlines/tabs.
                // We keep it as a clean, single-line string for maximum compatibility.
                const alertMsg = `💰 Bank Transfer Received! ₦${creditAmount.toLocaleString()} just landed for Invoice #${sale.invoiceNumber} (${sale.customerName || payer}). ${statusLine}. Money is being swept to your account now.`;

                await sendWhatsAppAlert(business.whatsappNumber, business.displayName || 'Chief', alertMsg).catch(e => {
                    console.error('WhatsApp Notify Error:', e.message);
                });
            } else {
                console.log(`ℹ️ Kreddy Notify: Skipped (No WhatsApp number for ${business.displayName})`);
            }

            // 8. AUTO-SWEEP: Instant Payout to Merchant's Bank Account
            const bankDetails = business.bankDetails;
            const isLocked = bankDetails?.bankDetailsLockUntil && new Date() < new Date(bankDetails.bankDetailsLockUntil);

            if (bankDetails?.bankCode && bankDetails?.accountNumber && !isLocked && !business.isCompromised) {
                try {
                    // We sweep the gross amount (Nomba handles fee deduction from wallet)
                    await initiateTransfer({
                        amount: creditAmount,
                        bankCode: bankDetails.bankCode,
                        accountNumber: bankDetails.accountNumber,
                        accountName: bankDetails.accountName || business.displayName,
                        narration: `Kredibly INV #${sale.invoiceNumber} settlement`
                    });
                    console.log(`✅ Auto-swept ₦${creditAmount} to ${bankDetails.accountName}`);
                } catch (sweepErr) {
                    console.error(`❌ Auto-sweep FAILED for ${sale.invoiceNumber}:`, sweepErr.message);
                }
            } else {
                const reason = isLocked ? "Security Lock" : (business.bankDetails?.accountNumber ? "Logic Blocked" : "Missing Bank Details");
                console.log(`🛡️ Auto-sweep SKIPPED for ${sale.invoiceNumber}: ${reason}`);
            }

            // 9. Auto-detect UI refresh via Socket
            try {
                const { getIO } = require('../../utils/socket');
                const io = getIO();
                if (io && business) {
                    console.log(`🔌 Emitting sale_updated for business: ${business._id}`);
                    io.to(business._id.toString()).emit('sale_updated', {
                        saleId: sale._id,
                        balance: balanceRemaining,
                        amountPaid: totalPaid
                    });
                }
            } catch (socketErr) {
                console.error("❌ Socket emit error in nombaController:", socketErr.message);
            }
        }

        return { success: true, message: "Payment processed and ledger updated!" };
    } catch (err) {
        console.error('❌ internalProcessNombaPayment Error:', err);
        return { success: false, message: "Internal processing error: " + err.message };
    }
}
