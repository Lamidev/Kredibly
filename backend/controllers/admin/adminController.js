const User = require("../../models/User");
const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");

exports.getGlobalStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user', isVerified: true });
        const totalBusinesses = await BusinessProfile.countDocuments();
        const totalSalesCount = await Sale.countDocuments();

        // Aggregate total revenue across all sales
        const sales = await Sale.find({});
        let totalRevenue = 0;
        let totalOutstanding = 0;

        sales.forEach(s => {
            const paid = (s.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            totalRevenue += paid;
            totalOutstanding += Math.max(0, (s.totalAmount || 0) - paid);
        });

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
                totalRevenue,
                totalOutstanding
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
