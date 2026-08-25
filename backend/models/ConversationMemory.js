const mongoose = require("mongoose");

const ConversationMemorySchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, unique: true },

    // Cached customers mapping name -> phone number
    customers: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        frequency: { type: Number, default: 1 },
        lastInteractionAt: { type: Date, default: Date.now },
        introducedToKredibly: { type: Boolean, default: false },
        introducedAt: { type: Date }
    }],

    // Frequently sold products mapping name -> price and count
    products: [{
        name: { type: String, required: true },
        defaultPrice: { type: Number },
        frequency: { type: Number, default: 1 }
    }],

    // Relationship memory (client payment habits, risk, notes)
    relationshipMemory: [{
        customerPhone: { type: String, required: true },
        customerName: { type: String },
        timelinessTag: { type: String, enum: ["prompt", "late", "unknown"], default: "unknown" },
        avgDaysToPay: { type: Number, default: 0 },
        totalInvoicesPaid: { type: Number, default: 0 },
        notes: { type: String }
    }],

    // Habitual merchant metrics
    habitualMetrics: {
        usualLogHour: { type: Number }, // e.g. 18 for 6pm
        peakLogDay: { type: Number }     // 0-6 (Sunday-Saturday)
    },

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

// Token/Word-based customer search with exact score & ambiguity detection
ConversationMemorySchema.methods.findMatchingCustomers = function(nameQuery) {
    if (!nameQuery) return [];
    const queryTokens = nameQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryTokens.length === 0) return [];

    const matches = [];

    for (const cust of (this.customers || [])) {
        if (!cust.name) continue;
        const custNameLower = cust.name.toLowerCase().trim();
        const custTokens = custNameLower.split(/\s+/).filter(Boolean);

        // 1. Exact string match (case-insensitive)
        if (custNameLower === nameQuery.toLowerCase().trim()) {
            matches.push({ customer: cust, score: 100, exact: true });
            continue;
        }

        // 2. All query words exist in customer name (e.g. "Akinyemi Victoria" vs "Victoria Akinyemi")
        const allTokensPresent = queryTokens.every(qToken => 
            custTokens.some(cToken => cToken.includes(qToken) || qToken.includes(cToken))
        );

        if (allTokensPresent) {
            // Full flipped token match vs partial words
            const score = custTokens.length === queryTokens.length ? 95 : 85;
            matches.push({ customer: cust, score, exact: false });
            continue;
        }

        // 3. Single-token exact match (e.g. query is "Victoria" and cust is "Victoria Akinyemi")
        const someTokensPresent = queryTokens.some(qToken =>
            custTokens.some(cToken => cToken === qToken)
        );

        if (someTokensPresent) {
            matches.push({ customer: cust, score: 60, exact: false });
        }
    }

    // Sort by highest score descending, then by lastInteraction descending
    return matches.sort((a, b) => b.score - a.score || new Date(b.customer.lastInteraction || 0) - new Date(a.customer.lastInteraction || 0));
};

// Case-insensitive customer query pattern finder (highest scoring match)
ConversationMemorySchema.methods.findCustomer = function(nameQuery) {
    const matches = this.findMatchingCustomers(nameQuery);
    if (matches.length === 0) return null;
    return matches[0].customer;
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
