const mongoose = require("mongoose");

const WhatsAppSessionSchema = new mongoose.Schema({
    whatsappNumber: {
        type: String,
        required: true
    },
    type: {
        type: String, // e.g., 'customer_active_window', 'payment_disambiguation', 'collect_partial_payment_amount'
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '0s' } // TTL index: auto-delete at expiresAt
    }
}, { timestamps: true });

// Compound unique index: one session per phone+type combination
WhatsAppSessionSchema.index({ whatsappNumber: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("WhatsAppSession", WhatsAppSessionSchema);
