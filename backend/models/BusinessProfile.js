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
        enum: ["product", "service", "both"],
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("BusinessProfile", BusinessProfileSchema);
