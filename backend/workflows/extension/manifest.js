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

    steps: {
        awaiting_decision: {
            acceptedInputs: ["button_tap", "yes_no_confirmation", "text"],
            buttons: [
                { id: "ext_approve", title: "Approve" },
                { id: "ext_reject", title: "Decline" }
            ],
            validation: {
                errorMessage: "Please reply with *approve* or *decline*, or tap one of the buttons above to decide on the extension."
            }
        }
    },

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

    steps: {
        awaiting_duration: {
            acceptedInputs: ["button_tap", "text"],
            buttons: [
                { id: "ext_3days", title: "3 Days" },
                { id: "ext_1week", title: "1 Week" },
                { id: "ext_custom", title: "Custom Date" }
            ],
            validation: {
                errorMessage: "Please choose one of the options or enter a number of days (e.g. '3 days' or '1 week')."
            }
        },
        awaiting_custom_date: {
            acceptedInputs: ["date"],
            buttons: [
                { id: "cancel", title: "Cancel" }
            ]
        },
        awaiting_reason: {
            acceptedInputs: ["button_tap", "text"],
            buttons: [
                { id: "ext_skip_reason", title: "Skip" }
            ]
        }
    },

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
