const mongoose = require("mongoose");

const ConversationMemorySchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, unique: true },

    // Cached customers mapping name -> phone number
    customers: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        frequency: { type: Number, default: 1 },
        lastInteractionAt: { type: Date, default: Date.now }
    }],

    // Frequently sold products mapping name -> price and count
    products: [{
        name: { type: String, required: true },
        defaultPrice: { type: Number },
        frequency: { type: Number, default: 1 }
    }],

    // Inferred preferences
    preferences: {
        defaultDueDateDays: { type: Number, default: 2 },
        reminderStyle: { type: String, enum: ["friendly", "strict", "casual"], default: "friendly" }
    },

    // ── Last Draft Memory (Priority 3 — Conversation Memory Manager) ─────────
    // Stores the most recent workflow draft snapshot for a merchant.
    // Enables temporal recall ("what amount did I enter?") and draft resumption.
    // Cleared when a new draft replaces it, or after 60 minutes of inactivity.
    lastDraft: {
        workflowType:  { type: String },             // e.g. "invoice_creation"
        status:        { type: String, enum: ["active", "cancelled", "completed"] },
        data:          { type: mongoose.Schema.Types.Mixed },  // full draft data snapshot
        savedAt:       { type: Date }                // when this draft was snapshotted
    }

}, { timestamps: true });

// Case-insensitive customer query pattern finder
ConversationMemorySchema.methods.findCustomer = function(nameQuery) {
    if (!nameQuery) return null;
    const query = nameQuery.toLowerCase().trim();
    return this.customers.find(c => c.name.toLowerCase().includes(query));
};

/**
 * Save a workflow draft snapshot to lastDraft.
 * Call this whenever a workflow is cancelled or completed.
 *
 * @param {string} workflowType - e.g. "invoice_creation"
 * @param {string} status       - "cancelled" | "completed"
 * @param {Object} data         - The workflow state.data at time of snapshot
 */
ConversationMemorySchema.methods.saveLastDraft = function(workflowType, status, data) {
    this.lastDraft = {
        workflowType,
        status,
        data: { ...data },
        savedAt: new Date()
    };
    this.markModified("lastDraft");
};

/**
 * Check if lastDraft is recent enough to be relevant (within 60 minutes).
 * @returns {Object|null} The draft data if fresh, null if stale or absent
 */
ConversationMemorySchema.methods.getRecentDraft = function() {
    if (!this.lastDraft || !this.lastDraft.savedAt) return null;
    const ageMs = Date.now() - new Date(this.lastDraft.savedAt).getTime();
    const sixtyMins = 60 * 60 * 1000;
    if (ageMs > sixtyMins) return null;
    return this.lastDraft;
};

module.exports = mongoose.model("ConversationMemory", ConversationMemorySchema);
