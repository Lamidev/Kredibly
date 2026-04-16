const mongoose = require("mongoose");

const SystemConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, 
    value: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    lastUpdated: { type: Date, default: Date.now },
    lastGenerated: { type: Date } // Tracking when Gemini last ran
});

module.exports = mongoose.model("SystemConfig", SystemConfigSchema);
