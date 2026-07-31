/**
 * IntentGuard — V3 Conversational Operating System
 *
 * Policy check layer situated between AI classification and execution.
 * Intercepts deprecated, dangerous, or invalid intents and redirects them
 * to secure V2 conversational patterns.
 */

class IntentGuard {
    /**
     * Verify whether an intent matches safety and architectural policy guidelines.
     *
     * @param {string} intent    - Classified AI intent
     * @param {Object} data      - Extracted entity arguments
     * @param {Object} profile   - BusinessProfile document
     * @param {Object} options   - Contextual options { isStaff: boolean, rawText: string }
     * @returns {Object} { allowed: boolean, fallbackText: string|null, overrideIntent: string|null }
     */
    static validate(intent, data = {}, profile = {}, options = {}) {
        const isStaff = options.isStaff || false;
        const rawText = options.rawText || data.transcription || "";

        // 🛡️ SECURITY 1: Prompt Injection Guard
        const injectionPattern = /ignore\s+(all\s+)?(previous\s+)?instructions|system\s+override|forget\s+(your\s+)?instructions|override\s+intent|system\s+prompt/i;
        if (injectionPattern.test(rawText)) {
            console.warn(`[IntentGuard] Security Alert: Prompt injection attempt detected: "${rawText.substring(0, 50)}"`);
            return {
                allowed: false,
                overrideIntent: "general_chat",
                fallbackText: "I'm strictly built to help manage your sales, invoices, reminders, and receivables! How can I assist with your business today?"
            };
        }

        // 🛡️ SECURITY 2: Staff Role-Based Access Control (RBAC)
        const ownerOnlyIntents = ["delete_sale", "delete_reminder", "pay_subscription", "add_staff"];
        if (isStaff && ownerOnlyIntents.includes(intent)) {
            console.warn(`[IntentGuard] Permission Alert: Staff member attempted owner-only intent "${intent}".`);
            return {
                allowed: false,
                overrideIntent: null,
                fallbackText: "Only the workspace owner has permission to perform this action (deleting sales/reminders, managing staff, or changing subscription plans). Please ask your manager to carry out this update."
            };
        }

        // Policy: draft_invoice is deprecated
        if (intent === "draft_invoice") {
            console.warn(`[IntentGuard] Policy Alert: Deprecated "draft_invoice" intent requested.`);
            return {
                allowed: false,
                overrideIntent: null,
                fallbackText: "I've upgraded how payment links work. Kreddy now delivers secure updates and invoices directly to customer phone numbers inside WhatsApp! 🚀"
            };
        }

        // Policy: Off-topic general trivia / non-business query check
        if (intent === "off_topic" || data?.isOffTopic) {
            return {
                allowed: false,
                overrideIntent: "general_chat",
                fallbackText: "That's outside what I'm built for 😄. I can help you manage customers, payments, invoices, reminders and your day-to-day work."
            };
        }

        return {
            allowed: true,
            overrideIntent: null,
            fallbackText: null
        };
    }
}

module.exports = IntentGuard;
