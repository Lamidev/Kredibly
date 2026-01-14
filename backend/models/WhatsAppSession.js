const mongoose = require("mongoose");

const WhatsAppSessionSchema = new mongoose.Schema({
    whatsappNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String, // e.g., 'payment_disambiguation', 'rename_disambiguation', 'due_date_disambiguation'
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '5m' } // TTL index: auto-delete after 5 minutes
    }
}, { timestamps: true });

module.exports = mongoose.model("WhatsAppSession", WhatsAppSessionSchema);
