const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true
    },
    whatsappNumber: {
        type: String,
        required: true
    },
    message: {
        type: String, // The actual suggestion or idea
        required: true
    },
    category: {
        type: String, // AI, UI, Features, Payments, etc.
        default: "General"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    status: {
        type: String,
        enum: ["under_review", "planned", "in_progress", "implemented", "maybe_later"],
        default: "under_review"
    },
    devNotes: {
        type: String,
        default: ""
    },
    upvotes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexing for faster super-admin roadmap lookups
FeedbackSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
