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

        const absorbFee = business?.prefersGatewayFeeAbsorption !== false;
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
            baseAmount: absorbFee ? FINANCIAL_CONFIG.calculateNetAmount(requestedAmount) : requestedAmount,
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
    console.log('⚡ Nomba Webhook Arrived:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ status: 'received' });

    try {
        const event = req.body;
        if (event.event_type !== 'payment_success' && event.event_type !== 'vact_transfer') return;

        const txData = event?.data?.transaction || {};
        const legacyData = event?.data || {};

        const accountReference = txData?.aliasAccountReference || legacyData?.accountRef || legacyData?.accountReference;
        const accountNumber = txData?.aliasAccountNumber || legacyData?.bankAccountNumber || legacyData?.accountNumber;
        const nombaTransactionRef = txData?.transactionId || legacyData?.transactionReference;
        const payer = event?.data?.customer?.senderName || 'Bank Transfer';
        let amountPaid = parseFloat(txData?.transactionAmount || legacyData?.amountPaid || 0);

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
        const creditAmount = vaRecord.baseAmount || amount; 

        // Update Sale Ledger
        const updatedSale = await Sale.findOneAndUpdate(
            { _id: sale._id, "payments.reference": { $ne: accountReference } },
            { $push: { payments: { amount: creditAmount, method: 'Nomba', reference: accountReference, externalReference: transactionReference, date: new Date() } } },
            { new: true }
        );

        if (!updatedSale) {
            vaRecord.status = 'used';
            await vaRecord.save();
            return { success: true, message: "Duplicate avoided" };
        }

        vaRecord.status = 'used';
        await vaRecord.save();

        const { getIO } = require('../../utils/socket');
        const io = getIO();
        if (io) {
            io.to(sale._id.toString()).emit('payment_detected', {
                saleId: sale._id,
                amount: creditAmount,
                status: 'paid'
            });
        }

        // 🚀 PERSISTENT AUTO-SWEEP LOGIC
        // Instead of volatile setTimeout, we log it in the DB first for reliability.
        (async () => {
            try {
                const Settlement = require('../../models/Settlement');
                const bankDetails = business.bankDetails;

                if (!bankDetails?.bankCode || !bankDetails?.accountNumber) {
                    console.warn(`⚠️ Auto-Sweep Skipped: No bank details for ${business.displayName}`);
                    return;
                }

                const actualNet = FINANCIAL_CONFIG.calculateNetAmount(amount);
                const sweepAmount = Math.min(creditAmount, actualNet);

                // 1. Create Persistent Record
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
                    scheduledFor: new Date(Date.now() + 20000) // 20s buffer for Nomba sync
                });

                console.log(`📡 Settlement Record Created: ${settlement._id} for ₦${sweepAmount}. Waiting 20s...`);

                // 2. Process after delay (Harden with error tracking)
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

                        if (io) {
                            io.to(business._id.toString().toLowerCase()).emit('settlement_success', {
                                amount: sweepAmount,
                                invoiceNumber: sale.invoiceNumber,
                                timestamp: new Date()
                            });
                        }

                        // 🔔 WHATSAPP SETTLEMENT ALERT
                        if (business.whatsappNumber) {
                            let alertMsg = `💰 *Settlement Alert, ${business.displayName}!* \n\nI've successfully swept *₦${sweepAmount.toLocaleString()}* from the *${sale.customerName}* payment to your *${settlement.bankDetails.accountName}* account. \n\n🛡️ _Your money is safe!_`;
                            
                            if (business.planStatus === 'inactive' || business.planStatus === 'cancelled') {
                                alertMsg += `\n\n⚠️ *Boss, even while I'm 'Off-Duty', I'm still securing your cash!* Subscribe now to get your full AI reports and debt tracking back. \n🔗 https://usekredibly.com/login?redirect=/settings`;
                            }
                            
                            await sendWhatsAppAlert(business.whatsappNumber, business.displayName, alertMsg);
                        }
                    } catch (sweepErr) {
                        console.error(`❌ Auto-Sweep FAILED for Settlement ${settlement._id}:`, sweepErr.message);
                        settlement.status = 'failed';
                        settlement.lastError = sweepErr.message;
                        settlement.attempts += 1;
                        await settlement.save();

                        // Notify Oga of failure (Mission Critical)
                        if (business.whatsappNumber) {
                            const { sendReply } = require('../whatsapp/whatsappController');
                            await sendReply(business.whatsappNumber, `⚠️ *Settlement Issue, ${business.displayName}!* \n\nI tried to sweep *₦${sweepAmount.toLocaleString()}* to your bank, but it failed. \n\n*Reason:* ${sweepErr.message}\n\nDon't worry, the funds are safe in your Kredibly wallet. I'll try again shortly or you can check your dashboard! 🛡️`);
                        }
                    }
                }, 20000);

            } catch (err) {
                console.error('❌ Auto-Sweep Initialization Error:', err);
            }
        })();

        if (business.whatsappNumber) {
            const { sendWhatsAppPaymentAlert } = require('../whatsapp/whatsappController');
            sendWhatsAppPaymentAlert(business.whatsappNumber, creditAmount, sale.invoiceNumber, sale.customerName || payer, "", business.displayName, "");
        }

        return { success: true, message: "Payment processed!" };
    } catch (err) {
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
        business.trialExpiresAt = nextBilling;
        business.nextBillingDate = nextBilling;
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
