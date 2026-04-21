const mongoose = require("mongoose");

const customerAliasSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true,
        index: true
    },
    sourceName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    targetName: {
        type: String,
        required: true,
        trim: true
    },
    confidence: {
        type: Number,
        default: 1.0
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique alias per business
customerAliasSchema.index({ businessId: 1, sourceName: 1 }, { unique: true });

module.exports = mongoose.models.CustomerAlias || mongoose.model("CustomerAlias", customerAliasSchema);
