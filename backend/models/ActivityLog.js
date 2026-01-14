const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: false,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true
    },
    action: {
        type: String,
        required: true
    },
    entityType: {
        type: String, // 'SALE', 'PAYMENT', 'PROFILE', 'WHATSAPP', 'USER'
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    details: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
