/**
 * Invoice Creation Workflow Manifest
 */

const WorkflowManifest = require("../_base/WorkflowManifest");

const rawManifest = {
    id: "invoice_creation",
    category: "invoice",
    owner: "merchant",
    priority: "HIGH",

    steps: {
        awaiting_customer_phone: {
            acceptedInputs: ["phone"],
            validation: {
                errorMessage: "That doesn't look like a valid phone number. Please enter it as 08012345678 or +2348012345678."
            },
            buttons: [
                { id: "cancel", title: "Cancel" }
            ]
        },
        awaiting_due_date: {
            acceptedInputs: ["date"],
            buttons: [
                { id: "cancel", title: "Cancel" }
            ]
        },
        awaiting_confirmation: {
            acceptedInputs: ["button_tap", "yes_no_confirmation"],
            buttons: [
                { id: "invoice_yes",  title: "Send Invoice" },
                { id: "invoice_no",   title: "Cancel" },
                { id: "invoice_edit", title: "Review & Edit" }
            ],
            validation: {
                errorMessage: "I didn't quite catch that. Tap *Send Invoice* to confirm, *Review & Edit* to make changes, or *Cancel* to discard."
            }
        },
        awaiting_multi_invoice_decision: {
            acceptedInputs: ["button_tap"],
            buttons: [
                { id: "multi_inv_continue", title: "Create New Invoice" },
                { id: "multi_inv_view",     title: "View Existing" }
            ]
        },
        // ── V2 Edit Steps ────────────────────────────────────────────────────
        awaiting_edit_field: {
            acceptedInputs: ["button_tap"],
            buttons: [
                { id: "edit_field:customer", title: "Customer Name" },
                { id: "edit_field:item",     title: "Item / Description" },
                { id: "edit_field:amount",   title: "Amount" },
                { id: "edit_field:deposit",  title: "Deposit Paid" },
                { id: "edit_field:duedate",  title: "Due Date" },
                { id: "edit_field:phone",    title: "Phone Number" }
            ]
        },
        awaiting_edit_value: {
            acceptedInputs: ["text"],
            buttons: [
                { id: "cancel", title: "Cancel" }
            ],
            validation: {
                errorMessage: "I didn't quite catch that. Please try again or tap Cancel."
            }
        }
    },

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
