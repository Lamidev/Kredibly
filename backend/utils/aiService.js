const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");
// Using Gemini 1.5 Flash as it's the stable workhorse for the current project tier.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
1. "create_sale" -> Recording a sale, receipt of money, or a DEBT REMINDER.
2. "check_debt" -> Asking about balances.
3. "update_record" -> Updating an existing record.
4. "new_support_ticket" -> Help requests, complaints ("My app is slow", "I have an issue").
5. "reply_ticket" -> Use this ONLY if 'hasOpenTicket' is TRUE and the user's message is NOT a sales command (e.g., "Thanks", "Okay", "Here is the screenshot", "When will you fix it?").
6. "general_chat" -> Greetings or ambiguous input.

JSON Structure:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "new_support_ticket" | "reply_ticket" | "general_chat",
  "confidence": 0.0 to 1.0, 
  "data": {
    "customerName": "Extracted Name",
    "totalAmount": Number,
    "paidAmount": Number,
    "item": "Description",
    "dueDate": "YYYY-MM-DD",
    "reply": "Witty reply"
  }
}

Rules:
- CONTEXT AWARENESS: Look at the 'Merchant Context' below. If 'hasOpenTicket' is YES, prioritize detecting if the user is replying to that ticket ("reply_ticket").
- IF hasOpenTicket == true AND input is NOT a clear sales command (like "sold 5k"), assume intent is "reply_ticket".
- IF hasOpenTicket == false AND input looks like a complaint ("I have a problem", "Help me"), intent is "new_support_ticket".
- "Sarah paid her debt" -> intent: "update_record", customerName: "Sarah", item: "Repayment".
- "Thanks" (with open ticket) -> intent: "reply_ticket".
- "Thanks" (no open ticket) -> intent: "general_chat".
- Always prioritize "create_sale" if a name and money/debt are mentioned together, even if ticket is open.
- For business logic, be street-smart but accurate.
- IMPORTANT: ALWAYS response with ONLY valid JSON.
`;

  try {
    const today = new Date().toISOString().split("T")[0];
    const prompt = `
    --- MERCHANT CONTEXT ---
    Today is ${today}.
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
    return null; 
  }
};

module.exports = { processMessageWithAI };
