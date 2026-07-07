/**
 * ConversationGateway — V2 Workflow State Engine
 *
 * Receives all inbound messages. Resolves ConversationContext.
 * Decides if we are in an active workflow (One Thought Rule) or free conversation.
 * Integrates backward-compatible routing for legacy sessions during transition.
 */

const ConversationContext = require("../models/ConversationContext");
const WorkflowQueue = require("./WorkflowQueue");
const WorkflowRouter = require("./WorkflowRouter");
const WhatsAppSession = require("../models/WhatsAppSession");

class ConversationGateway {
    /**
     * Entry point for all incoming messages.
     *
     * @param {Object} message - Raw message object from WhatsApp webhook
     * @param {Object} profile - BusinessProfile document
     * @param {Object} opts    - Additional details: { from, cleanFrom, text, msgType, bossTitle, isStaff }
     * @returns {Promise<boolean>} - True if message was intercepted and handled by Gateway/WorkflowRouter
     */
    static async receive(message, profile, opts) {
        const cleanFrom = opts.cleanFrom;

        // 1. Load or initialize ConversationContext for user
        let context = await ConversationContext.findOne({ whatsappNumber: cleanFrom });
        if (!context) {
            context = new ConversationContext({
                whatsappNumber: cleanFrom,
                businessId: profile ? profile._id : undefined,
                mode: "free_conversation"
            });
            await context.save();
        }

        // Add to transient message memory
        if (opts.text) {
            context.remember("merchant", opts.text);
            await context.save();
        }

        // 2. Backward compatibility bridge: Check if there's a legacy WhatsAppSession active.
        // If a legacy session exists and context is not active, we bridge it.
        const legacySession = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });
        if (legacySession && context.mode === "free_conversation") {
            // Let the controller handle it directly using legacy code
            return false;
        }

        // 3. Apply the One Thought Rule: check if there's an active workflow context owning the conversation
        const activeContext = await WorkflowQueue.getActiveContext(cleanFrom);
        if (activeContext) {
            // Forward to the WorkflowRouter
            const handled = await WorkflowRouter.route(message, profile, activeContext, opts);
            if (handled) {
                return true;
            }
        }

        // 4. Default to false: fall through to AI Intent engine (free conversation)
        return false;
    }
}

module.exports = ConversationGateway;
