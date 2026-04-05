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
        enum: ["monnify", "paystack"],
        default: "monnify"
    },
    reference: {
        type: String,
        unique: true,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "used", "expired"],
        default: "active"
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL Index for expired accounts
VirtualAccountSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VirtualAccount", VirtualAccountSchema);
