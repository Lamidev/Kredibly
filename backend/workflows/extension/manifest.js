/**
 * Extension Workflows Manifests
 * Declares both merchant-side extension decisioning and customer-side extension request capture.
 */

const WorkflowManifest = require("../_base/WorkflowManifest");

const merchantExtension = {
    id: "merchant_extension",
    category: "extension",
    owner: "merchant",
    priority: "HIGH",

    steps: [
        "awaiting_decision"
    ],

    timeout: {
        minutes: 15,
        behaviour: "notify",
        message: "You have a pending extension request from a customer. Reply with approve or decline, or tap the buttons above."
    },

    cancel: {
        behaviour: "immediate",
        keywords: ["cancel", "stop"],
        message: "Extension approval closed."
    },

    resume: {
        behaviour: "resume"
    },

    interruptible: true
};

const customerExtension = {
    id: "customer_extension",
    category: "extension",
    owner: "customer",
    priority: "HIGH",

    steps: [
        "awaiting_duration",
        "awaiting_custom_date",
        "awaiting_reason"
    ],

    timeout: {
        minutes: 30,
        behaviour: "silent"
    },

    cancel: {
        behaviour: "immediate",
        keywords: ["cancel", "stop"],
        message: "Extension request cancelled."
    },

    resume: {
        behaviour: "resume"
    },

    interruptible: true
};

module.exports = {
    merchant: WorkflowManifest.from(merchantExtension),
    customer: WorkflowManifest.from(customerExtension)
};
