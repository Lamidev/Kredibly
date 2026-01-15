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
        enum: ["confirmation", "debt_reminder", "system", "sale"],
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

module.exports = mongoose.model("Notification", NotificationSchema);
