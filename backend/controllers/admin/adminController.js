const User = require("../../models/User");
const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");
const Notification = require("../../models/Notification");
const SupportTicket = require("../../models/SupportTicket");
const Payment = require("../../models/Payment");

exports.getGlobalStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user', isVerified: true });
        const totalBusinesses = await BusinessProfile.countDocuments();
        const totalSalesCount = await Sale.countDocuments();

        // 1. Merchant Platform Volume (Money flowing through merchants)
        const sales = await Sale.find({});
        let totalPlatformVolume = 0;
        let totalOutstanding = 0;

        sales.forEach(s => {
            const paid = (s.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            totalPlatformVolume += paid;
            totalOutstanding += Math.max(0, (s.totalAmount || 0) - paid);
        });

        // 2. Kredibly Revenue (Subscription payments)
        const allPayments = await Payment.find({ status: 'success' });
        const totalKrediblyRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

        // Get latest 50 activities across the entire platform
        const globalActivities = await ActivityLog.find({})
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBusinesses,
                totalSalesCount,
                totalPlatformVolume,
                totalOutstanding,
                totalKrediblyRevenue
            },
            activities: globalActivities
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select("-password");
        const businesses = await BusinessProfile.find({});

        // Combine data for a clearer overview
        const userList = users.map(u => {
            const biz = businesses.find(b => b.ownerId.toString() === u._id.toString());
            return {
                ...u._doc,
                business: biz || null
            };
        });

        res.status(200).json({ success: true, data: userList });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getWaitlistEntries = async (req, res) => {
    try {
        const entries = await Waitlist.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteWaitlistEntry = async (req, res) => {
    try {
        const { id } = req.params;
        await Waitlist.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Entry removed from waitlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Find business associated with user
        const business = await BusinessProfile.findOne({ ownerId: id });
        
        if (business) {
            // 2. Cascade delete all related platform data
            await Sale.deleteMany({ businessId: business._id });
            await ActivityLog.deleteMany({ businessId: business._id });
            await Notification.deleteMany({ businessId: business._id });
            await SupportTicket.deleteMany({ businessId: business._id });
            
            // 3. Delete the business profile
            await BusinessProfile.findByIdAndDelete(business._id);
        }

        // 4. Delete the user (this covers users who might not have completed onboarding yet)
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "User and all associated data purged successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCoupons = async (req, res) => {
    try {
        const Coupon = require("../../models/Coupon");
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const Coupon = require("../../models/Coupon");
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('businessId', 'displayName')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
