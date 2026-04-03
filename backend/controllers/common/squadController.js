const { generateVirtualAccount, initiateInstantDisbursement, verifySquadWebhookSignature } = require('../../utils/squad');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const Notification = require('../../models/Notification');
const VirtualAccount = require('../../models/VirtualAccount');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');
const { logActivity } = require('../../utils/activityLogger');

/**
 * ⚡ INITIALIZE SQUAD ACCOUNT
 * Called by PublicInvoicePage to get the GTBank/Zenith transfer details for a customer.
 */
exports.initializeSquadAccount = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;

        if (!invoiceId) {
            return res.status(400).json({ message: "Invoice ID or slug is required" });
        }

        // 1. Find the invoice/sale
        const sale = await Sale.findOne({
            $or: [
                { _id: invoiceId.match(/^[0-9a-fA-F]{24}$/) ? invoiceId : null },
                { invoiceNumber: invoiceId.toUpperCase() },
                { publicSlug: invoiceId }
            ]
        }).populate('businessId');

        if (!sale) return res.status(404).json({ message: "Invoice not found" });

        const business = sale.businessId;
        if (!business) return res.status(404).json({ message: "Associated business profile not found" });

        // Calculate the outstanding balance
        const totalPaid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
        const outstanding = sale.totalAmount - totalPaid;
        const amountToCharge = parseFloat(amount) || outstanding;

        if (amountToCharge <= 0) {
            return res.status(400).json({ message: "Invoice is already fully paid" });
        }

        // 2. Reuse active VA if exists for same amount
        const existing = await VirtualAccount.findOne({
            saleId: sale._id,
            status: 'active',
            provider: 'squad',
            amount: amountToCharge
        });

        if (existing && existing.accountNumber) {
            console.log(`♻️  Reusing Squad VA for #${sale.invoiceNumber}`);
            return res.status(200).json({
                success: true,
                data: {
                    accountNumber: existing.accountNumber,
                    accountName: existing.accountName,
                    bankName: existing.bankName,
                    amount: amountToCharge,
                    reference: existing.reference,
                    expiresAt: existing.expiresAt,
                    note: `Transfer the exact amount to this ${existing.bankName} account for instant settlement.`
                }
            });
        }

        // 3. GENERATE SQUAD VIRTUAL ACCOUNT
        console.log(`💎 Initializing Squad DVA for #${sale.invoiceNumber} (₦${amountToCharge})`);
        
        const squadData = await generateVirtualAccount({
            amount: amountToCharge,
            customerName: sale.customerName || 'Merchant Customer',
            email: sale.customerEmail || 'payments@usekredibly.com',
            invoiceNumber: sale.invoiceNumber,
            merchantBusinessName: business.displayName
        });

        // 4. Save to database for tracking
        const vaRecord = await VirtualAccount.create({
            businessId: business._id,
            saleId: sale._id,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: squadData.accountNumber,
            accountName: squadData.accountName,
            bankName: squadData.bankName,
            provider: 'squad',
            reference: squadData.transactionReference,
            amount: amountToCharge,
            status: 'active',
            expiresAt: squadData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        console.log(`✅ VA Created for ${sale.invoiceNumber}: ${vaRecord.accountNumber} (${vaRecord.bankName})`);

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                accountName: vaRecord.accountName,
                bankName: vaRecord.bankName,
                amount: amountToCharge,
                reference: vaRecord.reference,
                expiresAt: vaRecord.expiresAt,
                note: `Transfer the exact amount to the ${vaRecord.bankName} account above for instant settlement.`
            }
        });

    } catch (error) {
        console.error("Squad Initialization Error:", error.message);
        res.status(500).json({ 
            message: error.message.includes('not profiled') 
                ? error.message 
                : "Failed to generate transfer details. Please use Card/Transfer (Paystack) instead." 
        });
    }
};

/**
 * 🔗 SQUAD WEBHOOK HANDLER
 * Process incoming payment credits and trigger INSTANT payout to merchant.
 */
