const mongoose = require("mongoose");

const BackgroundJobSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["MORNING_SUMMARY", "REMINDER_CLEANUP", "BATCH_EMAIL", "ESCROW_PAYOUT", "DEBT_NUDGE", "TRIAL_EXPIRY"] 
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: false,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "processing", "completed", "failed"],
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    error: {
        type: String,
        required: false
    },
    scheduledFor: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

// Compound index for efficient batching of pending jobs
BackgroundJobSchema.index({ status: 1, scheduledFor: 1, type: 1 });

module.exports = mongoose.model("BackgroundJob", BackgroundJobSchema);
