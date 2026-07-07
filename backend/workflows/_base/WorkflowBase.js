/**
 * WorkflowBase — V2 Workflow State Engine
 *
 * Abstract base class for all workflow handlers.
 * Provides shared utilities (amount parsing, phone parsing, text extraction)
 * and enforces the handle() interface.
 *
 * Every workflow handler MUST extend this class and implement handle().
 *
 * Example:
 *   class InvoiceWorkflow extends WorkflowBase {
 *     async handle(step, message, state, profile, opts) { ... }
 *   }
 */

const MessageDispatcher = require("../../conversation/MessageDispatcher");
const WorkflowEventBus = require("../../conversation/WorkflowEventBus");

class WorkflowBase {
    /**
     * @param {Object} manifest - The validated manifest for this workflow
     */
    constructor(manifest) {
        if (!manifest || !manifest.id) {
            throw new Error("[WorkflowBase] A valid manifest is required.");
        }
        this.manifest = manifest;
        this.workflowId = manifest.id;
    }

    // ── Abstract Interface ────────────────────────────────────────────────────

    /**
     * Handle an inbound message for a given step.
     * MUST be implemented by every concrete workflow class.
     *
     * @param {string} step       - The current workflow step identifier
     * @param {Object} message    - Raw WhatsApp message object
     * @param {Object} state      - ConversationContext document (mutable)
     * @param {Object} profile    - BusinessProfile document
     * @param {Object} opts       - Additional context: { from, cleanFrom, text, msgType, bossTitle, isStaff }
     *
     * @returns {boolean} true if message was handled, false to fall through to AI
     */
    async handle(step, message, state, profile, opts) {
        throw new Error(`[WorkflowBase] ${this.constructor.name}.handle() is not implemented.`);
    }

    // ── Lifecycle Helpers ─────────────────────────────────────────────────────

    /**
     * Advance the workflow to a new step and persist.
     */
    async advanceTo(state, step, extraData = {}) {
        state.advanceTo(step, extraData);
        await state.save();
    }

    /**
     * Mark the workflow as completed and return to free conversation.
     */
    async complete(state) {
        const snapshot = { ...(state.data || {}) };
        const workflowType = state.workflowId || this.workflowId;
        const businessId = state.businessId;

        state.completeWorkflow();
        await state.save();

        // Publish event so subscribers can snapshot draft data
        WorkflowEventBus.publish("WorkflowCompleted", {
            businessId,
            workflowType,
            draftData: snapshot
        });
    }

    /**
     * Cancel the workflow with a reason and return to free conversation.
     */
    async cancel(state, reason = "merchant_cancelled") {
        const snapshot = { ...(state.data || {}) };
        const workflowType = state.workflowId || this.workflowId;
        const businessId = state.businessId;

        state.cancelWorkflow(reason);
        await state.save();

        // Publish event so subscribers can snapshot draft data
        WorkflowEventBus.publish("WorkflowCancelled", {
            businessId,
            workflowType,
            draftData: snapshot
        });
    }

    // ── Message Helpers ───────────────────────────────────────────────────────

    /**
     * Send a plain text reply.
     */
    async reply(to, text) {
        return await MessageDispatcher.send(to, text);
    }

    /**
     * Send an interactive button message.
     */
    async replyWithButtons(to, header, body, footer, buttons) {
        return await MessageDispatcher.sendButtons(to, header, body, footer, buttons);
    }

    /**
     * Re-prompt the merchant within the current step (does not change step).
     */
    async reprompt(to, text) {
        return await MessageDispatcher.send(to, text);
    }

    // ── Parsing Helpers ───────────────────────────────────────────────────────

    /**
     * Extract normalized text from an inbound message.
     * Handles: text messages, button reply text, interactive button IDs.
     */
    getText(message, opts = {}) {
        return (
            opts.text ||
            message?.text?.body ||
            message?.button?.text ||
            message?.interactive?.button_reply?.title ||
            message?.interactive?.list_reply?.title ||
            ""
        ).trim();
    }

    /**
     * Extract a button/list reply ID from an interactive message.
     */
    getButtonId(message) {
        return (
            message?.interactive?.button_reply?.id ||
            message?.interactive?.list_reply?.id ||
            message?.button?.payload ||
            ""
        ).trim();
    }

    /**
     * Parse a currency amount from merchant text.
     * Supports: "15k", "200,000", "2m", "150000", "1.5k"
     *
     * @param {string} text
     * @returns {number|null} parsed integer amount, or null if unparseable
     */
    parseAmount(text) {
        if (!text) return null;
        const s = String(text).toLowerCase().replace(/,/g, "").replace(/₦/g, "").trim();
        const match = s.match(/^([\d.]+)\s*(k|m|million|thousand)?$/);
        if (!match) return null;
        let val = parseFloat(match[1]);
        if (isNaN(val)) return null;
        const suffix = match[2] || "";
        if (suffix === "k" || suffix === "thousand") val *= 1000;
        else if (suffix === "m" || suffix === "million") val *= 1_000_000;
        return Math.round(val);
    }

    /**
     * Parse a Nigerian phone number from free text.
     * Handles: "08012345678", "+2348012345678", spoken digits, etc.
     *
     * @param {string} text
     * @returns {string|null} normalized E.164 number (no +), or null
     */
    parsePhone(text) {
        if (!text) return null;
        const digits = String(text).replace(/\D/g, "");
        if (digits.length < 10) return null;
        let phone = digits;
        if (phone.startsWith("0") && phone.length === 11) phone = "234" + phone.slice(1);
        return phone;
    }

    /**
     * Check if text is a confirmation (yes / y / confirm / correct / sure / etc.)
     */
    isConfirmation(text) {
        const lower = String(text || "").toLowerCase().trim();
        return ["yes", "y", "confirm", "correct", "true", "sure", "do it",
                "go ahead", "sharp", "send invoice", "invoice_yes"].includes(lower);
    }

    /**
     * Check if text is a rejection (no / n / wrong / stop / cancel / etc.)
     */
    isRejection(text) {
        const lower = String(text || "").toLowerCase().trim();
        return ["no", "n", "wrong", "stop", "cancel", "reject", "invoice_no"].includes(lower);
    }
}

module.exports = WorkflowBase;
