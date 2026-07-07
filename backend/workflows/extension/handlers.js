/**
 * Extension Workflows Handlers
 */

const WorkflowBase = require("../_base/WorkflowBase");
const MessageDispatcher = require("../../conversation/MessageDispatcher");
const messages = require("./messages");
const chrono = require("chrono-node");

// Models and Services
const Sale = require("../../models/Sale");
const { 
    handleMerchantApproveExtension, 
    handleMerchantRejectExtension,
    handleCustomerExtensionDuration 
} = require("../../utils/customerInvoiceService");

// ── Merchant-Side Extension Decision Workflow ─────────────────────────────────

class MerchantExtension extends WorkflowBase {
    async handle(step, message, state, profile, opts) {
        const text = this.getText(message, opts);
        const buttonId = this.getButtonId(message);

        switch (step) {
            case "awaiting_decision":
                return await this.handleDecision(text, buttonId, state, profile, opts);
            default:
                console.warn(`[MerchantExtension] Unknown step "${step}"`);
                return false;
        }
    }

    async handleDecision(text, buttonId, state, profile, opts) {
        const lowerText = text.toLowerCase().trim();
        const saleId = state.data.saleId;

        const isApprove = buttonId.startsWith("ext_approve:") || 
                          ["approve", "accept", "yes", "y"].includes(lowerText);
        
        const isReject = buttonId.startsWith("ext_reject:") || 
                         ["reject", "decline", "no", "n"].includes(lowerText);

        if (isApprove) {
            const sessionData = { ...state.data };
            await this.complete(state);
            const result = await handleMerchantApproveExtension(saleId, sessionData);
            if (result.success) {
                const newDate = new Date(sessionData.newDueDate);
                const dateStr = newDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
                const successMsg = messages.merchantApproveSuccess
                    .replace("{customerName}", sessionData.customerName || "Customer")
                    .replace("{dateStr}", dateStr);
                await MessageDispatcher.send(opts.from, successMsg);
            } else {
                await MessageDispatcher.send(opts.from, messages.merchantNoExtensionFound);
            }
            return true;
        }

        if (isReject) {
            const sessionData = { ...state.data };
            await this.complete(state);
            const result = await handleMerchantRejectExtension(saleId, sessionData);
            if (result.success) {
                const successMsg = messages.merchantRejectSuccess
                    .replace("{customerName}", sessionData.customerName || "Customer");
                await MessageDispatcher.send(opts.from, successMsg);
            } else {
                await MessageDispatcher.send(opts.from, messages.merchantNoExtensionFound);
            }
            return true;
        }

        // Help the merchant with valid controls
        await MessageDispatcher.send(opts.from, messages.merchantGuidance);
        return true;
    }
}

// ── Customer-Side Extension Request Workflow ─────────────────────────────────

class CustomerExtension extends WorkflowBase {
    async handle(step, message, state, profile, opts) {
        const text = this.getText(message, opts);
        const buttonId = this.getButtonId(message);

        switch (step) {
            case "awaiting_duration":
                return await this.handleDuration(text, buttonId, state, profile, opts);
            case "awaiting_custom_date":
                return await this.handleCustomDate(text, state, profile, opts);
            case "awaiting_reason":
                return await this.handleReason(text, buttonId, state, profile, opts);
            default:
                console.warn(`[CustomerExtension] Unknown step "${step}"`);
                return false;
        }
    }

    async handleDuration(text, buttonId, state, profile, opts) {
        const lowerText = text.toLowerCase().trim();

        // 1. Check for custom date option
        if (buttonId.startsWith("ext_custom:") || lowerText.includes("custom")) {
            await this.advanceTo(state, "awaiting_custom_date");
            await MessageDispatcher.send(opts.from, "Sure. What date would you like to pay by?");
            return true;
        }

        // 2. Check for button duration values or typed numbers
        let days = 0;
        if (buttonId.startsWith("ext_3days:") || lowerText.includes("3 days")) {
            days = 3;
        } else if (buttonId.startsWith("ext_1week:") || lowerText.includes("1 week")) {
            days = 7;
        } else {
            const numMatch = lowerText.match(/(\d+)\s*(day|week|month)/i);
            if (numMatch) {
                days = parseInt(numMatch[1]);
                const unit = numMatch[2].toLowerCase();
                if (unit.startsWith("week")) days *= 7;
                if (unit.startsWith("month")) days *= 30;
            }
        }

        if (days > 0) {
            const saleId = state.data.saleId;
            const customerName = state.data.customerName;

            await this.complete(state);
            await handleCustomerExtensionDuration(saleId, days, opts.cleanFrom, customerName);
            return true;
        }

        // Reprompt
        await MessageDispatcher.send(opts.from, "Please choose one of the options or enter a number of days.");
        return true;
    }

    async handleCustomDate(text, state, profile, opts) {
        const parsedDate = chrono.parseDate(text);
        if (!parsedDate || parsedDate <= new Date()) {
            await MessageDispatcher.send(opts.from, messages.invalidCustomDate);
            return true;
        }

        // Move to reason collection step
        await this.advanceTo(state, "awaiting_reason", {
            newDueDate: parsedDate.toISOString()
        });

        // Prompt for optional reason with custom buttons
        await MessageDispatcher.sendButtons(
            opts.from,
            "Optional Reason",
            messages.reasonAsk,
            "",
            [{ id: "ext_skip_reason", title: "Skip" }]
        );
        return true;
    }

    async handleReason(text, buttonId, state, profile, opts) {
        const reply = text.trim();
        const reason = (buttonId === "ext_skip_reason" || reply.toLowerCase() === "skip") ? null : reply;
        const { saleId, customerName, newDueDate } = state.data;

        await this.complete(state);

        // Submit request to merchant with custom date and optional reason
        await handleCustomerExtensionDuration(saleId, null, opts.cleanFrom, customerName, reason, new Date(newDueDate));
        return true;
    }
}

module.exports = {
    merchant: MerchantExtension,
    customer: CustomerExtension
};
