/**
 * Extension Workflows Messages/Templates
 */

module.exports = {
    // Merchant messages
    merchantApproveSuccess: "✅ *Extension Approved!*\n\nI've updated the due date for *{customerName}* to *{dateStr}* and notified them. Reminders rescheduled automatically. 🛡️",
    merchantRejectSuccess: "❌ *Extension Rejected.*\n\n*{customerName}* has been notified that the extension was not approved. Their original payment deadline stands. 🛡️",
    merchantNoExtensionFound: "I couldn't find the extension request to handle. It may have expired. 🤔",
    merchantGuidance: "I didn't quite catch that. Please tap the *Approve* or *Decline* buttons above, or say 'cancel' to close.",

    // Customer messages
    invalidCustomDate: "I couldn't understand that date. Please enter a valid date (e.g. *24 July* or *next Friday*). 🗓️",
    reasonAsk: "Got it.\n\nWould you like to tell the merchant why you're requesting this extension?\n\n(Optional) Reply with your reason, or tap *Skip*.",
    extensionSubmitted: "Request submitted! I've sent your request to the merchant and will update you as soon as they decide. 🛡️"
};
