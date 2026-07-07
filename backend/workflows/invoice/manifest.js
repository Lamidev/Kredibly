/**
 * Invoice Creation Workflow Manifest
 */

const WorkflowManifest = require("../_base/WorkflowManifest");

const rawManifest = {
    id: "invoice_creation",
    category: "invoice",
    owner: "merchant",
    priority: "HIGH",

    steps: [
        "awaiting_customer_phone",
        "awaiting_due_date",
        "awaiting_confirmation",
        "awaiting_multi_invoice_decision"
    ],

    timeout: {
        minutes: 20,
        behaviour: "resume",
        message: "Your invoice draft is still waiting. Send me the details or customer phone to continue, or say *cancel* to discard it."
    },

    cancel: {
        behaviour: "immediate",
        keywords: ["cancel", "stop", "abort", "nevermind", "never mind", "forget it"],
        message: "Invoice cancelled. Let me know when you're ready to create a new one."
    },

    resume: {
        behaviour: "resume"
    },

    interruptible: true,

    analytics: {
        track: ["started", "completed", "cancelled", "timeout", "edited"]
    }
};

module.exports = WorkflowManifest.from(rawManifest);
