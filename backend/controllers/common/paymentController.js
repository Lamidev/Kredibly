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
 * Generates dynamic Open Graph metadata for WhatsApp/Social previews
 * then redirects the user to the actual frontend invoice.
 */
exports.shareInvoice = async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const sale = await Sale.findOne({ invoiceNumber })
            .populate("businessId", "displayName logoUrl");
        
        if (!sale) return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/`);

        const balance = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
        const title = `Invoice from ${sale.businessId?.displayName || "Kredibly"}`;
        const description = `Amount: ₦${balance.toLocaleString()} | Item: ${sale.description} | Securely view and pay on Kredibly.`;
        
        // Use business logo if available, or our premium placeholder
        const imageUrl = sale.businessId?.logoUrl || "https://usekredibly.com/og-receipt-preview.png"; 

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title}</title>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta property="og:title" content="${title}" />
                    <meta property="og:description" content="${description}" />
                    <meta property="og:image" content="${imageUrl}" />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="${process.env.FRONTEND_URL}/i/${invoiceNumber}" />
                    
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="${title}" />
                    <meta name="twitter:description" content="${description}" />
                    <meta name="twitter:image" content="${imageUrl}" />

                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">

                    <style>
                        body { background: #F8FAFC; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #0F172A; text-align: center; }
                        .card { background: white; padding: 40px; border-radius: 32px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05); border: 1px solid #F1F5F9; max-width: 400px; width: 90%; }
                        .loader { width: 48px; height: 48px; border: 4px solid #F3E8FF; border-top: 4px solid #7C3AED; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px; }
                        h1 { font-size: 20px; font-weight: 900; margin: 0 0 8px; }
                        p { font-size: 14px; color: #64748B; margin: 0; font-weight: 500; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>

                    <meta http-equiv="refresh" content="1; url=${process.env.FRONTEND_URL || "http://localhost:5173"}/i/${invoiceNumber}" />
                </head>
                <body>
                    <div class="card">
                        <div class="loader"></div>
                        <h1>Securing Connection...</h1>
                        <p>Loading your verified Kredibly invoice.</p>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.location.href = "${process.env.FRONTEND_URL || "http://localhost:5173"}/i/${invoiceNumber}";
                        }, 800);
                    </script>
                </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/`);
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
