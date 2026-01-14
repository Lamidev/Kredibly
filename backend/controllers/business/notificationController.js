const Notification = require("../../models/Notification");
const BusinessProfile = require("../../models/BusinessProfile");

// Get all notifications for the business
exports.getNotifications = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        const notifications = await Notification.find({ businessId: business._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Dismiss/Delete notification
exports.dismissNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Clear all notifications for the business
exports.clearAllNotifications = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business profile not found" });

        await Notification.deleteMany({ businessId: business._id });
        res.status(200).json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
