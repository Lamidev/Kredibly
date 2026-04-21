const crypto = require('crypto');
const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const VirtualAccount = require('../../models/VirtualAccount');
const Coupon = require('../../models/Coupon');
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require('../whatsapp/whatsappController');
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
            let paymentType = metadata?.paymentType || (metadata?.invoiceNumber ? 'invoice' : 'unknown');
            
            // 🛡️ RECOVER PAYMENT TYPE FROM METADATA-LESS TRANSFERS
            if (paymentType === 'unknown') {
                if (reference && reference.startsWith('KREDDY_INV_')) {
                    paymentType = 'invoice';
                } else if (metadata?.referrer && metadata.referrer.includes('/i/')) {
                    paymentType = 'invoice';
                }
            }

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
                profile.lastPaidAt = new Date();
                profile.nextBillingDate = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
                await profile.save();

                // 5. Update Coupon (Idempotent)
                if (coupon) {
                    await Coupon.updateOne(
                        { _id: coupon._id, usedReferences: { $ne: reference } },
                        { 
                          $inc: { usedCount: 1 }, 
                          $push: { usedReferences: reference } 
                        }
                    );
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
                let invoiceNumber = metadata?.invoiceNumber;
                
                // 🛡️ FALLBACK: If metadata is stripped (common in Bank Transfers)
                if (!invoiceNumber && reference && reference.startsWith("KREDDY_INV_")) {
                    const parts = reference.split("_");
                    invoiceNumber = parts[2]; // KR-XXXX
                    console.log(`🛡️ Recovered Metadata-less payment via Ref Prefix: ${invoiceNumber}`);
                }

                // 🛡️ FALLBACK 2: Recover from Paystack Inline Referrer
                if (!invoiceNumber && metadata?.referrer && metadata.referrer.includes('/i/')) {
                    const parts = metadata.referrer.split('/i/');
                    if (parts.length > 1) {
                         invoiceNumber = parts[1].split('?')[0].split('#')[0];
                         console.log(`🛡️ Recovered Metadata-less payment via Referrer: ${invoiceNumber}`);
                    }
                }

                if (!invoiceNumber) {
                    console.warn(`⚠️ Webhook Warning: Invoice payment missing invoiceNumber for ref ${reference}.`);
                    return res.sendStatus(200);
                }

                const paidAmount = amount / 100;
                const actualCreditAmount = metadata?.originalAmount ? Number(metadata.originalAmount) : paidAmount;
                
                // Try to find if this matches a Virtual Account reference
                let vaQuery = { invoiceNumber: invoiceNumber.toUpperCase() };
                if (reference.startsWith('KREDDY_VA_')) {
                    const va = await VirtualAccount.findOne({ reference });
                    if (va) {
                        va.status = 'used';
                        await va.save();
                        vaQuery = { _id: va.saleId };
                    }
                }

                // 1. Idempotency Check
                const alreadyPaid = await Sale.findOne({
                    ...vaQuery,
                    'payments.reference': reference
                });

                if (alreadyPaid) {
                    console.log(`⏩ Webhook reference ${reference} already processed for Invoice ${invoiceNumber}. Skipping.`);
                    return res.sendStatus(200);
                }

                // 2. Fetch and Validate Sale
                const sale = await Sale.findOne(vaQuery).populate('businessId');

                if (sale) {
                    // Update payments via .save() to trigger Mongoose pre-save hook for status updates!
                    sale.payments.push({
                        amount: actualCreditAmount,
                        method: 'Virtual Account Transfer',
                        reference: reference,
                        date: new Date()
                    });
                    await sale.save();

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
                        message: `₦${actualCreditAmount.toLocaleString()} received for Invoice #${invoiceNumber} from ${sale.customerName}.`,
                        type: 'sale',
                        saleId: sale._id
                    });

                    if (business && business.whatsappNumber) {
                        const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                        const balance = sale.totalAmount - totalPaid;
                        
                        let customText = "";
                        if (balance <= 0) customText = `✅ Fully Paid! This debt is now cleared.`;
                        else customText = `⏳ Balance Remaining: ₦${balance.toLocaleString()}`;
                        
                        const components = [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: paidAmount.toLocaleString() },
                                    { type: "text", text: invoiceNumber },
                                    { type: "text", text: sale.customerName },
                                    { type: "text", text: customText + ` \n\n📄 View Receipt: https://usekredibly.com/r/${invoiceNumber}` }
                                ]
                            }
                        ];
                        
                        await sendWhatsAppTemplate(business.whatsappNumber, 'kreddy_payment_alert', components).catch(err => console.error(`❌ WhatsApp fail:`, err.message));
                    }

                    // ⚡ REAL-TIME DASHBOARD UPDATE (Sockets)
                    const { getIO } = require('../../utils/socket');
                    const io = getIO();
                    if (io) {
                        console.log(`🔌 Emitting sale_updated for business: ${business._id}`);
                        io.to(business._id.toString()).emit('sale_updated', {
                            saleId: sale._id,
                            invoiceNumber: invoiceNumber,
                            amount: actualCreditAmount,
                            customerName: sale.customerName,
                            status: sale.status,
                            balance: sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0)
                        });
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
