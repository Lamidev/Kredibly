/**
 * ConversationMemoryManager — V3 Conversational Operating System
 *
 * Exposes methods to query and update the merchant's recent conversation references.
 * Resolves temporal queries and manages draft state recovery.
 */

const ConversationMemory = require("../models/ConversationMemory");
const WorkflowQueue = require("./WorkflowQueue");
const WorkflowRegistry = require("./WorkflowRegistry");
const ResponseBuilder = require("./ResponseBuilder");

class ConversationMemoryManager {
    /**
     * Cache the latest state data of a workflow draft.
     */
    static async saveDraft(businessId, workflowType, status, draftData) {
        if (!businessId) return null;
        try {
            let memory = await ConversationMemory.findOne({ businessId });
            if (!memory) memory = new ConversationMemory({ businessId });

            memory.saveLastDraft(workflowType, status, draftData);
            await memory.save();
            return memory.lastDraft;
        } catch (err) {
            console.error("🚨 [MemoryManager] saveDraft Error:", err.message);
            return null;
        }
    }

    /**
     * Retrieve the most recent draft (if within the 60-minute window).
     */
    static async getRecentDraft(businessId) {
        if (!businessId) return null;
        try {
            const memory = await ConversationMemory.findOne({ businessId });
            return memory ? memory.getRecentDraft() : null;
        } catch (err) {
            console.error("🚨 [MemoryManager] getRecentDraft Error:", err.message);
            return null;
        }
    }

    /**
     * Clear the cached draft state.
     */
    static async clearDraft(businessId) {
        if (!businessId) return null;
        try {
            const memory = await ConversationMemory.findOne({ businessId });
            if (memory) {
                memory.lastDraft = undefined;
                await memory.save();
            }
        } catch (err) {
            console.error("🚨 [MemoryManager] clearDraft Error:", err.message);
        }
    }

    /**
     * Resume a workflow draft from ConversationMemory.
     * Re-hydrates the workflow parameters and enqueues a new workflow session.
     *
     * @param {string} from       - Merchant phone number
     * @param {Object} profile    - BusinessProfile document
     * @param {Object} context    - Active ConversationContext document
     * @returns {Promise<boolean>} - True if draft was successfully resumed, false otherwise
     */
    static async resumeDraftWorkflow(from, profile, context) {
        try {
            console.log(`🧠 [MemoryManager] resumeDraftWorkflow profile ID: ${profile._id}`);
            const memory = await ConversationMemory.findOne({ businessId: profile._id });
            console.log(`🧠 [MemoryManager] Found memory document? ${!!memory}`);
            const recentDraft = memory ? memory.getRecentDraft() : null;
            console.log(`🧠 [MemoryManager] getRecentDraft result:`, recentDraft ? { status: recentDraft.status, savedAt: recentDraft.savedAt } : "null");

            if (!recentDraft || !recentDraft.data) {
                console.log(`🧠 [MemoryManager] No fresh draft data found. Sending fallback.`);
                await ResponseBuilder.sendText(from, "I couldn't find any recent draft to continue. What would you like to create? 🚀");
                return false;
            }

            const workflowType = recentDraft.workflowType || "invoice_creation";
            const draftData = recentDraft.data;

            // Re-enqueue the workflow starting directly at the confirmation phase
            const workflowState = await WorkflowQueue.enqueue(
                context.whatsappNumber,
                profile._id,
                workflowType,
                "awaiting_confirmation",
                "HIGH",
                draftData,
                20 // 20 minutes timeout
            );

            // Fetch workflow class to display summary
            const handler = WorkflowRegistry.getHandler(workflowType);
            console.log(`🧠 [MemoryManager] Workflow Registry handler for "${workflowType}"? ${!!handler}`);
            if (handler) {
                await handler.proceedToInvoiceSummary(from, context.whatsappNumber, profile, false, draftData, workflowState);
                console.log(`🧠 [MemoryManager] Resumed cancelled draft workflow "${workflowType}" for ${from}`);
                return true;
            }

            return false;
        } catch (err) {
            console.error("🚨 [MemoryManager] resumeDraftWorkflow Error:", err.message);
            return false;
        }
    }
}

module.exports = ConversationMemoryManager;
