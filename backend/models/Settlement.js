const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        index: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    bankDetails: {
        accountNumber: String,
        bankCode: String,
        accountName: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastError: {
        type: String
    },
    nombaReference: {
        type: String
    },
    scheduledFor: {
        type: Date,
        default: () => new Date(Date.now() + 20000) // Default 20s delay
    }
}, { timestamps: true });

// Ensure we don't double-settle the same sale
settlementSchema.index({ saleId: 1 }, { unique: true });

module.exports = mongoose.model('Settlement', settlementSchema);
