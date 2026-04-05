const { generateVirtualAccount, initiateInstantDisbursement } = require('../../utils/squad');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const VirtualAccount = require('../../models/VirtualAccount');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');

/**
 * ⚡ INITIALIZE SQUAD ACCOUNT
 * Called by PublicInvoicePage to get the GTBank details for a customer.
 */
exports.initializeSquadAccount = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;

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

        // 2. Check if an active Squad VA already exists to prevent duplicate generation
        const existing = await VirtualAccount.findOne({ 
            saleId: sale._id, 
            status: 'active',
            bankName: /Guaranty Trust/i 
        });
        
        if (existing) {
            return res.status(200).json({ success: true, data: existing });
        }

        // 3. GENERATE SQUAD ACCOUNT
        console.log(`💎 Generating Squad Instant-Pay VA for ${business.displayName}`);
        
        const squadData = await generateVirtualAccount({
            amount: amount || (sale.totalAmount - sale.payments.reduce((s,p) => s + p.amount, 0)),
            customerName: sale.customerName,
            email: sale.customerEmail,
            invoiceNumber: sale.invoiceNumber,
            merchantBusinessName: business.displayName
        });

        // 4. Save to our database for tracking
        const vaRecord = await VirtualAccount.create({
            businessId: business._id,
            saleId: sale._id,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: squadData.accountNumber,
            accountName: squadData.accountName,
            bankName: squadData.bankName,
            reference: squadData.transactionReference,
            totalAmount: amount,
            status: "active"
        });

        res.status(201).json({
            success: true,
            data: {
                accountNumber: vaRecord.accountNumber,
                accountName: vaRecord.accountName,
                bankName: vaRecord.bankName,
                amount: amount,
                reference: vaRecord.reference,
                note: "Please transfer to the account above for instant settlement."
            }
        });

    } catch (error) {
        console.error("Squad Initialization Error:", error);
        res.status(500).json({ message: "Failed to generate instant transfer details" });
    }
};

/**
 * 🔗 SQUAD WEBHOOK HANDLER
 * Listens for payment notification from Squad and triggers the INSTANT PAYOUT.
 */
exports.handleSquadWebhook = async (req, res) => {
    try {
        const { event, data } = req.body;

        // Basic verification: ONLY process successful credit events
        if (event !== 'charge_successful' && event !== 'transaction_successful') {
            return res.status(200).json({ message: "Ignored event type" });
        }

        const reference = data.transaction_reference || data.reference;
        const paidAmount = data.amount / 100; // Assuming Squad sends in kobo

        // 1. Find the Virtual Account record in our DB
        const vaRecord = await VirtualAccount.findOne({ reference });
        if (!vaRecord) return res.status(404).json({ message: "Transaction reference not found" });

        // 2. Load the Sale and Business
        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) return res.status(404).json({ message: "Associated sale not found" });
        const business = sale.businessId;

        // Check if already processed
        if (sale.payments.find(p => p.reference === reference)) {
            return res.status(200).json({ success: true, message: "Already processed" });
        }

        // 3. UPDATE BOOKKEEPING (INSTANT)
        sale.payments.push({ 
            amount: paidAmount, 
            method: 'Bank Transfer (Squad)', 
            reference, 
            date: new Date() 
        });
        await sale.save(); // 🔥 Flips status to 'paid' automatically

        console.log(`✅ Squad Payment Verified for Invoice #${sale.invoiceNumber}`);

        // 4. TRIGGER INSTANT PAYOUT (THE MAGIC)
        let payoutStatus = "deferred";
        if (business.bankDetails?.accountNumber && business.bankDetails?.bankCode) {
            console.log(`🚀 Triggering Instant Payout to ${business.displayName} bank account...`);
            
            // Calculate payout (Minus Squad 0.25% fee + maybe a fixed transfer fee)
            const squadFee = paidAmount * 0.0025;
            const transferFee = 25; // Example ₦25 transfer fee
            const netPayout = paidAmount - (squadFee + transferFee);

            try {
                await initiateInstantDisbursement({
                    amount: netPayout,
                    bankCode: business.bankDetails.bankCode,
                    accountNumber: business.bankDetails.accountNumber,
                    accountName: business.bankDetails.accountName,
                    remarks: `Kredibly Settlement: ${sale.invoiceNumber}`
                });
                payoutStatus = "pushed";
            } catch (err) {
                console.error("❌ Instant Payout Failed:", err.message);
                payoutStatus = "failed_manual_required";
            }
        }

        // 5. NOTIFY MERCHANT VIA WHATSAPP
        if (business.whatsappNumber) {
            const receiptLink = `https://usekredibly.com/r/${sale.invoiceNumber}`;
            let msg = `🔔 *Payment Received (Instant Mode)!*\n\nChief, a customer just paid *₦${paidAmount.toLocaleString()}* for *Invoice #${sale.invoiceNumber}*.\n\n`;
            
            if (payoutStatus === "pushed") {
                msg += `💰 *Instant Settlement:* I have automatically pushed the funds directly into your *${business.bankDetails.bankName}* account. Alert on the way! ⚡\n\n`;
            } else {
                msg += `⏳ *Wallet:* The money is in your Kredibly wallet. Please visit the dashboard to withdrawal manually (Reason: Missing Bank Details).\n\n`;
            }

            msg += `📄 *Official Receipt:* ${receiptLink}\n\n_Kreddy is keeping your business fast!_ 🛡️`;
            await sendWhatsAppMessage(business.whatsappNumber, msg);
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Squad Webhook Error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};
