const mongoose = require("mongoose");

const VirtualAccountSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true,
        index: true
    },
    bankName: {
        type: String,
        default: "Wema Bank" // Common for Monnify/Paystack
    },
    provider: {
        type: String,
        enum: ["monnify", "paystack", "squad", "nomba"],
        default: "nomba"
    },
    reference: {
        type: String,
        unique: true,
        required: true
    },
    accountName: {
        type: String
    },
    amount: {
        type: Number,
        required: true // This is the total the customer pays (includes fees if passed)
    },
    baseAmount: {
        type: Number // This is the original debt amount the merchant receives
    },
    status: {
        type: String,
        enum: ["active", "used", "expired"],
        default: "active"
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 45 * 60 * 1000) // 45 mins expiry (Nomba minimum requirement)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL Index for expired accounts
VirtualAccountSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VirtualAccount", VirtualAccountSchema);
