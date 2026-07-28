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
     * @returns {Object} { allowed: boolean, fallbackText: string|null, overrideIntent: string|null }
     */
    static validate(intent, data = {}, profile = {}) {
        // Policy: draft_invoice is deprecated
        if (intent === "draft_invoice") {
            console.warn(`[IntentGuard] Policy Alert: Deprecated "draft_invoice" intent requested.`);
            return {
                allowed: false,
                overrideIntent: null,
                fallbackText: "I've upgraded how payment links work. Kreddy now delivers secures updates and invoices directly to customer phone numbers inside WhatsApp, meaning you don't need to copy and paste links manually anymore! 🚀"
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
