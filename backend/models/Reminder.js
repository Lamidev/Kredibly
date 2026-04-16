const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true
    },
    whatsappNumber: {
        type: String,
        required: true
    },
    description: {
        type: String, // E.g., "call the logistics guy"
        required: true
    },
    type: {
        type: String,
        enum: ["debt", "task", "meeting", "personal"],
        default: "debt",
        index: true
    },
    triggerDate: {
        type: Date,
        required: true,
        index: true
    },
    recurrence: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly"],
        default: "none"
    },
    snoozeCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["pending", "delivered", "snoozed", "cancelled"],
        default: "pending",
        index: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: false
    },
    deliveredAt: {
        type: Date,
        index: { expires: '14d' } // Extended to 14 days for better tracking
    },
    error: {
        type: String, // Store failure reason
        default: null
    },
    isHeadsUpSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// High-speed lookup for the per-minute Reminders Worker
ReminderSchema.index({ status: 1, triggerDate: 1 });

module.exports = mongoose.model("Reminder", ReminderSchema);
