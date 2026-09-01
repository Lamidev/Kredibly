const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const VirtualAccount = require('../../models/VirtualAccount');
const PaymentSession = require('../../models/PaymentSession');
const FINANCIAL_CONFIG = require('../../config/financials');
const Notification = require('../../models/Notification');
const ActivityLog = require('../../models/ActivityLog');
const { logActivity } = require('../../utils/activityLogger');
const { createDynamicVirtualAccount, createNombaCheckoutOrder, verifyWebhookSignature, initiateTransfer, checkPaymentStatusByReference } = require('../../utils/nomba');
const { logUsage } = require('../../utils/usageTracker');
const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');
const crypto = require('crypto');

/**
 * 💳 INITIALIZE NOMBA SUBSCRIPTION (SaaS)
 */
exports.initializeNombaSubscription = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

        const { PRICING_PLANS } = require("../../config/pricing");
        const amount = PRICING_PLANS[plan]?.monthly || 2500;

        const orderReference = `SUB-${plan.toUpperCase()}-${business._id}-${Date.now().toString().slice(-4)}`;
        const checkoutLink = await createNombaCheckoutOrder({
            amount,
            orderReference,
            customerEmail: req.user.email,
            customerName: business.displayName || 'Kredibly Merchant'
        });

        res.status(200).json({ success: true, checkoutLink });
    } catch (err) {
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
                { invoiceNumber: invoiceId?.toUpperCase() }
            ]
        }).populate('businessId');

        if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        const business = sale.businessId;
        const requestedAmount = amount || (sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0));

        if (requestedAmount <= 0) return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });

        let amountToCharge = requestedAmount;
        let gatewayFee = 0;

        const absorbFee = business?.prefersGatewayFeeAbsorption !== false && business?.prefersGatewayFeeAbsorption !== "false";
        if (!absorbFee) {
            amountToCharge = FINANCIAL_CONFIG.calculateGrossAmount(requestedAmount);
            gatewayFee = amountToCharge - requestedAmount;
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
        res.status(500).json({ success: false, message: 'Failed to generate bank transfer details' });
    }
};

/**
 * 🔍 MANUALLY VERIFY NOMBA PAYMENT
 */
exports.verifyNombaPaymentStatus = async (req, res) => {
    try {
        const { accountRef } = req.body;
        const va = await VirtualAccount.findOne({ reference: accountRef });
        if (!va) return res.status(404).json({ success: false, message: 'Virtual account not found' });

        if (va.status === 'used') {
            return res.status(200).json({ 
                success: true, 
                message: 'Payment already confirmed and processed!', 
                data: { paid: true } 
            });
        }

        const status = await checkPaymentStatusByReference(va.reference, va.accountNumber);
        if (status.paid) {
            const result = await internalProcessNombaPayment(va.reference, va.accountNumber, status.amount, status.transactionReference, status.payer, null);
            if (result.success || result.message.includes("Duplicate")) {
                return res.status(200).json({ success: true, message: 'Payment verified!', data: status });
            }
        }
        return res.status(200).json({ success: false, message: 'Payment not found or still pending.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status check failed' });
    }
};

/**
 * 🔔 HANDLE NOMBA PAYMENT WEBHOOK
 */
