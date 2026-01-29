const crypto = require('crypto');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');

exports.handlePaystackWebhook = async (req, res) => {
    try {
        // 1. Validate Paystack Signature
        // Use rawBody for verification if available (defined in index.js)
        const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
        
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            console.error('🚨 Webhook Signature Mismatch!');
            return res.status(401).send('Invalid signature');
        }

        const event = req.body;

        // 2. Handle successful payment
        if (event.event === 'charge.success') {
            const { reference, metadata, amount, customer } = event.data;
            
            // Extract useful info from metadata
            const invoiceNumber = metadata.invoiceNumber;
            
            if (invoiceNumber) {
                // Atomic update of the Sale record
                const paidAmount = amount / 100; // Convert from kobo to NGN
                
                // Find the sale
                const sale = await Sale.findOne({ invoiceNumber: invoiceNumber }).populate('businessId');

                if (sale) {
                    // Idempotency: Check if this reference has already been processed for this sale
                    const alreadyProcessed = sale.payments.some(p => p.reference === reference);
                    if (alreadyProcessed) {
                        console.log(`⏩ Webhook reference ${reference} already processed. Skipping.`);
                        return res.sendStatus(200);
                    }

                    sale.payments.push({ 
                        amount: paidAmount, 
                        method: 'Paystack', 
                        reference: reference,
                        date: new Date()
                    });
                    
                    await sale.save();
                    
                    const business = sale.businessId;

                    // Log Activity
                    await ActivityLog.create({
                        businessId: business._id,
                        action: 'PAYMENT_RECEIVED',
                        entityType: 'PAYMENT',
                        entityId: sale._id,
                        details: `Online payment of ₦${paidAmount.toLocaleString()} received for Invoice #${invoiceNumber}`
                    });

                    // Create In-App Notification
                    await Notification.create({
                        businessId: business._id,
                        title: 'Payment Received 💰',
                        message: `₦${paidAmount.toLocaleString()} received for Invoice #${invoiceNumber} from ${sale.customerName}.`,
                        type: 'sale',
                        saleId: sale._id
                    });

                    // WhatsApp Alert via Kreddy
                    if (business.whatsappNumber) {
                        const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);
                        const receiptLink = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/i/${invoiceNumber}`;
                        
                        let msg = `🔔 *Payment Alert!*\n\nChief, I've just verified an online payment of *₦${paidAmount.toLocaleString()}* for *Invoice #${invoiceNumber}* (${sale.customerName}).\n\n`;
                        
                        if (balance <= 0) {
                            msg += `✅ *Fully Paid!* This debt is now cleared. I've updated your ledger records accordingly.\n\n`;
                        } else {
                            msg += `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}\n*Action:* I've updated the invoice status to ${sale.status.toUpperCase()}.\n\n`;
                        }

                        msg += `📄 *View/Share Receipt:* ${receiptLink}\n\n_Kreddy - Your Digital Trust Assistant_`;
                        
                        await sendWhatsAppMessage(business.whatsappNumber, msg);
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook Error:', error);
        res.sendStatus(500);
    }
};
