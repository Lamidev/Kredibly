/**
 * ResponseBuilder — V3 Conversational Operating System
 *
 * Centralized formatting and delivery channel for all outbound messages.
 * Enforces tone consistency, brand styles, button limits, and the strict
 * "No Naked Links" policy by automatically wrapping raw URLs in interactive CTA buttons.
 */

const MessageDispatcher = require("./MessageDispatcher");

const URL_REGEX = /(https?:\/\/[^\s\)]+)/gi;

class ResponseBuilder {
    /**
     * Parse text for any raw URLs and split them out.
     * Enforces the V3 No Naked Links policy.
     *
     * @param {string} text - The raw text message content
     * @returns {Object} { cleanText, hasLink, url }
     */
    static extractNakedLinks(text) {
        if (!text) return { cleanText: "", hasLink: false, url: null };
        
        const matches = text.match(URL_REGEX);
        if (matches && matches.length > 0) {
            const url = matches[0];
            // Remove the raw URL from the text so it does not render naked in chat
            const cleanText = text.replace(url, "").replace(/:\s*$/, "").replace(/\s\s+/g, " ").trim();
            return { cleanText, hasLink: true, url };
        }
        return { cleanText: text, hasLink: false, url: null };
    }

    /**
     * Send a standard plain text message, automatically converting naked links to CTA buttons.
     */
    static async sendText(to, text, options = {}) {
        if (!text) return false;

        const { cleanText, hasLink, url } = this.extractNakedLinks(text);
        if (hasLink && url) {
            // Automatically convert the plain text containing a URL into a CTA button
            return await this.sendInteractiveButtons(
                to,
                options.header || "Link",
                cleanText || "Tap the button below to view:",
                options.footer || "",
                [{ id: "cta_url_open", title: options.buttonTitle || "Open Link" }],
                url
            );
        }

        return await MessageDispatcher.send(to, text);
    }

    /**
     * Send interactive button messages, routing them through MessageDispatcher.
     */
    static async sendInteractiveButtons(to, header, body, footer, buttons, url = null) {
        if (!body || !buttons?.length) return false;

        const { sendInteractiveButtons } = require("../utils/customerInvoiceService");
        
        // If a URL is present, use the custom interactive CTA button sender
        if (url) {
            return await sendInteractiveButtons(to, header, body, footer, buttons, url);
        }

        return await MessageDispatcher.sendButtons(to, header, body, footer, buttons);
    }

    /**
     * Send an invoice summary layout.
     */
    static async sendInvoiceSummary(to, summaryLines, buttonsList) {
        return await MessageDispatcher.sendButtons(
            to,
            "Invoice Summary",
            summaryLines,
            "",
            buttonsList
        );
    }

    /**
     * Send a payment receipt notification card (image + details).
     */
    static async sendReceipt(to, sale, amountPaid, business) {
        const { notifyCustomerPaymentReceived } = require("../utils/customerInvoiceService");
        return await notifyCustomerPaymentReceived(sale._id, amountPaid);
    }
}

module.exports = ResponseBuilder;