exports.handleSquadWebhook = async (req, res) => {
    // Ack immediately to prevent Squad from retries
    res.status(200).json({ success: true, message: "Webhook accepted for processing" });

    try {
        const { event, data } = req.body;
        const signature = req.headers['x-squad-signature'];

        // 1. SECURITY: Signature Verification (Using RAW body for maximum reliability)
        if (process.env.NODE_ENV !== 'development' && signature) {
            const isValid = verifySquadWebhookSignature(signature, req.rawBody);
            if (!isValid) {
                console.error("🚨 Squad Webhook: Signature Invalid — SPOOF ALERT!");
                return;
            }
        }

        // 2. Only process credit events from Squad DVA
        if (event !== 'virtual-account/credit' && event !== 'charge_successful' && event !== 'transaction_successful') {
            console.log(`⏭️  Squad Webhook: Ignored event "${event}"`);
            return;
        }

        const reference = data?.transaction_reference || data?.reference;
        const virtualAccountNumber = data?.virtual_account_number;
        const customerIdentifier = data?.customer_identifier || data?.merchant_reference; // This matches our invoiceNum
        const paidAmount = parseFloat(data?.principal_amount || data?.settled_amount || data?.amount || 0);

        if (!paidAmount || !customerIdentifier) {
            console.error("❌ Squad Webhook: Missing required data fields in payload.");
            return;
        }

        console.log(`💰 Squad Settlement: ₦${paidAmount} received for Invoice #${customerIdentifier}`);

        // 3. Find the Virtual Account record to confirm association
        let vaRecord = await VirtualAccount.findOne({ 
            $or: [
                { reference: reference },
                { accountNumber: virtualAccountNumber, status: 'active' },
                { invoiceNumber: customerIdentifier.toUpperCase(), status: 'active' }
            ]
        });

        if (!vaRecord) {
            console.error(`❌ Squad Webhook: No active VA record for #${customerIdentifier} / VA: ${virtualAccountNumber}`);
            return;
        }

        // 4. Load the Sale and Business
        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) return console.error(`❌ Squad Webhook: Sale not found for VA match`);
        const business = sale.businessId;

        // 5. PROTECT: Prevent Duplicate Payments
        const processed = sale.payments.some(p => p.reference === reference);
        if (processed) return console.log(`✅ Squad Webhook: Already processed reference ${reference}.`);

        // 6. RECORD PAYMENT (INSTANTLY UPDATE STATUS)
        sale.payments.push({
            amount: paidAmount,
            method: 'Bank Transfer (Squad)',
            reference: reference,
            date: new Date()
        });
        await sale.save(); // 🔥 Pre-save hook flips status to 'paid' or 'partial'

        // Record VA as used
        vaRecord.status = 'used';
        await vaRecord.save();

        console.log(`✅ Instant Settlement Confirmed: Invoice #${sale.invoiceNumber} | ₦${paidAmount}`);

        // 7. AUDIT & IN-APP NOTIFY
        await logActivity({
            businessId: business._id,
            action: "PAYMENT_RECEIVED",
            entityType: "PAYMENT",
            entityId: sale._id,
            details: `Squad DVA Transfer of ₦${paidAmount.toLocaleString()} received for Invoice #${sale.invoiceNumber}`
        }).catch(err => console.error("Logging failed:", err.message));

        await Notification.create({
            businessId: business._id,
            title: "⚡ Instant Payment Alert!",
            message: `Customer ${sale.customerName} just paid ₦${paidAmount.toLocaleString()} via Bank Transfer (#${sale.invoiceNumber}).`,
            type: "sale",
            saleId: sale._id
        }).catch(err => console.error("Notification failed:", err.message));

        // 8. TRIGGER INSTANT PAYOUT (DIRECT-TO-BANK)
        let payoutStatus = "deferred";
        const canPayout = business.bankDetails?.accountNumber && business.bankDetails?.bankCode;

        if (canPayout && !business.isCompromised) {
            // TEMPORARY TESTING LOGIC:
            // Deduct the ₦25 Squad transfer fee from the merchant's payout until master balance is funded.
            const transferFee = 25;
            const netPayout = Math.max(0, paidAmount - transferFee); 
            

            try {
                console.log(`🚀 Dispatching Instant Payout: ₦${netPayout.toLocaleString()} → ${business.bankDetails.bankName}`);
                await initiateInstantDisbursement({
                    amount: netPayout,
                    bankCode: business.bankDetails.bankCode,
                    accountNumber: business.bankDetails.accountNumber,
                    accountName: business.bankDetails.accountName,
                    remarks: `Kredibly Settlement: ${sale.invoiceNumber}`
                });
                payoutStatus = "pushed";
            } catch (err) {
                console.error("❌ Squad Instant Payout Failed:", err.message);
                payoutStatus = "failed_manual";
            }
        }

        // 9. WHATSAPP CONFIRMATION
        if (business.whatsappNumber) {
            const receiptLink = `https://usekredibly.com/r/${sale.invoiceNumber}`;
            const bossTitle = business.plan === 'chairman' ? 'Chairman' : (business.plan === 'oga' ? 'Oga' : 'Chief');

            let msg = `⚡ *Kreddy Instant Settlement!*\n\n`;
            msg += `${bossTitle}, a customer just paid *₦${paidAmount.toLocaleString()}* for *Invoice #${sale.invoiceNumber}*.\n\n`;

            if (payoutStatus === "pushed") {
                msg += `💰 *Instant Settlement:* I've automatically pushed the money directly into your *${business.bankDetails.bankName}* account! Alert on the way! ✅\n\n`;
            } else if (payoutStatus === "failed_manual") {
                msg += `⏳ *Wallet Settlement:* The automatic payout failed. The money is in your Kredibly wallet for manual withdrawal. 🏦\n\n`;
            } else {
                msg += `💼 *Wallet:* Money is in your Kredibly wallet. Add your bank details to enable automatic instant payouts. 🏦\n\n`;
            }

            msg += `📄 *Official Receipt:* ${receiptLink}\n\n_Kreddy — Your Digital Finance Secretary_ 🛡️`;
            
            await sendWhatsAppMessage(business.whatsappNumber, msg).catch(e => console.error("WA Fail:", e.message));
        }

    } catch (error) {
        console.error("🚨 Squad Webhook Server Error:", error);
    }
};