exports.handleNombaWebhook = async (req, res) => {
    // ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────
    // Nomba sends the HMAC signature in the 'nomba-signature' header
    const nombaSignature = req.headers['nomba-signature'] 
        || req.headers['x-nomba-signature'] 
        || req.headers['x-webhook-signature']
        || req.headers['signature'];

    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const event = req.body || {};
    const rawEventType = event?.event_type || event?.event || event?.type || '';
    const eventType = rawEventType.toLowerCase().trim();

    // 🏦 NOMBA PAYOUT / SETTLEMENT SUCCESS: Acknowledge sweep completion immediately
    if (eventType === 'payout_success' || eventType === 'transfer_success' || eventType === 'payout.success') {
        console.log(`ℹ️ Nomba Payout/Settlement Webhook acknowledged: ${rawEventType}`);
        return res.status(200).json({ status: 'received' });
    }

    const txData = event?.data?.transaction || {};
    const legacyData = event?.data || {};
    const accountReference = txData?.aliasAccountReference || legacyData?.accountRef || legacyData?.accountReference;
    const accountNumber = txData?.aliasAccountNumber || legacyData?.bankAccountNumber || legacyData?.accountNumber;

    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;
    let isAuthorized = false;

    if (!webhookSecret) {
        console.warn('⚠️ NOMBA_WEBHOOK_SECRET not set — signature verification skipped');
        isAuthorized = true;
    } else if (nombaSignature) {
        const isValidHmac = verifyWebhookSignature(nombaSignature, rawPayload) || 
                            verifyWebhookSignature(nombaSignature, JSON.stringify(req.body));
        if (isValidHmac) {
            isAuthorized = true;
        } else {
            console.warn(`⚠️ Nomba Webhook signature mismatch with local secret. Signature header: ${nombaSignature}. Verifying with Nomba API...`);
        }
    }

    // 🛡️ FINTECH RESILIENCE: If HMAC mismatch, perform authoritative server-side check with Nomba API
    if (!isAuthorized && (accountReference || accountNumber)) {
        try {
            const apiStatus = await checkPaymentStatusByReference(accountReference, accountNumber);
            if (apiStatus && apiStatus.paid) {
                console.log(`✅ Webhook verified via direct Nomba API lookup for ${accountReference || accountNumber}`);
                isAuthorized = true;
            }
        } catch (apiErr) {
            console.error('❌ Fallback API verification failed:', apiErr.message);
        }
    }

    if (!isAuthorized) {
        console.error('❌ Nomba Webhook rejected: Signature mismatch and API verification failed');
        return res.status(401).json({ message: 'Unauthorized: Invalid signature' });
    }
    // ──────────────────────────────────────────────────────────────────────────

    console.log('⚡ Nomba Webhook Arrived:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ status: 'received' });

    try {
        if (eventType !== 'payment_success' && eventType !== 'vact_transfer' && eventType !== 'order_payment_success') {
            console.log(`ℹ️ Ignored Nomba event type: ${rawEventType}`);
            return;
        }

        const payer = event?.data?.customer?.senderName || 'Bank Transfer';
        let amountPaid = parseFloat(txData?.transactionAmount || legacyData?.amountPaid || 0);

        const nombaTransactionRef = txData?.transactionId || legacyData?.transactionReference;

        if (typeof accountReference === 'string' && accountReference.startsWith('SUB-')) {
            return await processSubscriptionWebhook(accountReference, amountPaid, payer, nombaTransactionRef);
        }

        await internalProcessNombaPayment(accountReference, accountNumber, amountPaid, nombaTransactionRef, payer, event);
    } catch (err) {
        console.error('❌ Webhook Error:', err);
    }
};

/**
 * 🛠️ UNIFIED NOMBA PAYMENT PROCESSOR (With Perfect Auto-Sweep)
 */
const internalProcessNombaPayment = async (accountReference, accountNumber, amount, transactionReference, payer, nombaPayload = null) => {
    try {
        const vaRecord = await VirtualAccount.findOneAndUpdate(
            { $or: [{ reference: accountReference, status: 'active' }, { accountNumber: accountNumber, status: 'active' }] },
            { status: 'processing' },
            { new: true }
        );
        
        if (!vaRecord) return { success: false, message: "VA not found or already processing" };

        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) return { success: false, message: "Sale not found" };

        const business = sale.businessId;

        // Determine payment scenario for merchant notification
        const tolerance = 5; // ₦5 tolerance for floating point / rounding edge cases
        const diff = amount - vaRecord.amount; // positive = overpaid, negative = underpaid
        const isExact = Math.abs(diff) <= tolerance;
        const isUnderpaid = diff < -tolerance;
        const isOverpaid = diff > tolerance;

        // Calculate expected new status based on payments
        const totalPaidSoFar = sale.payments.reduce((sum, p) => sum + p.amount, 0);

        // Calculate the base (net) equivalent amount actually paid
        let creditAmount = (vaRecord.amount > 0) 
            ? Math.round(amount * (vaRecord.baseAmount / vaRecord.amount)) 
            : amount;

        const remainingBeforeThis = sale.totalAmount - totalPaidSoFar;

        // Apply overpayment cap: if customer overpaid, record only the actual remaining balance
        // to fully settle the invoice (balance becomes exactly 0) and avoid negative ledger balances.
        if (creditAmount > remainingBeforeThis) {
            creditAmount = remainingBeforeThis;
        } else if (Math.abs(remainingBeforeThis - creditAmount) <= tolerance) {
            // Apply ₦5 tolerance check for exact/near-exact payments
            creditAmount = remainingBeforeThis;
        }

        const newTotalPaid = totalPaidSoFar + creditAmount;
        let newStatus = 'unpaid';
        if (newTotalPaid >= sale.totalAmount) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'partial';
        }

        // 🔐 Update Sale Ledger atomically — push payment AND update status in one query
        // Deduplicate check relies on externalReference (Nomba transactionId)
        const updatedSale = await Sale.findOneAndUpdate(
            { _id: sale._id, "payments.externalReference": { $ne: transactionReference } },
            { 
                $push: { payments: { amount: creditAmount, method: 'Nomba', reference: accountReference, externalReference: transactionReference, date: new Date() } },
                $set: { status: newStatus }
            },
            { new: true }
        );

        if (!updatedSale) {
            // Duplicate webhook — mark VA used and bail
            vaRecord.status = 'used';
            await vaRecord.save();
            return { success: true, message: "Duplicate avoided" };
        }

        vaRecord.status = 'used';
        await vaRecord.save();

        // ── Resolve matching PaymentSession (WhatsApp-native DVA flow) ──────────
        try {
            const matchedSession = await PaymentSession.findOneAndUpdate(
                { nombaReference: accountReference, status: 'pending' },
                {
                    $set: {
                        status: 'paid',
                        resolvedAt: new Date(),
                        actualAmountReceived: amount,
                        nombaTransactionReference: transactionReference
                    }
                },
                { new: true }
            );
            if (matchedSession) {
                console.log(`✅ PaymentSession ${matchedSession._id} resolved as paid for Sale ${matchedSession.saleId}`);
            }
        } catch (psErr) {
            console.error('⚠️ Could not resolve PaymentSession:', psErr.message);
        }

        const totalPaid = updatedSale.payments.reduce((sum, p) => sum + p.amount, 0);
        const balanceRemaining = Math.max(0, sale.totalAmount - totalPaid);

        // 🔔 Create In-App Notification for Merchant Dashboard
        try {
            const Notification = require('../../models/Notification');
            await Notification.create({
                businessId: business._id,
                title: 'Payment Confirmed',
                message: `Received ₦${creditAmount.toLocaleString()} from ${sale.customerName} on Invoice #${sale.invoiceNumber}.`,
                type: 'sale',
                saleId: sale._id
            });
        } catch (notifErr) {
            console.error("⚠️ Failed to create in-app notification:", notifErr.message);
        }

        try {
            const { getIO } = require('../../utils/socket');
            const io = getIO();
            if (io && business && business._id) {
                const payload = {
                    saleId: sale._id,
                    invoiceId: sale.invoiceNumber,
                    invoiceNumber: sale.invoiceNumber,
                    amount: creditAmount,
                    customerName: sale.customerName,
                    status: updatedSale.status,
                    balance: balanceRemaining,
                    amountPaid: creditAmount
                };

                const businessRoom = business._id.toString().toLowerCase();
                io.to(businessRoom).emit('sale_updated', payload);
                io.to(businessRoom).emit('notification_created', { businessId: business._id });
            }
        } catch (socketErr) {
            console.error('Socket emission error:', socketErr.message);
        }

        // 🚀 PERSISTENT AUTO-SWEEP LOGIC
        // Sweep the actual net of what Nomba received (based on real transfer amount).
        // This may differ from creditAmount when there's an underpayment or overpayment.
        (async () => {
            try {
                const Settlement = require('../../models/Settlement');
                const bankDetails = business.bankDetails;

                if (!bankDetails?.bankCode || !bankDetails?.accountNumber) {
                    console.warn(`⚠️ Auto-Sweep Skipped: No bank details for ${business.displayName}`);
                    return;
                }

                // Sweep the net of the ACTUAL amount that landed in Nomba wallet
                const sweepAmount = FINANCIAL_CONFIG.calculateNetAmount(amount);

                // 1. Create Persistent Settlement Record
                const settlement = await Settlement.create({
                    businessId: business._id,
                    saleId: sale._id,
                    amount: sweepAmount,
                    bankDetails: {
                        accountNumber: bankDetails.accountNumber,
                        bankCode: bankDetails.bankCode,
                        accountName: bankDetails.accountName || business.displayName
                    },
                    status: 'pending',
                    scheduledFor: new Date(Date.now() + 20000) // 20s buffer for Nomba ledger sync
                });

                console.log(`📡 Settlement Record Created: ${settlement._id} for ₦${sweepAmount}. Waiting 20s...`);

                // 2. Execute sweep after delay
                setTimeout(async () => {
                    try {
                        settlement.status = 'processing';
                        await settlement.save();

                        const { initiateTransfer } = require('../../utils/nomba');
                        const result = await initiateTransfer({
                            amount: sweepAmount,
                            bankCode: settlement.bankDetails.bankCode,
                            accountNumber: settlement.bankDetails.accountNumber,
                            accountName: settlement.bankDetails.accountName,
                            narration: `KREDIBLY/${sale.invoiceNumber.replace('KR-', '')}`
                        });

                        settlement.status = 'completed';
                        settlement.nombaReference = result?.data?.transactionReference || result?.transactionReference;
                        settlement.attempts += 1;
                        await settlement.save();

                        console.log(`✅ Auto-Sweep SUCCESS for ${business.displayName}: ₦${sweepAmount} settled.`);

                        try {
                            const { getIO } = require('../../utils/socket');
                            const io = getIO();
                            if (io && business?._id) {
                                io.to(business._id.toString().toLowerCase()).emit('settlement_success', {
                                    amount: sweepAmount,
                                    invoiceNumber: sale.invoiceNumber,
                                    timestamp: new Date()
                                });
                            }
                        } catch (socketErr) {
                            console.error('Socket settlement emission error:', socketErr.message);
                        }

                        // Auto-sweep completed successfully (already notified in consolidated payment alert)
                        console.log(`🔕 Auto-Sweep SUCCESS notification consolidated in payment alert for ${business.whatsappNumber}`);
                    } catch (sweepErr) {
                        console.error(`❌ Auto-Sweep FAILED for Settlement ${settlement._id}:`, sweepErr.message);
                        settlement.status = 'failed';
                        settlement.lastError = sweepErr.message;
                        settlement.attempts += 1;
                        await settlement.save();

                        if (business.whatsappNumber) {
                            const failMsg = `*Settlement Issue, ${business.displayName}!*\n\nI tried to sweep *₦${sweepAmount.toLocaleString()}* to your bank but it failed.\n\nReason: ${sweepErr.message}\n\nThe funds are safe in your Kredibly wallet. I'll retry shortly or check your dashboard.`;
                            await sendWhatsAppAlert(business.whatsappNumber, business.displayName, failMsg);
                        }
                    }
                }, 20000);

            } catch (err) {
                console.error('❌ Auto-Sweep Initialization Error:', err);
            }
        })();

        // 📱 WHATSAPP PAYMENT NOTIFICATION — contextual message based on payment scenario
        if (business.whatsappNumber) {
            const isMerchantWindowOpen = !!(business.lastInboundAt && (new Date() - new Date(business.lastInboundAt)) < 24 * 60 * 60 * 1000);
            let customText = "";

            if (isExact) {
                // Normal payment — report balance or full clearance
                customText = balanceRemaining <= 0
                    ? `✅ Invoice fully paid! This debt is now cleared.`
                    : `⏳ Balance Remaining: ₦${balanceRemaining.toLocaleString()}`;

            } else if (isUnderpaid) {
                // Customer paid less than expected — notify both parties
                const shortfall = Math.abs(diff);
                customText = `*Payment Received — Shortfall Detected*\n\n${sale.customerName} transferred *₦${amount.toLocaleString()}* for Invoice #${sale.invoiceNumber}.\n\nThe invoice expected *₦${vaRecord.amount.toLocaleString()}* — they are short by *₦${shortfall.toLocaleString()}*.\n\nI've updated the invoice. Outstanding balance is now *₦${balanceRemaining.toLocaleString()}*. I'll continue monitoring for the remaining payment.`;

            } else if (isOverpaid) {
                // Customer paid more than expected — send interactive buttons
                const overpaymentExcess = Math.abs(diff);
                const bossTitle = business.assistantSettings?.preferredName || business.displayName || "Boss";

                // Mark the sale's overpayment status
                await Sale.findByIdAndUpdate(sale._id, {
                    overpaymentStatus: 'pending_refund',
                    overpaymentAmount: overpaymentExcess
                });

                // Open a merchant session so button presses are handled correctly
                const WhatsAppSession = require('../../models/WhatsAppSession');
                if (business.whatsappNumber) {
                    await WhatsAppSession.findOneAndUpdate(
                        { whatsappNumber: business.whatsappNumber },
                        {
                            whatsappNumber: business.whatsappNumber,
                            type: 'merchant_overpayment',
                            data: {
                                saleId: sale._id.toString(),
                                invoiceNumber: sale.invoiceNumber,
                                customerName: sale.customerName,
                                overpaymentAmount: overpaymentExcess
                            },
                            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
                        },
                        { upsert: true, new: true }
                    );

                    // Send the conversational Kreddy overpayment message with buttons
                    const { sendInteractiveButtons } = require('../../utils/customerInvoiceService');
                    const overpayMsg = [
                        `*Overpayment Detected, ${bossTitle}*`,
                        ``,
                        `${sale.customerName} transferred *₦${amount.toLocaleString()}*.`,
                        `Invoice #${sale.invoiceNumber} only required *₦${vaRecord.amount.toLocaleString()}*.`,
                        `Overpayment: *₦${overpaymentExcess.toLocaleString()}*`,
                        ``,
                        `The invoice has been marked as fully paid ✔️`,
                        ``,
                        `Since payments settle directly into your bank account, please refund *₦${overpaymentExcess.toLocaleString()}* to ${sale.customerName} outside Kredibly.`,
                        ``,
                        `Have you sorted the refund?`
                    ].join('\n');

                    const btnSent = await sendInteractiveButtons(
                        business.whatsappNumber,
                        `Invoice #${sale.invoiceNumber}`,
                        overpayMsg,
                        '',
                        [
                            { id: `overpay_refunded:${sale._id}`, title: 'Mark Refunded' },
                            { id: `overpay_later:${sale._id}`, title: 'Remind Me Later' }
                        ]
                    );

                    if (!btnSent) {
                        // Fallback: plain text if 24h window closed
                        customText = `*Overpayment Alert!* ${sale.customerName} transferred ₦${amount.toLocaleString()} but Invoice #${sale.invoiceNumber} only required ₦${vaRecord.amount.toLocaleString()} (excess: ₦${overpaymentExcess.toLocaleString()}). The invoice is now fully paid. Please refund ₦${overpaymentExcess.toLocaleString()} to ${sale.customerName} directly.`;
                    } else {
                        // Skip the generic sendWhatsAppPaymentAlert below — we already handled it
                        customText = null;
                    }
                }
            }

            // 🛡️ PLAN EXPIRED NUDGE: Even on inactive plans, payment notifications always
            // fire — but we append a resubscribe nudge to bring them back.
            if (customText !== null && (business.planStatus === 'inactive' || business.planStatus === 'cancelled')) {
                customText += `\n\n⚡ *Kreddy Note:* Even while I'm off-duty, your money is still moving! Subscribe now to get your full AI briefings and debt recovery back.\n🔗 https://usekredibly.com/settings`;
            }

            // ⚡ COMBINED NOTIFICATION: Include auto-sweep payout info directly in customText
            if (customText !== null && !customText.includes("Auto-Sweep")) {
                const sweepAmount = FINANCIAL_CONFIG.calculateNetAmount(amount);
                const bankName = business.bankDetails?.bankName || "your bank account";
                const accNo = business.bankDetails?.accountNumber || "";
                customText += `\n\n⚡ *Auto-Sweep Payout:* ₦${sweepAmount.toLocaleString()} is being settled to your ${bankName} account (${accNo}).`;
            }

            // 🧠 KREDDY AI: Notify customer via WhatsApp first (and generate the receipt image card)
            let receiptImageUrl = null;
            try {
                const { notifyCustomerPaymentReceived } = require('../../utils/customerInvoiceService');
                receiptImageUrl = await notifyCustomerPaymentReceived(sale._id, creditAmount);
            } catch (custNotifyErr) {
                console.error("Customer payment notify error:", custNotifyErr.message);
            }

            // Fetch the freshly updated sale to get the generated PDF URL
            let freshSale = null;
            try {
                freshSale = await Sale.findById(sale._id);
            } catch (findErr) {
                console.error("Error fetching fresh sale for PDF url:", findErr.message);
            }

            // Only send the PDF document if the invoice is fully cleared (PAID)
            const isFullyPaid = newStatus === 'paid';
            const pdfToSend = isFullyPaid ? (freshSale?.pdfUrl || null) : null;

            // Only fire the generic alert when overpayment interactive buttons weren't already sent
            if (customText !== null) {
                const { sendWhatsAppPaymentAlert } = require('../whatsapp/whatsappController');
                await sendWhatsAppPaymentAlert(
                    business.whatsappNumber,
                    creditAmount,
                    sale.invoiceNumber,
                    sale.customerName || payer,
                    customText,
                    business.displayName || 'Chief',
                    "",
                    receiptImageUrl,
                    pdfToSend
                ).catch(err => console.error('❌ WhatsApp Payment Alert Failed:', err.message));
            }
        }

        console.log(`✅ Nomba Payment Processed: Invoice ${sale.invoiceNumber} | Credited: ₦${creditAmount} | Actual Transfer: ₦${amount} | Status: ${newStatus}`);
        return { success: true, message: "Payment processed!" };
    } catch (err) {
        console.error('❌ internalProcessNombaPayment Error:', err.message);
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

        await Payment.create({
            businessId,
            reference: txRef || reference,
            amount,
            plan,
            status: 'success',
            paidAt: new Date()
        });

        const business = await BusinessProfile.findById(businessId);
        if (!business) return;

        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        business.plan = plan;
        business.planStatus = 'active';
        business.nextBillingDate = nextBilling;
        // NOTE: Do NOT overwrite trialExpiresAt here — it's the trial's own field.
        // nextBillingDate is what the expiry cron should check for paid subscribers.
        await business.save();

        const { sendEmail } = require("../../utils/emailService");
        const { sendWhatsAppMessage } = require("../whatsapp/whatsappController");

        // 🛡️ SUPER ADMIN NOTIFICATION
        sendEmail({
            to: "usekredibly@gmail.com",
            subject: `💰 Subscription Alert: ${business.displayName} paid ₦${amount.toLocaleString()}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Cash in the building! 🏦</h2>
                    <p><strong>Merchant:</strong> ${business.displayName}</p>
                    <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
                    <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
                    <p><strong>Reference:</strong> ${txRef || reference}</p>
                    <hr />
                    <p style="font-size: 12px; color: #777;">Kredibly Revenue Monitor</p>
                </div>
            `
        }).catch(e => console.error("Admin Payment Alert Fail:", e.message));

        // 👤 MERCHANT NOTIFICATION (Email)
        const user = await require("../../models/User").findById(business.ownerId);
        if (user && user.email) {
            sendEmail({
                to: user.email,
                subject: `✅ Subscription Confirmed: Welcome to ${plan.toUpperCase()}!`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>High power, Boss! 🚀</h2>
                        <p>Your <strong>${plan.toUpperCase()}</strong> plan is now active. Kreddy is officially back on duty to manage your business ledger and recover your debts.</p>
                        <p><strong>Next Billing:</strong> ${nextBilling.toDateString()}</p>
                        <p>Keep winning!</p>
                    </div>
                `
            }).catch(e => console.error("Merchant Payment Email Fail:", e.message));
        }

        // 📱 MERCHANT NOTIFICATION (WhatsApp)
        if (business.whatsappNumber) {
            const bossTitle = business.assistantSettings?.preferredName || (plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss"));
            const msg = `✅ *Subscription Confirmed!* \n\nHigh power, ${bossTitle}! 🚀 Your *${plan.toUpperCase()}* plan is now active. \n\nI'm back on duty and ready to help you grow. *What's the plan for today?*`;
            sendWhatsAppMessage(business.whatsappNumber, msg).catch(e => console.error("Merchant WhatsApp Alert Fail:", e.message));
        }

        return { success: true, message: "Subscription updated!" };
    } catch (err) {
        console.error("Subscription Fulfillment Error:", err.message);
        return { success: false, message: err.message };
    }
}

exports.processDailyNombaSettlements = async () => {};
exports.internalProcessNombaPayment = internalProcessNombaPayment;
