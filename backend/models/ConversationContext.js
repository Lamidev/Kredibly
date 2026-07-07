/**
 * ConversationContext — V2 Workflow State Engine
 *
 * Replaces WhatsAppSession as the persistent state store for every
 * merchant/customer conversation. Stores what workflow is active,
 * what step we're on, and what data has been collected.
 *
 * Unlike WhatsAppSession (5-min flat TTL), ConversationContext has:
 *   - Per-workflow timeout via a configurable timeoutAt field
 *   - Priority-aware mode (free_conversation vs active_workflow)
 *   - Conversation memory for AI context
 *   - Analytics counters
 */

const mongoose = require("mongoose");

const ConversationContextSchema = new mongoose.Schema({

    // ── Identity ─────────────────────────────────────────────────────────────
    whatsappNumber:  { type: String, required: true, unique: true, index: true },
    businessId:      { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile" },

    // ── Workflow State ────────────────────────────────────────────────────────
    mode: {
        type: String,
        enum: ["free_conversation", "active_workflow"],
        default: "free_conversation"
    },
    workflowId:       { type: String, default: null },      // e.g. "invoice_creation"
    workflowCategory: { type: String, default: null },      // e.g. "invoice"
    step:             { type: String, default: null },      // e.g. "awaiting_customer_phone"
    owner: {
        type: String,
        enum: ["merchant", "customer", "system"],
        default: "merchant"
    },
    priority: {
        type: String,
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
        default: "MEDIUM"
    },

    // ── Workflow Payload ──────────────────────────────────────────────────────
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── The Queue: pending workflows waiting for their turn ─────────────────
    queue: [{
        workflowId:       { type: String, required: true },
        workflowCategory: { type: String },
        step:             { type: String },
        priority:         { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
        data:             { type: mongoose.Schema.Types.Mixed },
        startedAt:        { type: Date, default: Date.now },
        timeoutAt:        { type: Date }
    }],

    // ── Conversation Memory (last 10 exchanges for AI context) ───────────────
    memory: [{
        role:    { type: String, enum: ["merchant", "kreddy", "system"] },
        content: { type: String },
        at:      { type: Date, default: Date.now }
    }],

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    startedAt:          { type: Date },
    timeoutAt:          { type: Date },   // Per-workflow TTL (indexed below)
    status: {
        type: String,
        enum: ["active", "completed", "cancelled", "timedout"],
        default: "active"
    },
    completedAt:        { type: Date },
    cancellationReason: { type: String },

    // ── Analytics ─────────────────────────────────────────────────────────────
    workflowsCompleted: { type: Number, default: 0 },
    workflowsCancelled: { type: Number, default: 0 },
    lastCompletedAt:    { type: Date },

    // ── Backward-compat bridge (removed after full migration) ─────────────────
    _legacySessionType: { type: String, default: null }

}, { timestamps: true });

// TTL index: MongoDB auto-deletes documents when timeoutAt is reached
ConversationContextSchema.index({ timeoutAt: 1 }, { expireAfterSeconds: 0 });

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Enter a new workflow. Sets mode to active_workflow with all required fields.
 */
ConversationContextSchema.methods.enterWorkflow = function (workflowId, category, step, priority, data, timeoutMinutes) {
    this.mode = "active_workflow";
    this.workflowId = workflowId;
    this.workflowCategory = category;
    this.step = step;
    this.priority = priority || "MEDIUM";
    this.data = data || {};
    this.status = "active";
    this.startedAt = new Date();
    if (timeoutMinutes) {
        this.timeoutAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    } else {
        this.timeoutAt = null;
    }
};

/**
 * Advance to the next step, merging extra data into the payload.
 */
ConversationContextSchema.methods.advanceTo = function (step, extraData = {}) {
    this.step = step;
    if (extraData && Object.keys(extraData).length > 0) {
        this.data = { ...(this.data || {}), ...extraData };
    }
};

/**
/**
 * Mark the workflow as successfully completed. Pops the next waiting workflow if any, or returns to free conversation.
 */
ConversationContextSchema.methods.completeWorkflow = function () {
    this.workflowsCompleted = (this.workflowsCompleted || 0) + 1;
    this.lastCompletedAt = new Date();
    this._popNextWorkflow("completed");
};

/**
 * Cancel the current workflow. Pops the next waiting workflow if any, or returns to free conversation.
 */
ConversationContextSchema.methods.cancelWorkflow = function (reason) {
    this.workflowsCancelled = (this.workflowsCancelled || 0) + 1;
    this.cancellationReason = reason || "merchant_cancelled";
    this._popNextWorkflow("cancelled");
};

/**
 * Helper to pop and activate the next workflow in the queue.
 * @private
 */
ConversationContextSchema.methods._popNextWorkflow = function (endStatus) {
    if (this.queue && this.queue.length > 0) {
        const PRIORITY_ORDER = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
        
        // Sort queue by priority descending, oldest first for tie breaking
        this.queue.sort((a, b) => {
            const prioA = PRIORITY_ORDER[a.priority] || 2;
            const prioB = PRIORITY_ORDER[b.priority] || 2;
            if (prioA !== prioB) {
                return prioB - prioA;
            }
            return new Date(a.startedAt) - new Date(b.startedAt);
        });

        const next = this.queue.shift(); // Remove first element
        
        this.mode = "active_workflow";
        this.workflowId = next.workflowId;
        this.workflowCategory = next.workflowCategory;
        this.step = next.step;
        this.priority = next.priority;
        this.data = next.data || {};
        this.startedAt = next.startedAt || new Date();
        this.timeoutAt = next.timeoutAt || null;
        this.status = "active";
    } else {
        this.mode = "free_conversation";
        this.workflowId = null;
        this.workflowCategory = null;
        this.step = null;
        this.priority = "MEDIUM";
        this.data = {};
        this.timeoutAt = null;
        this.status = endStatus;
    }
};

/**
 * Add a message to conversation memory (max 10 kept).
 */
ConversationContextSchema.methods.remember = function (role, content) {
    if (!this.memory) this.memory = [];
    this.memory.push({ role, content, at: new Date() });
    if (this.memory.length > 10) {
        this.memory = this.memory.slice(-10);
    }
};

/**
 * Returns true if this context has an active workflow.
 */
ConversationContextSchema.methods.isActive = function () {
    return this.mode === "active_workflow" && !!this.workflowId && this.status === "active";
};

module.exports = mongoose.model("ConversationContext", ConversationContextSchema);
