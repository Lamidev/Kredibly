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
    accountName: {
        type: String,
        default: ""
    },
    bankName: {
        type: String,
        default: "GTBank"
    },
    provider: {
        type: String,
        enum: ["monnify", "paystack", "squad"],
        default: "squad"
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
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24-hour expiry for Squad DVA
    },
    status: {
        type: String,
        enum: ["active", "used", "expired"],
        default: "active"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL Index: MongoDB auto-removes expired VA records
VirtualAccountSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Lookup index for webhook matching
VirtualAccountSchema.index({ invoiceNumber: 1 });
VirtualAccountSchema.index({ saleId: 1, status: 1 });

module.exports = mongoose.model("VirtualAccount", VirtualAccountSchema);
