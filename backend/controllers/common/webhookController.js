const crypto = require('crypto');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Coupon = require('../../models/Coupon');
const { sendWhatsAppMessage } = require('../whatsapp/whatsappController');
const { getPlanPrice } = require('../../config/pricing');

exports.handlePaystackWebhook = async (req, res) => {
    try {
        // 1. Validate Paystack Signature
        // Use rawBody for verification if available (defined in index.js)
        const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
        
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            console.error('🚨 Webhook Signature Mismatch! Provided:', req.headers['x-paystack-signature']);
            return res.status(401).send('Invalid signature');
        }

        const event = req.body;
        console.log(`📡 Webhook Received Event: ${event.event} [${event.data?.reference}]`);

        // 2. Handle successful payment
        if (event.event === 'charge.success') {
            const { reference, metadata, amount, customer, currency } = event.data;
            const paymentType = metadata?.paymentType || (metadata?.invoiceNumber ? 'invoice' : 'unknown');
            
            console.log(`💰 Charge Success Type: ${paymentType}, Ref=${reference}, Customer=${customer?.email}`);

            if (paymentType === 'subscription') {
                const { plan, billingCycle, couponCode } = metadata;
                
                // 1. Find User and Profile
                const user = await User.findOne({ email: customer.email });
                if (!user) {
                    console.error(`❌ Webhook Error: No user found for email ${customer.email}`);
                    return res.sendStatus(200); // Stop here
                }

                const profile = await BusinessProfile.findOne({ ownerId: user._id });
                if (!profile) {
                    console.error(`❌ Webhook Error: No business profile found for owner ${user._id}`);
                    return res.sendStatus(200);
                }

                // 2. Idempotency Check
                if (profile.subscriptionId === reference) {
                    console.log(`⏩ Webhook reference ${reference} already processed for Business ${profile._id}. Skipping.`);
                    return res.sendStatus(200);
                }

                // 3. Verify Payment Amount (Anti-Fraud)
                if (currency !== 'NGN') {
                     console.error(`❌ Webhook Error: Invalid currency ${currency}`);
                     return res.sendStatus(200); 
                }

                const basePrice = getPlanPrice(plan, billingCycle);
                if (!basePrice) {
                     console.error(`❌ Webhook Error: Invalid plan details ${plan}/${billingCycle}`);
                     return res.sendStatus(200);
                }

                let expectedPrice = basePrice;
                let coupon = null;
                if (couponCode) {
                    coupon = await Coupon.findOne({ code: couponCode });
                    if (coupon) {
                         if (coupon.discountType === 'percentage') {
                            expectedPrice = basePrice * (1 - coupon.discountValue / 100);
                        } else if (coupon.discountType === 'fixed') {
                            expectedPrice = Math.max(0, basePrice - coupon.discountValue);
                        }
                    }
                }

                const paidAmount = amount / 100;
                if (Math.abs(paidAmount - expectedPrice) > 1) {
                     console.error(`🚨 Webhook Fraud Alert: Ref ${reference} Paid ₦${paidAmount}, Expected ₦${expectedPrice}`);
                     return res.sendStatus(200); // Do not upgrade
                }

                // 4. Update Profile
                profile.plan = plan;
                profile.planStatus = 'active';
                profile.billingCycle = billingCycle;
                profile.subscriptionId = reference;
                profile.trialExpiresAt = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
                await profile.save();

                // 5. Update Coupon
                if (coupon) {
                    await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
                }

                // 4. Record Payment
                // 6. Record Payment
                await Payment.findOneAndUpdate(
                    { reference },
                    {
                        businessId: profile._id,
                        reference: reference,
                        amount: paidAmount,
                        plan: plan,
                        billingCycle: billingCycle,
                        couponUsed: couponCode || null,
                        status: 'success',
                        paidAt: new Date()
                    },
                    { upsert: true }
                );

                console.log(`✅ Webhook: Business ${profile.displayName} upgraded to ${plan} via ${reference}`);
            } 
            else if (paymentType === 'invoice') {
                const invoiceNumber = metadata?.invoiceNumber;
                if (!invoiceNumber) {
                    console.warn(`⚠️ Webhook Warning: Invoice payment missing invoiceNumber in metadata.`);
                    return res.sendStatus(200);
                }

                const paidAmount = amount / 100;
                const sale = await Sale.findOneAndUpdate(
                    { 
                        invoiceNumber: invoiceNumber.toUpperCase(),
                        'payments.reference': { $ne: reference }
                    },
                    {
                        $push: {
                            payments: {
                                amount: paidAmount,
                                method: 'Paystack',
                                reference: reference,
                                date: new Date()
                            }
                        }
                    },
                    { new: true }
                ).populate('businessId');

                if (sale) {
                    const business = sale.businessId;
                    
                    await ActivityLog.create({
                        businessId: business._id,
                        action: 'PAYMENT_RECEIVED',
                        entityType: 'PAYMENT',
                        entityId: sale._id,
                        details: `Online payment of ₦${paidAmount.toLocaleString()} received for Invoice #${invoiceNumber}`
                    });

                    await Notification.create({
                        businessId: business._id,
                        title: 'Payment Received 💰',
                        message: `₦${paidAmount.toLocaleString()} received for Invoice #${invoiceNumber} from ${sale.customerName}.`,
                        type: 'sale',
                        saleId: sale._id
                    });

                    if (business && business.whatsappNumber) {
                        const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                        const balance = sale.totalAmount - totalPaid;
                        const receiptLink = `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/i/${invoiceNumber}`;
                        
                        let msg = `🔔 *Payment Alert!*\n\nChief, I've just verified an online payment of *₦${paidAmount.toLocaleString()}* for *Invoice #${invoiceNumber}* (${sale.customerName}).\n\n`;
                        if (balance <= 0) msg += `✅ *Fully Paid!* This debt is now cleared.\n\n`;
                        else msg += `⏳ *Balance Remaining:* ₦${balance.toLocaleString()}\n\n`;
                        msg += `📄 *View/Share Receipt:* ${receiptLink}`;
                        
                        await sendWhatsAppMessage(business.whatsappNumber, msg).catch(err => console.error(`❌ WhatsApp fail:`, err.message));
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('🚨 Global Webhook Exception:', error);
        res.sendStatus(500);
    }
};
