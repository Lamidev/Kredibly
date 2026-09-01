/**
 * ConversationGateway — V2 Workflow State Engine
 *
 * Receives all inbound messages. Resolves ConversationContext.
 * Decides if we are in an active workflow (One Thought Rule) or free conversation.
 * Integrates backward-compatible routing for legacy sessions during transition.
 *
 * Priority 5: Pre-AI memory recall check.
 * If the merchant asks a temporal recall question ("what amount did I enter earlier?")
 * and a recent draft exists in ConversationMemory, we answer directly from memory.
 * The AI never sees these messages — no misclassification possible.
 */

const ConversationContext = require("../models/ConversationContext");
const WorkflowQueue = require("./WorkflowQueue");
const WorkflowRouter = require("./WorkflowRouter");
const WhatsAppSession = require("../models/WhatsAppSession");
const MessageDispatcher = require("./MessageDispatcher");

// Patterns that signal the merchant is recalling something from this session,
// NOT querying who owes money.
const RECALL_PATTERNS = [
    /what\s+(was|were|is)\s+the\s+(amount|price|total|number|deposit|figure)/i,
    /what\s+(amount|price|total|deposit|number|figure)\s+(did\s+i|i)\s+(enter|type|input|put|say|give)/i,
    /earlier\s+(i\s+was|before\s+i\s+was|when\s+i\s+was)\s+creating/i,
    /what\s+did\s+i\s+(enter|type|input|put|say)\s+(earlier|before|just\s+now)/i,
    /the\s+(amount|price|total|deposit)\s+i\s+(entered|typed|inputted|put|said)/i,
    /what\s+number\s+did\s+i\s+(type|enter|input|say)/i,
    /what\s+(was|is)\s+the\s+invoice\s+(amount|price|total)\s+i/i,
];

// Patterns that signal the merchant wants to resume/continue their last draft
const RESUME_PATTERNS = [
    /continue\s+(that|the|my)?\s*(invoice|draft|sale)/i,
    /resume\s+(that|the|my)?\s*(invoice|draft|sale)/i,
    /pick\s+up\s+where\s+we\s+left/i,
    /continue\s+where\s+we\s+(stopped|left)/i
];

/**
 * Detect if a message is a temporal recall query.
 * @param {string} text
 * @returns {boolean}
 */
const isRecallQuery = (text) => {
    if (!text) return false;
    return RECALL_PATTERNS.some(p => p.test(text));
};

/**
 * Detect if a message is a request to resume the last draft.
 * @param {string} text
 * @returns {boolean}
 */
const isResumeQuery = (text) => {
    if (!text) return false;
    return RESUME_PATTERNS.some(p => p.test(text));
};

/**
 * Build a human-readable summary of a lastDraft for the merchant.
 * @param {Object} lastDraft - ConversationMemory.lastDraft
 * @returns {string}
 */
