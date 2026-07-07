/**
 * Invoice Creation Workflow Messages/Templates
 */

module.exports = {
    invalidPhone: "That doesn't look like a valid phone number. Please reply with a valid number like 08012345678 or +2348012345678.",
    
    unknownDuringConfirmation: "I didn't quite catch that. You can type a correction like *change name to Bukola* or *price is 85k*, or tap *Send Invoice* to confirm, or *Cancel* to discard.",
    
    editInstructions: [
        "*Current Invoice Details:*",
        "",
        "- *Customer:* {customerName}",
        "{phoneLine}",
        "- *Item/Description:* {itemsDisplay}",
        "- *Total:* ₦{totalAmount}",
        "{paidLine}",
        "{balLine}",
        "",
        "What would you like to edit? Just type your correction, for example:",
        "✍️ *change name to Bukola*",
        "✍️ *price is 85k*",
        "✍️ *paid is 50k*",
        "✍️ *change item to Nike Prado x2*",
        "✍️ *phone is 08082366322*"
    ].join("\n"),

    invoiceCancelled: "Understood — invoice cancelled. Just let me know when you're ready to send it."
};
