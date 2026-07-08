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
        enum: ["pending", "processing", "delivered", "snoozed", "cancelled", "failed"],
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
    },
    // Kreddy AI: Distinguish merchant reminders from customer payment reminders
    recipientType: {
        type: String,
        enum: ["merchant", "customer"],
        default: "merchant"
    },
    // For customer reminders: their phone number (whatsappNumber stores merchant number)
    recipientPhone: {
        type: String
    },
    // Reminder sequence number (1=first, 2=second, etc.) for customer reminders
    reminderSequence: {
        type: Number,
        default: 1
    },
    // Task priority (inferred by Kreddy from task description)
    priority: {
        type: String,
        enum: ["high", "normal", "low"],
        default: "normal"
    },
    // Abandoned-task follow-up: was the single 4h follow-up already sent?
    followUpSent: {
        type: Boolean,
        default: false
    },
    // When the abandoned follow-up was sent
    followUpAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// High-speed lookup for the per-minute Reminders Worker
ReminderSchema.index({ status: 1, triggerDate: 1 });

// 🔌 Real-time sync: Notify dashboard on any reminder updates (Mark Done, Snooze, etc.)
ReminderSchema.post("save", function(doc) {
    try {
        const { getIO } = require("../utils/socket");
        const io = getIO();
        if (io && doc.businessId) {
            io.to(doc.businessId.toString().toLowerCase()).emit("task_updated", {
                action: "save",
                data: doc
            });
        }
    } catch (err) {
        console.error("Error in Reminder post-save socket sync:", err);
    }
});

// 🔌 Real-time sync: Notify dashboard when a reminder is deleted or completed
ReminderSchema.post("findOneAndDelete", function(doc) {
    if (doc) {
        try {
            const { getIO } = require("../utils/socket");
            const io = getIO();
            if (io && doc.businessId) {
                io.to(doc.businessId.toString().toLowerCase()).emit("task_updated", {
                    action: "delete",
                    data: doc
                });
            }
        } catch (err) {
            console.error("Error in Reminder post-delete socket sync:", err);
        }
    }
});

module.exports = mongoose.model("Reminder", ReminderSchema);
