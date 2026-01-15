const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");
// Reverting to Gemini 1.5 Flash as it's the stable workhorse for the current project tier.
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
1. "create_sale" -> Recording a sale, receipt of money, or a DEBT REMINDER (e.g., "Sarah owes me 5k", "Remind me to collect 5k from Sarah tomorrow").
2. "check_debt" -> Asking about balances, who owes what, or debt summaries.
3. "update_record" -> Updating an existing record (e.g., "Change Sarah's due date to Friday", "Sarah paid part of her money").
4. "support" -> Help requests or reporting issues.
5. "general_chat" -> Greetings, compliments, or general banter.

JSON Structure:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "support" | "general_chat",
  "confidence": 0.0 to 1.0, 
  "data": {
    "customerName": "Extracted Name" (Use 'Customer' if unknown),
    "totalAmount": Number (Total value to be collected/recorded),
    "paidAmount": Number (How much was paid TODAY. If it's a debt/reminder, paidAmount is 0. If unspecified for a sale, assume paidAmount = totalAmount),
    "item": "Description" (What was sold or "Debt Reminder"),
    "dueDate": "YYYY-MM-DD" (Calculate based on relative terms like 'tomorrow', 'next week'),
    "reply": "A witty, short reply in Nigerian Pidgin/English. If you capture a reminder, tell them you've set the alarm!"
  }
}

Rules:
- PRONOUNS: If the user says "She", "He", "They", or "The customer", look at 'Conversation Context'. Use that 'customerName'!
- CONTINUATION/CORRECTION: If the user corrects or adds info to a previous message (e.g., "Actually she paid 20k", "Sorry David King"), set intent based on what they are correcting. 
- If the user provides a name after you just suggested several (e.g., "Sorry David King"), set intent to "check_debt" (or whatever the previous active intent was) and customerName to that selected name.
- If a user mentions "the balance", "the money", "everything", or "how much", check the MERCHANT CONTEXT section. If we were already talking about a specific person (see Conversation Context), use their balance from the Debtors list!
- If the name from 'Conversation Context' matches a name in 'Debtors Context', ALWAYS prefer that amount if 'totalAmount' is missing in the new message.
- "Sarah paid her debt" -> intent: "update_record", customerName: "Sarah", item: "Repayment".
- Always prioritize "create_sale" if a name and money/debt are mentioned together.
- For business logic, be street-smart but accurate.
- IMPORTANT: ALWAYS response with ONLY valid JSON. If you are stuck, use "general_chat" with a helpful reply.

Rules & Examples:
- "5k" = 5000, "200,000" = 200000.
- "I sold a Sound System to Okey for 400k and he paid 150k. Balance in 2 weeks" -> 
   intent: "create_sale", totalAmount: 400000, paidAmount: 150000, customerName: "Okey", dueDate: (today + 14 days), item: "Sound System"
- "Tunde took 2 bags of rice on credit" -> totalAmount: null (ASK), paidAmount: 0, customerName: "Tunde", intent: "create_sale"
- If 'totalAmount' is missing in a sale, still set intent to "create_sale" but set totalAmount to null.
- Be street-smart. "Abeg how much Tunde owe me?" -> intent: "check_debt", customerName: "Tunde".
`;

  try {
    const today = new Date().toISOString().split("T")[0];
    const prompt = `
    --- MERCHANT CONTEXT ---
    Today is ${today}.
    Merchant: ${context.merchantName || 'A user'}
    Their Debtors/Unpaid Records: ${context.debtors || 'None.'}
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
