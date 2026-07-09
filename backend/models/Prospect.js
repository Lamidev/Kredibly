const mongoose = require("mongoose");

const ProspectSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    source: {
        type: String,
        default: "landing_page"
    },
    status: {
        type: String,
        enum: ["prospect", "promoted"],
        default: "prospect"
    },
    demoState: {
        type: String,
        enum: ["welcome", "demo_running", "demo_completed", "waiting_for_signup", "nurture"],
        default: "welcome"
    },
    demoCompleted: {
        type: Boolean,
        default: false
    },
    demoCompletedAt: {
        type: Date,
        default: null
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    entrySource: {
        type: String,
        default: "landing_page"
    },
    landingCampaign: {
        type: String,
        default: null
    },
    demoVersion: {
        type: String,
        default: "v2"
    },
    firstSeen: {
        type: Date,
        default: Date.now
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    interactionCount: {
        type: Number,
        default: 0
    },
    promotedAt: {
        type: Date,
        default: null
    },
    promotedToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        default: null
    },
    registeredAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Prospect", ProspectSchema);
