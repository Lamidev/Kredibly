const mongoose = require("mongoose");

const BusinessProfileSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: [true, "Display name is required (name shown on invoices)"],
        trim: true
    },
    entityType: {
        type: String,
        enum: ["individual", "business"],
        default: "individual"
    },
    sellMode: {
        type: String,
        enum: ["product", "service", "both"],
        default: "both"
    },
    logoUrl: {
        type: String,
        default: ""
    },
    phoneNumber: String,
    address: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("BusinessProfile", BusinessProfileSchema);
