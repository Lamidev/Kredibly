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
        trim: true,
        index: true
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
        trim: true,
        index: true
    },
    staffNumbers: [{
        type: String,
        trim: true
    }],
    assistantSettings: {
        enableReminders: { type: Boolean, default: true },
        reminderFrequency: { type: String, default: "daily" },
        reminderTemplate: { type: String, enum: ["friendly", "formal"], default: "friendly" },
        preferredName: { type: String, default: "" } // What Kreddy calls the merchant (e.g. "Tunde", "Boss", "The Chairman")
    },
    bankDetails: {
        bankName: { type: String, default: "" },
        bankCode: { type: String, default: "" }, 
        accountNumber: { type: String, default: "" },
        accountName: { type: String, default: "" },
        bankDetailsLockUntil: { type: Date, default: null }, // Security lock after change
        lastBankChangeAt: { type: Date, default: null }
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
        enum: ["trialing", "active", "past_due", "cancelled", "inactive"],
        default: "inactive"
    },
    hasUsedTrial: {
        type: Boolean,
        default: false
    },
    isLaunchPromo: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    trialExpiresAt: {
        type: Date
    },
    nextBillingDate: {
        type: Date
    },
    lastPaidAt: {
        type: Date
    },
    // Usage Tracking (Resets monthly)
    monthlyUsage: {
        reminders: { type: Number, default: 0 },
        voiceNotes: { type: Number, default: 0 },
        images: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now }
    },
    isSuccessBased: {
        type: Boolean,
        default: false // Whether they pay a commission on recovered debt
    },
    // Beta Test / Waitlist Demo Tracking
    isBetaTester: {
        type: Boolean,
        default: false
    },
    demoMessagesUsed: {
        type: Number,
        default: 0
    },
    successFeePercentage: {
        type: Number,
        default: 5 
    },
    isCompromised: {
        type: Boolean,
        default: false // Set to true if merchant reports a hack (stops all auto-releases)
    },
    prefersGatewayFeeAbsorption: {
        type: Boolean,
        default: true // Default: Merchant covers the Paystack/Gateway fees
    },
    lastSummaryAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// High-speed index for daily Billing & Expiry Check crons
BusinessProfileSchema.index({ plan: 1, planStatus: 1 });

module.exports = mongoose.model("BusinessProfile", BusinessProfileSchema);
