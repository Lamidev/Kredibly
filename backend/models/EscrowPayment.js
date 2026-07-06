const mongoose = require("mongoose");

const EscrowPaymentSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "released", "frozen", "failed", "bank_error"],
        default: "pending"
    },
    releaseDate: {
        type: Date,
        required: true // Usually set to the current bankDetailsLockUntil
    },
    transferReference: {
        type: String, // The Paystack transfer reference once released
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for the Escrow Payout Worker (runs hourly)
EscrowPaymentSchema.index({ status: 1, releaseDate: 1 });

module.exports = mongoose.model("EscrowPayment", EscrowPaymentSchema);