const buildDraftRecallReply = (lastDraft) => {
    const d = lastDraft.data || {};
    const statusLabel = lastDraft.status === "cancelled" ? "cancelled" : "completed";
    const ago = Math.round((Date.now() - new Date(lastDraft.savedAt).getTime()) / 60000);
    const agoLabel = ago < 2 ? "just now" : `${ago} minute${ago !== 1 ? "s" : ""} ago`;

    const lines = [
        `Here's what I have from your ${statusLabel} invoice draft (${agoLabel}):`,
        ``
    ];

    if (d.customerName) lines.push(`Customer: *${d.customerName}*`);
    if (d.customerPhone) lines.push(`Phone: +${d.customerPhone}`);

    if (d.items && d.items.length > 0) {
        d.items.forEach((item, i) => {
            const total = (item.unitPrice || 0) * (item.quantity || 1);
            lines.push(`${i + 1}. ${item.name} × ${item.quantity || 1} — ₦${total.toLocaleString()}`);
        });
    } else if (d.item) {
        lines.push(`Item: ${d.item}`);
    }

    if (d.totalAmount) lines.push(`\nInvoice Amount: *₦${d.totalAmount.toLocaleString()}*`);
    if (d.paidAmount && d.paidAmount > 0) {
        lines.push(`Deposit: ₦${d.paidAmount.toLocaleString()}`);
        lines.push(`Balance Due: ₦${(d.totalAmount - d.paidAmount).toLocaleString()}`);
    }
    if (d.dueDate) {
        const due = new Date(d.dueDate).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
        lines.push(`Due Date: ${due}`);
    }

    return lines.join("\n");
};

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

        // 0. Resolve Conversation Identity Role
        const { isCustomerPhone } = require("../utils/customerInvoiceService");
        const isCustomer = await isCustomerPhone(cleanFrom);

        const lowerText = String(opts.text || "").toLowerCase().trim();
        const isDemoIntent = lowerText.includes("how kredibly works") || lowerText.includes("how kreddy works") || lowerText.includes("see how kredibly works") || lowerText.includes("see how kreddy works");

        // Check if user is in an active prospect demo session
        const Prospect = require("../models/Prospect");
        const prospect = await Prospect.findOne({ phoneNumber: cleanFrom });
        const buttonId = message?.interactive?.button_reply?.id || 
                         message?.interactive?.list_reply?.id || 
                         message?.button?.payload || 
                         null;
        const isProspectButton = buttonId && buttonId.startsWith("prospect_demo_");
        const isDemoInProgress = prospect && ["welcome", "demo_ask_phone", "demo_confirm_send"].includes(prospect.demoState);

        let role = "PROSPECT_DEMO";
        if (isDemoIntent || isProspectButton || isDemoInProgress) {
            role = "PROSPECT_DEMO";
        } else if (profile) {
            role = "MERCHANT";
        } else if (isCustomer) {
            role = "CUSTOMER";
        }

        // 1. Route based on resolved Conversation Mode
        if (role === "PROSPECT_DEMO") {
            const ProspectController = require("./ProspectController");
            const handled = await ProspectController.handle(message, cleanFrom, { ...opts, profile });
            if (handled) {
                return true;
            }
        }

        if (role === "CUSTOMER") {
            // Handled by WhatsAppController customer session/inbound webhook pipeline
            return false;
        }

        // 1. Load or initialize ConversationContext for user
        let context = await ConversationContext.findOne({ whatsappNumber: cleanFrom });
        if (!context) {
            context = new ConversationContext({
                whatsappNumber: cleanFrom,
                businessId: profile ? profile._id : undefined,
                mode: "free_conversation"
            });
            await context.save();
        } else if (profile && (!context.businessId || String(context.businessId) !== String(profile._id))) {
            context.businessId = profile._id;
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

        // 4. Pre-AI Memory Recall Check (Priority 5 — Conversation Memory Manager)
        // If no active workflow, check if the merchant is asking a temporal recall question.
        // If so, answer directly from ConversationMemory.lastDraft — no AI needed.
        if (opts.text && isRecallQuery(opts.text) && profile) {
            try {
                const ConversationMemory = require("../models/ConversationMemory");
                const memory = await ConversationMemory.findOne({ businessId: profile._id });
                const recentDraft = memory ? memory.getRecentDraft() : null;

                if (recentDraft) {
                    const reply = buildDraftRecallReply(recentDraft);
                    await MessageDispatcher.send(opts.from, reply);
                    console.log(`🧠 [Gateway] Answered recall query from memory for ${cleanFrom} (draft: ${recentDraft.workflowType}/${recentDraft.status})`);
                    return true; // Intercepted — AI never sees this
                }
                // No recent draft — fall through to AI which will reply with an honest "I don't know"
            } catch (err) {
                console.error("🚨 [Gateway] Memory recall check error:", err.message);
                // Safe fallthrough to AI on any memory error
            }
        }

        // 4.5 Pre-AI Workflow Resumption Check (Priority 3+4 — Memory Manager)
        // If no active workflow, check if the merchant wants to resume the last draft.
        if (opts.text && isResumeQuery(opts.text) && profile) {
            console.log(`🧠 [Gateway] Detected resume query: "${opts.text}"`);
            try {
                const ConversationMemoryManager = require("./ConversationMemoryManager");
                const resumed = await ConversationMemoryManager.resumeDraftWorkflow(opts.from, profile, context);
                console.log(`🧠 [Gateway] resumeDraftWorkflow returned:`, resumed);
                if (resumed) return true; // Intercepted and resumed successfully
            } catch (err) {
                console.error("🚨 [Gateway] Workflow resumption check error:", err.message);
            }
        }

        // 5. Default to false: fall through to AI Intent engine (free conversation)
        return false;
    }
}

module.exports = ConversationGateway;


