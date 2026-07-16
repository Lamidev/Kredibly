const crypto = require('crypto');
const { generateVirtualAccount, initiateInstantDisbursement } = require('../../utils/squad');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const VirtualAccount = require('../../models/VirtualAccount');
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require('../whatsapp/whatsappController');

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
                { invoiceNumber: invoiceId.toUpperCase() }
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
            amount: amount,
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
        // 1. Validate Squad Signature (Security First)
        const secret = process.env.SQUAD_SECRET_KEY;
        const signature = req.headers['x-squad-signature'];
        
        if (!signature) return res.status(401).json({ message: "Missing signature" });

        // Use rawBody for verification to match Squad's exact payload string
        const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
        const hash = crypto.createHmac('sha512', secret)
            .update(payload)
            .digest('hex').toUpperCase(); // Squad uses UPPERCASE for their hash comparisons usually

        // NOTE: If Squad uses lowercase, we adjust here. Standard check:
        if (hash !== signature.toUpperCase()) {
            console.error('🚨 Squad Webhook Signature Mismatch!');
            return res.status(401).json({ message: "Invalid signature" });
        }

        const { event, data } = req.body;

        // ONLY process successful events
        if (event !== 'charge_successful' && event !== 'transaction_successful') {
            return res.status(200).json({ message: "Ignored event type" });
        }

        const reference = data.transaction_reference || data.reference;
        const paidAmount = data.amount / 100; // Squad sends in kobo (base unit)

        // 2. Find the Records
        const vaRecord = await VirtualAccount.findOne({ reference });
        if (!vaRecord) {
             // FALLBACK: Sometimes reference might be slightly different in nested data
             console.warn(`⚠️ VA Record not found for Squad Ref: ${reference}. Checking metadata...`);
             return res.status(200).json({ message: "Reference not tracked locally" }); 
        }

        const sale = await Sale.findById(vaRecord.saleId).populate('businessId');
        if (!sale) return res.status(200).json({ message: "Sale not found" });
        const business = sale.businessId;

        // Idempotency check
        if (sale.payments.find(p => p.reference === reference)) {
            return res.status(200).json({ success: true, message: "Already processed" });
        }

        // 3. UPDATE BOOKKEEPING (INSTANT)
        sale.payments.push({ 
            amount: paidAmount, 
            method: 'Instant Bank Transfer', 
            reference, 
            date: new Date() 
        });
        await sale.save(); // 🔥 Flips status to 'paid' via pre-save middleware

        console.log(`✅ Squad Payment Verified for #${sale.invoiceNumber} (₦${paidAmount})`);

        // 4. TRIGGER INSTANT PAYOUT (Hybrid Fee Model)
        let payoutStatus = "deferred";
        let payoutRef = null;

        if (business.bankDetails?.accountNumber && business.bankDetails?.bankCode) {
            // Check if Bank Security Lock is active
            const isLocked = business.bankDetails.bankDetailsLockUntil && new Date() < business.bankDetails.bankDetailsLockUntil;
            
            if (isLocked) {
                payoutStatus = "locked_security";
                console.warn(`🛡️ Payout Locked for ${business.displayName} until ${business.bankDetails.bankDetailsLockUntil}`);
            } else {
                // Calculation: Paid - (0.1% Collection) - N25 Transfer
                const collectionFee = paidAmount * 0.001; 
                const transferFee = 25; 
                const netPayout = Math.floor(paidAmount - collectionFee - transferFee);

                if (netPayout > 50) { // Only payout if it's worth the transfer fee
                    try {
                        const disbursement = await initiateInstantDisbursement({
                            amount: netPayout,
                            bankCode: business.bankDetails.bankCode,
                            accountNumber: business.bankDetails.accountNumber,
                            accountName: business.bankDetails.accountName,
                            remarks: `Settlement: ${sale.invoiceNumber}`
                        });
                        payoutStatus = "pushed";
                        payoutRef = disbursement.data?.reference || "SQUAD_PROCESSED";
                    } catch (err) {
                        console.error("❌ Instant Payout Failed:", err.message);
                        payoutStatus = "fail_manual";
                    }
                }
            }
        }

        // 5. LOG ACTIVITY & NOTIFY BOSS

        if (business.whatsappNumber) {
            let statusText = "";
            if (payoutStatus === "pushed") {
                statusText = `Instant Settlement! I have automatically pushed ₦${(paidAmount - (paidAmount*0.001) - 25).toLocaleString()} into your ${business.bankDetails.bankName} account. Alert on the way! ⚡`;
            } else if (payoutStatus === "locked_security") {
                statusText = `Security Lock: Funds will be held in your Kredibly wallet for 24h because your bank details were recently changed. 🛡️`;
            } else {
                statusText = `Wallet Deposit: Funds added to your Kredibly wallet. (Reason: ${payoutStatus === "fail_manual" ? "Bank network error" : "No bank details linked"}).`;
            }

            const { sendWhatsAppPaymentAlert } = require('../whatsapp/whatsappController');
            await sendWhatsAppPaymentAlert(
                business.whatsappNumber,
                paidAmount,
                sale.invoiceNumber,
                sale.customerName,
                statusText,
                business.displayName || 'Chief'
            ).catch(e => console.error("Squad WA Fail:", e.message));

            // 🧠 KREDDY AI: Notify customer via WhatsApp too
            try {
                const { notifyCustomerPaymentReceived } = require('../../utils/customerInvoiceService');
                await notifyCustomerPaymentReceived(sale._id, paidAmount);
            } catch (custNotifyErr) {
                console.error("Customer payment notify error:", custNotifyErr.message);
            }
        }

        // ⚡ 6. REAL-TIME DASHBOARD UPDATE (Sockets)
        const { getIO } = require('../../utils/socket');
        const io = getIO();
        if (io) {
            io.to(business._id.toString()).emit('sale_updated', {
                saleId: sale._id,
                status: sale.status,
                paidAmount: paidAmount
            });
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Squad Webhook Exception:", error);
        res.status(500).json({ message: "Internal processing error" });
    }
};
