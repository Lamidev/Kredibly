const Sale = require("../../models/Sale");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { sendWhatsAppMessage } = require("../whatsapp/whatsappController");
const crypto = require("crypto");

/**
 * Handles Paystack Webhooks for automated payment reconciliation.
 */
exports.handlePaystackWebhook = async (req, res) => {
    // 1. Verify Signature (Security)
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
        return res.sendStatus(400); // Unauthorized
    }

    const event = req.body;
    res.sendStatus(200); // Acknowledge early

    if (event.event === 'charge.success') {
        const { reference, amount, metadata, customer } = event.data;
        const invoiceNumber = metadata?.invoiceNumber || reference?.split('_')[0];

        try {
            const sale = await Sale.findOne({ invoiceNumber });
            if (!sale) {
                console.error(`Webhook Error: Sale not found for invoice ${invoiceNumber}`);
                return;
            }

            const profile = await BusinessProfile.findById(sale.businessId);
            const paidAmount = amount / 100; // Convert from kobo

            // 2. Prevent Duplicate Processing
            const alreadyExists = sale.payments.some(p => p.method === "Paystack" && p.reference === reference);
            if (alreadyExists) return;

            // 3. Record Payment
            sale.payments.push({
                amount: paidAmount,
                method: "Paystack",
                date: new Date(),
                reference: reference
            });

            await sale.save();

            // 3b. Log Activity for Dashboard Feed
            const { logActivity } = require("../../utils/activityLogger");
            await logActivity({
                businessId: sale.businessId,
                action: "AUTOMATED_PAYMENT_RECEIVED",
                entityType: "SALE",
                entityId: sale._id,
                details: `Automated Paystack payment of ₦${paidAmount.toLocaleString()} received for Invoice #${invoiceNumber}`
            });

            // 4. Send "WOW" Alert to Merchant via WhatsApp
            if (profile && profile.whatsappNumber) {
                const balance = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                const statusMsg = balance <= 0 ? "✅ *FULLY PAID!*" : `⏳ *Balance Remaining: ₦${balance.toLocaleString()}*`;
                
                const message = `🔔 *Payment Received!* \n\nChief, *${sale.customerName}* just paid *₦${paidAmount.toLocaleString()}* via your Kredibly link.\n\n${statusMsg}\n\nI've updated your ledger automatically! 🚀`;
                
                await sendWhatsAppMessage(profile.whatsappNumber, message);
            }

            // 5. Create Dashboard Notification
            await Notification.create({
                businessId: sale.businessId,
                title: "Automated Payment ✅",
                message: `₦${paidAmount.toLocaleString()} received from ${sale.customerName}.`,
                type: "payment",
                saleId: sale._id
            });

        } catch (err) {
            console.error("Webhook Processing Error:", err);
        }
    }
};

/**
 * Fetches public sale info for the invoice page.
 */
exports.getPublicInvoice = async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const sale = await Sale.findOne({ invoiceNumber })
            .populate("businessId", "displayName logoUrl bankDetails entityType");
        
        if (!sale) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json({
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            description: sale.description,
            totalAmount: sale.totalAmount,
            paidAmount: sale.payments.reduce((s, p) => s + p.amount, 0),
            status: sale.status,
            dueDate: sale.dueDate,
            business: sale.businessId,
            createdAt: sale.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
