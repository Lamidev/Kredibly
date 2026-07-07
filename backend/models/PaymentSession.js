const mongoose = require("mongoose");

/**
 * PaymentSession — tracks a WhatsApp-native conversational payment attempt.
 * Each session wraps one Nomba DVA (45-min bank-side expiry) and lives for
 * up to 24 hours in the database. On webhook arrival the session is resolved.
 */
const PaymentSessionSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: true,
        index: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true,
        index: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    // Payment intent
    paymentType: {
        type: String,
        enum: ["full", "partial"],
        required: true
    },
    amountIntended: {
        // Net amount the customer intended to pay (invoice balance or partial amount)
        type: Number,
        required: true
    },
    amountExpected: {
        // DVA amount (may include gateway fee if merchant doesn't absorb)
        type: Number,
        required: true
    },

    // Nomba DVA details
    nombaReference:    { type: String, required: true, unique: true, index: true },
    nombaAccountNumber: { type: String },
    nombaBankName:      { type: String },
    nombaAccountName:   { type: String },
    nombaExpiresAt:     { type: Date },

    // Lifecycle
    status: {
        type: String,
        enum: ["pending", "paid", "expired", "cancelled"],
        default: "pending",
        index: true
    },
    resolvedAt:               { type: Date },
    actualAmountReceived:     { type: Number },
    nombaTransactionReference:{ type: String },

    // 24h session expiry — MongoDB TTL will purge after an additional 3 days
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// TTL: automatically delete sessions 3 days after their 24h expiry for DB hygiene
PaymentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3 * 24 * 60 * 60 });

module.exports = mongoose.model("PaymentSession", PaymentSessionSchema);
