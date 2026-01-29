const BusinessProfile = require('../../models/BusinessProfile');
const Coupon = require('../../models/Coupon');
const Payment = require('../../models/Payment');
const crypto = require('crypto');

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, plan, billingCycle, couponCode } = req.body;
        const profile = await BusinessProfile.findOne({ owner: req.user._id });
        if (!profile) return res.status(404).json({ message: "Business profile not found" });

        // 1. Handle Free Upgrade / 100% Discount Bypass
        let paystackData = null;
        if (reference && reference.startsWith('FREE_')) {
            if (!couponCode) return res.status(400).json({ message: "Coupon required for free upgrade" });
            const cp = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!cp || (cp.discountType === 'percentage' && cp.discountValue !== 100)) {
                return res.status(400).json({ message: "Invalid claim for free upgrade" });
            }
            // Mock paystack data for verification skip
            paystackData = { amount: 0 };
        } else {
            // Standard Paystack Verification
            const https = require('https');
            
            const options = {
                hostname: 'api.paystack.co',
                port: 443,
                path: `/transaction/verify/${reference}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            };

            const verifyRequest = new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => { resolve(JSON.parse(data)); });
                });
                req.on('error', (e) => { reject(e); });
                req.end();
            });

            const paystackRes = await verifyRequest;

            if (!paystackRes.status || paystackRes.data.status !== 'success') {
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }
            paystackData = paystackRes.data;
        }

        // 2. Add 'Oga' status logic
        const updateData = {
            plan: plan, // 'oga' or 'chairman'
            planStatus: 'active',
            billingCycle: billingCycle, // 'monthly' or 'yearly'
            subscriptionId: reference, // Using reference as ID for now
            // Extend expiry based on duration (Monthly = 30 days, Yearly = 365)
            trialExpiresAt: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        };

        // 3. Handle Coupon Usage
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        // 4. Update Profile
        const updatedProfile = await BusinessProfile.findByIdAndUpdate(
            profile._id, 
            updateData, 
            { new: true }
        );

        // 5. Log Internal Payment Record
        await Payment.create({
            businessId: profile._id,
            reference: reference,
            amount: paystackData.amount / 100, // Convert from kobo
            plan: plan,
            billingCycle: billingCycle,
            couponUsed: couponCode || null,
            status: 'success',
            paidAt: new Date()
        });

        res.status(200).json({ 
            success: true, 
            message: "Upgrade successful! Welcome to the Oga life.",
            profile: updatedProfile 
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Server error during upgrade" });
    }
};
