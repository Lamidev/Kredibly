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
        required: false
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

ActivityLogSchema.post('save', function(doc) {
    try {
        const { getIO } = require("../utils/socket");
        const io = getIO();
        if (io) {
            // Send to Merchant Room
            if (doc.businessId) {
                io.to(doc.businessId.toString()).emit("activity_updated", doc);
            }
            // Send to Admin (Mission Control)
            io.emit("admin_activity_updated", doc);
        }
    } catch (err) {
        console.error("Socket Activity Emit Error:", err);
    }
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
