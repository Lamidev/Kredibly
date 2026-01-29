const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

// We use gemini-1.5-flash as the primary workhorse. 
let modelName = "gemini-1.5-flash";
let model = genAI.getGenerativeModel({ model: modelName });

/**
 * Update the model if the standard one fails.
 */
const refreshModel = (newModelName = "gemini-1.5-flash") => {
    modelName = newModelName;
    model = genAI.getGenerativeModel({ model: modelName });
};

/**
 * Processes incoming WhatsApp messages using Gemini AI to extract business intents and data.
 * @param {string} text - The incoming message text.
 * @param {object} context - Additional context (e.g., merchant name).
 * @returns {object|null} - Extraction result or null on error.
 */
const processMessageWithAI = async (text, context = {}) => {
  if (!process.env.KREDDY_API_KEY) {
    console.error("KREDDY_API_KEY is missing!");
    return null;
  }

  const SYSTEM_INSTRUCTION = `
You are Kreddy, the smart, street-savvy, and loyal AI business partner for Nigerian merchants. 
You are NOT just a computer; you are like a trusted staff member who cares about the business's profit.

PERSONALITY:
- Language: Professional yet friendly Nigerian English & Pidgin (e.g., use "Done, Boss", "No shaking", "ledger updated").
- Tone: Efficient, helpful, and firm about tracking money. You hate seeing your boss lose money!
- Behavior: You understand slang like "2k", "5h", "10 bar", "Joy owe me for lace".

TASK:
Extract business transaction details from the user's message.

Supported Intents:
1. "create_sale" -> Boss sold something or recorded a new debt.
2. "check_debt" -> Boss wants to know who is owing or total balance.
3. "update_record" -> Updating an existing record (e.g., "Joy just pay 2k", "Extend Kola's date to Friday").
4. "new_support_ticket" -> Complaints or help requests about the Kredibly app/dashboard.
5. "reply_ticket" -> Replying to an ongoing support conversation (if 'hasOpenTicket' is YES).
6. "general_chat" -> Greetings, "thank you", or conversation that isn't a command.

JSON Structure:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "new_support_ticket" | "reply_ticket" | "general_chat",
  "confidence": 0.0 to 1.0, 
  "data": {
    "customerName": "Extracted Name",
    "totalAmount": Number, // Total value
    "paidAmount": Number,  // Amount paid now
    "item": "Description",
    "dueDate": "ISO Timestamp",
    "reply": "A partner-like reply in Pidgin/English (e.g. 'Chairman, I've noted that record for Kola. 🛡️')"
  }
}

Rules:
1. If 'hasOpenTicket' is YES and the user is clearly complaining/asking for help, use 'reply_ticket'.
2. If the message is "Joy owe me 5k", totalAmount is 5000, paidAmount is 0.
3. If the message is "Joy pay 2k out of her debt", intent is 'update_record', paidAmount is 2000.
4. BE HUMAN: If a user says "Thank you", reply with warmth. If they say "Kreddy, I'm stressed", offer encouragement.
5. ONLY RESPOND WITH VALID JSON. No extra commentary.
`;

  try {
    const now = new Date().toISOString();
    const prompt = `
    --- MERCHANT CONTEXT ---
    Current Time: ${now} (Use this for relative reminders like "in 5 mins")
    Merchant: ${context.merchantName || 'A user'}
    Their Debtors/Unpaid Records: ${context.debtors || 'None.'}
    Has Open Ticket: ${context.hasOpenTicket ? 'YES' : 'NO'}
    Conversation Context: ${context.currentSession ? JSON.stringify(context.currentSession) : 'Floating conversation (no active session).'}
    -------------------------

    System Instruction: ${SYSTEM_INSTRUCTION}
    
    User Message: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();

    // Clean up any potential markdown if Gemini ignores instructions
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    console.log("🤖 Kreddy Brain Raw:", textResponse); 

    let parsed;
    try {
        parsed = JSON.parse(textResponse);
    } catch (e) {
        // Fallback for non-JSON or partial responses
        console.warn("AI didn't return valid JSON, attempting to wrap:", textResponse);
        return {
            intent: "general_chat",
            confidence: 0.5,
            data: {
                reply: textResponse.substring(0, 160) || "I'm processing that, chief! Abeg hold on."
            }
        };
    }
    
    // Safety check for creation
    if (parsed.intent === "create_sale" && !parsed.data.totalAmount && !parsed.data.reply) {
        parsed.data.reply = "I catch the sale, but how much be the total money? 💰";
    }

    return parsed;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    
    // Check for different error structures in Gemini SDK
    const statusCode = error.status || error.response?.status || error.response?.data?.error?.code;
    const isModelNotFound = statusCode === 404 || error.message?.includes("404") || error.message?.includes("not found");
    
    if (isModelNotFound) {
        console.warn("Model fallback triggered due to 404/Not Found. Attempting stable model...");
        refreshModel("gemini-1.5-flash"); // Use the working name
    }
    
    return null; 
  }
};

module.exports = { processMessageWithAI };
