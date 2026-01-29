const mongoose = require("mongoose");

const BusinessProfileSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: [true, "Display name is required (name shown on invoices)"],
        trim: true
    },
    entityType: {
        type: String,
        enum: ["individual", "business"],
        default: "individual"
    },
    sellMode: {
        type: String,
        enum: ["product", "service", "both", "offline", "online"],
        default: "both"
    },
    logoUrl: {
        type: String,
        default: ""
    },
    phoneNumber: String,
    whatsappNumber: {
        type: String,
        trim: true
    },
    staffNumbers: [{
        type: String,
        trim: true
    }],
    assistantSettings: {
        enableReminders: { type: Boolean, default: true },
        reminderFrequency: { type: String, default: "daily" }
    },
    bankDetails: {
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        accountName: { type: String, default: "" }
    },
    address: String,
    isKreddyConnected: {
        type: Boolean,
        default: false
    },
    paystackSubaccountCode: {
        type: String,
        default: ""
    },
    onboardingStep: {
        type: Number,
        default: 0
    },
    // Subscription & Plan Tracking
    plan: {
        type: String,
        enum: ["hustler", "oga", "chairman"],
        default: "hustler"
    },
    isFoundingMember: {
        type: Boolean,
        default: false
    },
    planStatus: {
        type: String,
        enum: ["trialing", "active", "past_due", "cancelled"],
        default: "trialing"
    },
    trialExpiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
    },
    discountActiveUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("BusinessProfile", BusinessProfileSchema);
