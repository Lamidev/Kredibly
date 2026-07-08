const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["confirmation", "debt_reminder", "system", "sale", "payment"],
        default: "system"
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale"
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // Auto-delete after 7 days to keep it clean
    }
});

// 🔌 Real-time sync: Notify dashboard when a new notification/alert is created
NotificationSchema.post("save", function(doc) {
    try {
        const { getIO } = require("../utils/socket");
        const io = getIO();
        if (io && doc.businessId) {
            io.to(doc.businessId.toString().toLowerCase()).emit("notification_created", doc);
        }
    } catch (err) {
        console.error("Error in Notification post-save socket sync:", err);
    }
});

module.exports = mongoose.model("Notification", NotificationSchema);
