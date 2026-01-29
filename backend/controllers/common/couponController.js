const Coupon = require('../../models/Coupon');
const Waitlist = require('../../models/Waitlist');

exports.validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user._id;
        const userEmail = req.user.email;

        if (!code) return res.status(400).json({ message: "Coupon code is required" });

        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(), 
            isActive: true 
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid coupon code" });
        }

        // Check Expiry
        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return res.status(400).json({ success: false, message: "This coupon has expired" });
        }

        // Check Max Uses
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ success: false, message: "This coupon has reached its usage limit" });
        }

        // Check Waitlist Requirement (The "Email Lock")
        if (coupon.requiresWaitlist) {
            const isWaitlisted = await Waitlist.findOne({ email: userEmail });
            if (!isWaitlisted) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Exclusive Code: This coupon is reserved for Founding Members on the waitlist." 
                });
            }
        }

        // Success! Return discount details
        res.status(200).json({
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                description: coupon.requiresWaitlist ? "Founding Member Discount Applied" : "Distcount Applied"
            }
        });

    } catch (error) {
        console.error("Coupon Validation Error:", error);
        res.status(500).json({ message: "Server error validating coupon" });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        // Admin only check should be in middleware, but double check here if needed
        const { code, discountType, discountValue, maxUses, requiresWaitlist, expiresAt } = req.body;

        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            maxUses,
            requiresWaitlist,
            expiresAt
        });

        await newCoupon.save();
        res.status(201).json({ success: true, data: newCoupon });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
