/**
 * Invoice Creation Workflow Messages/Templates
 */

module.exports = {
    invalidPhone: "That doesn't look like a valid phone number. Please reply with a valid number like 08012345678 or +2348012345678.",

    invoiceCancelled: "Understood — invoice cancelled. Just let me know when you're ready to send it.",

    unknownDuringConfirmation: "I didn't quite catch that. Tap *Send Invoice* to confirm, *Review & Edit* to make changes, or *Cancel* to discard.",

    // ── Edit mode entry ──────────────────────────────────────────────────────
    editFieldPrompt: "No problem. What would you like to change?",

    // ── Per-field guided prompts ─────────────────────────────────────────────
    askCustomerName: "What's the customer's name?",
    askItem:         "What's the item or service description?",
    askAmount:       "What's the new invoice amount?",
    askDeposit:      "How much has the customer already paid as a deposit?",
    askDueDate:      "What's the new due date? (e.g. *next Friday*, *24 July*, *in 3 days*)",
    askPhone:        "What's the customer's WhatsApp number?",

    // ── Post-edit confirmation ───────────────────────────────────────────────
    // Use .replace("{field}", "...").replace("{value}", "...") when sending
    editConfirmed: "Done. {field} updated to *{value}*.\n\nAnything else you'd like to change?",

    // ── Validation errors per field ──────────────────────────────────────────
    invalidAmount:  "That doesn't look like a valid amount. Try something like *700k*, *1.2m*, or *85000*.",
    invalidDate:    "I didn't catch that date. Try something like *next Friday*, *24 July*, or *in 3 days*.",
};
