const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const VirtualAccount = require('../../models/VirtualAccount');
const Notification = require('../../models/Notification');
const ActivityLog = require('../../models/ActivityLog');
const { logActivity } = require('../../utils/activityLogger');
const { createDynamicVirtualAccount, verifyWebhookSignature, initiateTransfer } = require('../../utils/nomba');
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

        // 2. Check if an active Nomba VA already exists for this sale (avoid duplicate creation)
        const existing = await VirtualAccount.findOne({
            saleId: sale._id,
            provider: 'nomba',
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
                    accountName: `Pay Invoice ${sale.invoiceNumber}`,
                    amount: existing.amount,
                    reference: existing.reference,
                    expiresAt: existing.expiresAt,
                    expiresIn: '1 hour'
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
                customerName: sale.customerName || 'Customer',
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
                expiresIn: '1 hour'
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

        console.log(`🔍 Manually verifying Nomba payment for ${accountRef}...`);
        const status = await checkPaymentStatusByReference(accountRef);

        if (status.paid) {
            // Trigger the same processing logic as the webhook
            await processNombaPayment({
                accountReference: accountRef,
                amount: status.amount,
                transactionReference: status.transactionReference,
                payer: status.payer
            });
            
            return res.status(200).json({ 
                success: true, 
                message: 'Payment verified and processed!',
                data: status 
            });
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
 * Common logic to process Nomba payment (extracted for reuse)
 */
async function processNombaPayment(data) {
    const { accountReference, amount, transactionReference, payer, fee } = data;
    
    // Calculate net amount (Gross amount - Nomba fees)
    // If fee isn't provided, we assume a small buffer or handle it
    const netAmount = data.netAmount || (amount - (fee || 0));

    const existingTx = await Sale.findOne({ "payments.transactionId": transactionReference });
    if (existingTx) return;

    const va = await VirtualAccount.findOne({ reference: accountReference }).populate('businessId');
    if (!va) {
        console.error('❌ Nomba Payment: No matching virtual account for', accountReference);
        return;
    }

    const sale = await Sale.findById(va.saleId);
    if (!sale) return;

    const business = va.businessId;

    // Record the GROSS amount (what the customer paid) on the invoice
    sale.payments.push({
        amount: amount, 
        method: 'bank_transfer',
        transactionId: transactionReference,
        status: 'completed',
        date: new Date()
    });

    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    sale.paidAmount = totalPaid;
    sale.status = totalPaid >= sale.totalAmount ? 'paid' : 'partial';
    await sale.save();

    console.log(`✅ Paid: ₦${amount} for Inv ${sale.invoiceNumber} (${sale.status})`);

    // WhatsApp Alert to Merchant
    if (business.whatsappNumber) {
        try {
            await sendWhatsAppAlert({
                to: business.whatsappNumber,
                template: 'kreddy_payment_alert',
                vars: [
                    business.displayName || 'Merchant',
                    `₦${amount.toLocaleString()}`,
                    sale.invoiceNumber,
                    sale.customerName || 'Customer'
                ]
            });
        } catch (waErr) {
            console.error('❌ Whatsapp Alert Failed:', waErr.message);
        }
    }

    // Auto-Sweep the NET amount to the Merchant's bank account
    const bankDetails = business.bankDetails;
    if (bankDetails && bankDetails.accountNumber) {
        try {
            // We sweep the netAmount (Gross - Fee) to avoid "Insufficient Balance" errors
            await initiateTransfer({
                amount: netAmount,
                bankCode: bankDetails.bankCode,
                accountNumber: bankDetails.accountNumber,
                accountName: bankDetails.accountName,
                narration: `Kredibly INV#${sale.invoiceNumber}`
            });
            console.log(`✅ Auto-swept Net ₦${netAmount} (after fees) to ${bankDetails.accountName}`);
        } catch (sweepErr) {
            console.error(`❌ Auto-sweep FAILED for ${sale.invoiceNumber}. Balance might be too low:`, sweepErr.message);
        }
    }
}

/**
 * 🔔 HANDLE NOMBA PAYMENT WEBHOOK
 * Nomba fires this when a customer successfully pays into a virtual account.
 * This is the core of the instant payment flow — it:
 *   1. Verifies the signature
 *   2. Matches the payment to an invoice
 *   3. Marks invoice as paid
 *   4. Notifies merchant via WhatsApp
 *   5. Auto-sweeps funds to merchant's bank account
 * 
 * Route: POST /api/payments/webhook/nomba
 */
exports.handleNombaWebhook = async (req, res) => {
    // 1. Always respond FAST to Nomba (< 5s) to prevent retry storms
    res.status(200).json({ status: 'received' });

    try {
        // 2. Verify signature to ensure this is genuinely from Nomba
        const signature = req.headers['nomba-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);

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
        if (eventType !== 'payment_success' && eventType !== 'charge.success') {
            console.log(`ℹ️ Nomba Webhook: Ignored event type "${eventType}"`);
            return;
        }

        const paymentData = event?.data || event;
        const accountReference = paymentData?.accountReference 
            || paymentData?.account_reference 
            || paymentData?.transactionReference;
        const amountPaid = (paymentData?.amount || 0) / 100; // Convert from kobo

        if (!accountReference || amountPaid <= 0) {
            console.warn('⚠️ Nomba Webhook: Missing reference or amount — ignoring');
            return;
        }

        // 4. Find the matching Virtual Account record by reference
        const vaRecord = await VirtualAccount.findOne({ reference: accountReference });
        if (!vaRecord) {
            console.warn(`⚠️ Nomba Webhook: No VA record found for reference ${accountReference}`);
            return;
        }

        // 5. Find the sale
        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) {
            console.error(`❌ Nomba Webhook: Sale not found for VA ${vaRecord._id}`);
            return;
        }

        // 6. Idempotency check — don't double-process the same payment
        const isDuplicate = sale.payments?.some(p => p.reference === accountReference);
        if (isDuplicate) {
            console.log(`🔁 Nomba Webhook: Already processed ${accountReference} — skipping`);
            return;
        }

        // 7. Record the payment on the invoice
        const creditAmount = vaRecord.amount; // Use the invoice amount, not raw transfer amount
        sale.payments.push({
            amount: creditAmount,
            method: 'Nomba',
            reference: accountReference,
            date: new Date()
        });
        await sale.save(); // Triggers status flip to 'paid' via pre-save hook

        // 8. Mark VA as used
        vaRecord.status = 'used';
        await vaRecord.save();

        const business = sale.businessId;
        const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = sale.totalAmount - totalPaid;

        console.log(`✅ Nomba: ₦${creditAmount} recorded for Invoice #${sale.invoiceNumber}`);

        // 9. Create in-app notification
        if (business) {
            await Notification.create({
                businessId: business._id,
                title: '💰 Payment Received',
                message: `₦${creditAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber} from ${sale.customerName}.`,
                type: 'payment',
                saleId: sale._id
            });

            await logActivity({
                businessId: business._id,
                action: 'PAYMENT_RECEIVED',
                entityType: 'PAYMENT',
                entityId: sale._id,
                details: `Nomba instant payment of ₦${creditAmount.toLocaleString()} verified for Invoice #${sale.invoiceNumber}`
            });

            // 10. Notify merchant on WhatsApp IMMEDIATELY
            if (business.whatsappNumber) {
                const statusLine = balance <= 0
                    ? '✅ *Fully Paid!* Invoice is now cleared.'
                    : `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}`;

                const msg = `💰 *Payment Received!*\n\n*₦${creditAmount.toLocaleString()}* just landed for *Invoice #${sale.invoiceNumber}* (${sale.customerName}).\n\n${statusLine}\n\n_Money is being swept to your account now._`;

                await sendWhatsAppAlert(business.whatsappNumber, 'Chief', msg).catch(e => {
                    console.error('WhatsApp Notify Error (non-blocking):', e.message);
                });
            }

            // 11. AUTO-SWEEP: Send money to merchant's registered bank account immediately
            const bankDetails = business.bankDetails;
            if (
                bankDetails?.bankCode &&
                bankDetails?.accountNumber &&
                bankDetails?.accountName &&
                !business.isCompromised // Safety: don't sweep if account is flagged
            ) {
                // Check 24h bank detail lock (security feature from existing code)
                const isLocked = bankDetails.bankDetailsLockUntil && new Date() < bankDetails.bankDetailsLockUntil;

                if (isLocked) {
                    console.warn(`🛡️ Auto-sweep BLOCKED for ${business.displayName} — bank details lock active. Holding funds.`);
                    // Funds stay in Nomba account until lock expires
                } else {
                    try {
                        await initiateTransfer({
                            amount: creditAmount,
                            bankCode: bankDetails.bankCode,
                            accountNumber: bankDetails.accountNumber,
                            accountName: bankDetails.accountName,
                            narration: `Kredibly INV#${sale.invoiceNumber} - ${sale.customerName}`
                        });
                        console.log(`✅ Auto-swept ₦${creditAmount} to ${bankDetails.accountName} (${bankDetails.accountNumber})`);
                    } catch (sweepErr) {
                        console.error(`❌ Auto-sweep FAILED for ${sale.invoiceNumber}:`, sweepErr.message);
                        // Non-fatal: payment is recorded, merchant will be notified of the failure
                        if (business.whatsappNumber) {
                            await sendWhatsAppAlert(
                                business.whatsappNumber,
                                'Alert',
                                `⚠️ Payment received for Invoice #${sale.invoiceNumber} but automatic bank sweep failed. Please contact support. Ref: ${accountReference}`
                            ).catch(() => {});
                        }
                    }
                }
            } else {
                // No bank details set — funds stay in Nomba until merchant adds bank details
                console.log(`ℹ️ No bank details for ${business.displayName} — funds held in Nomba account`);
                if (business.whatsappNumber) {
                    await sendWhatsAppAlert(
                        business.whatsappNumber,
                        'Action Required',
                        `💰 ₦${creditAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber}!\n\n⚠️ *Action Required:* Add your bank details in the Kredibly dashboard to enable automatic payouts.`
                    ).catch(() => {});
                }
            }
        }

    } catch (err) {
        console.error('❌ Nomba Webhook Processing Error:', err);
        // We already sent 200, so Nomba won't retry — log for investigation
    }
};
