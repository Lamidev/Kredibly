/**
 * MessageDispatcher — V2 Workflow State Engine
 *
 * The single outbound channel for ALL workflow messages.
 * Workflows never call sendReply() or axios directly.
 * They call MessageDispatcher, which handles formatting and channel routing.
 *
 * Phase 1: WhatsApp only.
 * Phase 2+: WhatsApp + Email + Dashboard notification.
 *
 * This decoupling means:
 *   - Adding email support = edit MessageDispatcher, not 20 workflow files
 *   - Testability: mock MessageDispatcher to unit-test workflows without network calls
 *   - Consistency: all messages go through one place → easier logging/analytics
 */

const axios = require("axios");

// ── Credentials ───────────────────────────────────────────────────────────────

const getWACredentials = () => ({
    phoneId:     process.env.WHATSAPP_PHONE_ID  || process.env.PHONE_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN
});

const normalizePhone = (num) => {
    if (!num) return num;
    let clean = String(num).replace(/\D/g, "");
    if (clean.startsWith("0") && clean.length === 11) clean = "234" + clean.slice(1);
    return clean;
};

// ── Core Senders ──────────────────────────────────────────────────────────────

/**
 * Send a plain text WhatsApp message.
 */
const sendWAText = async (to, text) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!phoneId || !accessToken) {
        console.warn("[MessageDispatcher] WhatsApp credentials missing — message not sent.");
        return false;
    }
    const cleanTo = normalizePhone(to);
    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "text",
                text: { body: text, preview_url: false }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error("❌ [MessageDispatcher] sendWAText Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Send a WhatsApp interactive button message (max 3 buttons).
 */
const sendWAButtons = async (to, header, body, footer, buttons) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!phoneId || !accessToken) return false;
    const cleanTo = normalizePhone(to);

    const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "interactive",
        interactive: {
            type: "button",
            ...(header ? { header: { type: "text", text: String(header).substring(0, 60) } } : {}),
            body: { text: String(body).substring(0, 1024) },
            ...(footer ? { footer: { text: String(footer).substring(0, 60) } } : {}),
            action: {
                buttons: buttons.slice(0, 3).map(btn => ({
                    type: "reply",
                    reply: {
                        id:    String(btn.id).substring(0, 256),
                        title: String(btn.title).substring(0, 20)
                    }
                }))
            }
        }
    };

    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            payload,
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error("❌ [MessageDispatcher] sendWAButtons Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Send a WhatsApp interactive list message (up to 10 options).
 */
const sendWAList = async (to, header, body, buttonText, sections) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!phoneId || !accessToken) return false;
    const cleanTo = normalizePhone(to);

    const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "interactive",
        interactive: {
            type: "list",
            ...(header ? { header: { type: "text", text: String(header).substring(0, 60) } } : {}),
            body: { text: String(body).substring(0, 1024) },
            action: {
                button: String(buttonText || "Options").substring(0, 20),
                sections
            }
        }
    };

    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            payload,
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error("❌ [MessageDispatcher] sendWAList Error:", err.response?.data || err.message);
        return false;
    }
};

// ── MessageDispatcher Class ───────────────────────────────────────────────────

class MessageDispatcher {

    /**
     * Send a plain text message to a WhatsApp number.
     */
    static async send(to, text) {
        if (!text || !to) return false;
        return await sendWAText(to, text);
    }

    /**
     * Send an interactive button message (max 3 buttons).
     */
    static async sendButtons(to, header, body, footer, buttons) {
        if (!body || !to || !buttons?.length) return false;
        return await sendWAButtons(to, header, body, footer, buttons);
    }

    /**
     * Send an interactive list message (up to 10 options across sections).
     */
    static async sendList(to, header, body, buttonText, sections) {
        if (!body || !to || !sections?.length) return false;
        return await sendWAList(to, header, body, buttonText, sections);
    }

    /**
     * Convenience: send the standard invoice summary with action buttons.
     * Used by invoice_creation and invoice_approval workflows.
     */
    static async sendInvoiceSummary(to, summaryText) {
        return await sendWAButtons(
            to,
            "Invoice Summary",
            summaryText,
            "",
            [
                { id: "invoice_yes",  title: "Send Invoice" },
                { id: "invoice_no",   title: "Cancel" },
                { id: "invoice_edit", title: "Edit Details" }
            ]
        );
    }

    /**
     * Dispatch an action object — the structured output of a workflow step handler.
     * Allows workflow handlers to return { type, to, text, ... } instead of calling send directly.
     *
     * @param {Object} action
     * @param {string} action.type      - "text" | "buttons" | "list"
     * @param {string} action.to        - Recipient phone number
     * @param {string} [action.text]    - Body text (for type=text)
     * @param {string} [action.header]  - Header text (for buttons/list)
     * @param {string} [action.body]    - Body text (for buttons/list)
     * @param {string} [action.footer]  - Footer text
     * @param {Array}  [action.buttons] - Button array [{id, title}]
     * @param {Array}  [action.sections]- Section array (for list messages)
     * @param {string} [action.channel] - "whatsapp" (default) | "email" | "dashboard"
     */
    static async dispatch(action) {
        if (!action || !action.to) return false;
        const channel = action.channel || "whatsapp";

        if (channel !== "whatsapp") {
            // Phase 2+: email, dashboard channels
            console.log(`[MessageDispatcher] Channel "${channel}" not yet implemented — skipping.`);
            return false;
        }

        switch (action.type) {
            case "text":
                return await sendWAText(action.to, action.text);
            case "buttons":
                return await sendWAButtons(action.to, action.header, action.body, action.footer, action.buttons);
            case "list":
                return await sendWAList(action.to, action.header, action.body, action.buttonText, action.sections);
            default:
                console.warn(`[MessageDispatcher] Unknown action type: "${action.type}"`);
                return false;
        }
    }
}

module.exports = MessageDispatcher;
