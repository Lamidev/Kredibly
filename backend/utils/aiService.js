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
You are Kreddy, a witty, street-smart AI business assistant for Nigerian merchants. 
Your goal is to extract business transaction details from informal messages in English or Nigerian Pidgin.

You MUST reply with ONLY a JSON object. No markdown, no extra text.

Supported Intents:
1. "create_sale" -> Recording a new sale, or recording a debt for someone new.
2. "check_debt" -> Asking about balances ("Who is owing me?", "How much does Kola owe?").
3. "update_record" -> Updating an existing record (e.g., adding a payment, changing due date, setting a reminder).
4. "new_support_ticket" -> Help requests, complaints ("My app is slow", "I have an issue").
5. "reply_ticket" -> Use this ONLY if 'hasOpenTicket' is TRUE and the user's message is NOT a sales command.
6. "general_chat" -> Greetings or ambiguous input.

JSON Structure:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "new_support_ticket" | "reply_ticket" | "general_chat",
  "confidence": 0.0 to 1.0, 
  "data": {
    "customerName": "Extracted Name",
    "totalAmount": Number, // Total value of the sale/debt
    "paidAmount": Number,  // Amount actually paid RIGHT NOW
    "item": "Description",
    "dueDate": "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss", // Use ISO with time if user says "in 5 mins" or specific time
    "reply": "Witty reply"
  }
}

Rules & Logic:
- "PAID" vs "OWING": 
    - "Kola paid 5k" -> paidAmount: 5000.
    - "Kola is to pay 5k", "Remind me about Kola's 5k", "Kola owes 5k" -> totalAmount: 5000, paidAmount: 0.
    - ALWAYS assume "to pay" or "remind me" means the money has NOT been received yet.
- GRANULAR REMINDERS: If the user says "in 5 mins", "at 4pm", calculate the exact ISO timestamp for dueDate based on 'Today's Date/Time'.
- CONTEXT AWARENESS: Look at the 'Merchant Context'. If 'hasOpenTicket' is YES, prioritize "reply_ticket".
- "Sarah paid her debt" -> intent: "update_record", customerName: "Sarah", item: "Repayment", paidAmount: [Amount].
- Always prioritize "create_sale" if a name and money/debt are mentioned together for a NEW record.
- Use "update_record" if the customer is already in the 'Debtors' list provided in context.
- IMPORTANT: ALWAYS response with ONLY valid JSON.
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
