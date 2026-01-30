const mongoose = require("mongoose");

const PlatformStatsSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD for easy daily grouping
        required: true,
        unique: true
    },
    whatsappMessagesSent: {
        type: Number,
        default: 0
    },
    whatsappEstimatedCost: {
        type: Number, // In NGN or USD, depending on business preference
        default: 0
    },
    aiCallsMade: {
        type: Number,
        default: 0
    },
    aiEstimatedCost: {
        type: Number,
        default: 0
    },
    revenueProcessed: {
        type: Number,
        default: 0
    },
    activeUsersCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("PlatformStats", PlatformStatsSchema);
