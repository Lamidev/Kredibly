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

        const pioneerPrices = { hustler: 1500, oga: 3000, chairman: 4500 };
        const amount = pioneerPrices[plan] || 1500;

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

        // 🚀 PERFECT AUTO-SWEEP LOGIC
        (async () => {
            try {
                console.log(`⚡ Auto-Sweep [Invoice #${sale.invoiceNumber}] - Waiting 20s for Nomba sync...`);
                await new Promise(resolve => setTimeout(resolve, 20000));

                const bankDetails = business.bankDetails;
                if (!bankDetails?.bankCode || !bankDetails?.accountNumber) return;

                // 🛡️ SMART SWEEP: Calculate actual net of the amount paid
                // We use calculateNetAmount to ensure we don't sweep more than what Nomba actually settled into our wallet.
                const actualNet = FINANCIAL_CONFIG.calculateNetAmount(amount);
                const sweepAmount = Math.floor(Math.min(creditAmount, actualNet));

                const { initiateTransfer } = require('../../utils/nomba');
                await initiateTransfer({
                    amount: sweepAmount,
                    bankCode: bankDetails.bankCode,
                    accountNumber: bankDetails.accountNumber,
                    accountName: bankDetails.accountName || business.displayName,
                    narration: `KREDIBLY/${sale.invoiceNumber.replace('KR-', '')}`
                });

                console.log(`✅ Auto-Sweep SUCCESS for ${business.displayName}: ₦${sweepAmount} settled.`);

                if (io) {
                    io.to(business._id.toString().toLowerCase()).emit('settlement_success', {
                        amount: sweepAmount,
                        invoiceNumber: sale.invoiceNumber,
                        timestamp: new Date()
                    });
                }

                // 🔔 WHATSAPP SETTLEMENT ALERT (To Merchant)
                if (business.whatsappNumber) {
                    const cleanPhone = business.whatsappNumber.replace(/\D/g, '');
                    const { sendWhatsAppAlert } = require('../whatsapp/whatsappController');
                    
                    const settlementMsg = `💰 *Settlement Successful!* \n\nI have just swept *₦${sweepAmount.toLocaleString()}* to your registered bank account (${bankDetails.bankName} - ${bankDetails.accountNumber}). \n\nThis payment was for Invoice #${sale.invoiceNumber}. Your funds should land any moment! 🚀`;
                    
                    await sendWhatsAppAlert(cleanPhone, "", settlementMsg, sale.invoiceNumber);
                }
            } catch (sweepErr) {
                console.error(`❌ Auto-Sweep FAILED for #${sale.invoiceNumber}:`, sweepErr.message);
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
        await business.save();
    } catch (error) { console.error('❌ Sub Webhook Error:', error); }
}

exports.processDailyNombaSettlements = async () => {};
