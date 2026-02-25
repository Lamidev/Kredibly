const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logUsage } = require("./usageTracker");

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

const SYSTEM_INSTRUCTION = `
You are Kreddy, the Professional Receivables Infrastructure Assistant and business partner for Nigerian merchants. 
You are NOT just a computer; you are the automated backbone of your boss's trade, dedicated to 100% collection rates and financial professionalism.

PERSONALITY:
- Language: Professional yet friendly Nigerian English & Pidgin (e.g., use "Done, Boss", "Collection link ready", "Receivables updated").
- Tone: Efficient, authoritative yet loyal, and relentless about recovering receivables. You hate seeing your boss lose money and your mission is to ensure every debt is cleared!
- Behavior: You understand slang like "2k", "5h", "10 bar", but you record them with the precision of a Swiss bank.

TASK:
Extract business transaction details from the user's message.

Supported Intents:
1. "create_sale" -> Boss sold something or recorded a new receivable.
2. "check_debt" -> Boss wants to know who is owing or the total collection pipeline.
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
    "reply": "A professional partner-like reply in Pidgin/English (e.g. 'Chairman, I've logged that receivable for Kola. Collection setup! 🛡️')"
  }
}

Rules:
1. If 'hasOpenTicket' is YES and the user is clearly complaining/asking for help, use 'reply_ticket'.
2. If the message is "Joy owe me 5k", totalAmount is 5000, paidAmount is 0. Intent: create_sale.
3. If the message is "Joy pay 2k out of her debt", intent is 'update_record', paidAmount is 2000.
4. BE HUMAN: If a user says "Thank you", reply with warmth. If they say "Kreddy, I'm stressed", offer encouragement as his business bodyguard.
5. ONLY RESPOND WITH VALID JSON. No extra commentary.
`;

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

  try {
    const now = new Date().toISOString();
    const tone = context.preferredTone || "friendly";
    const entity = context.entityType || "individual";
    const plan = context.plan || "hustler";
    
    // Title mapping for AI 
    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
    const bizSafeName = entity === "business" ? context.merchantName : bossTitle;

    const prompt = `
    --- MERCHANT CONTEXT & PREFERENCES ---
    Current Time: ${now} (Use this for relative reminders)
    Merchant Name: ${context.merchantName || 'A user'}
    Merchant Plan: ${plan.toUpperCase()}
    Merchant Entity: ${entity} (individual/business)
    Preferred Tone: ${tone.toUpperCase()} (Friendly = more Pidgin, Formal = professional English)
    Boss Title to used: ${bossTitle}
    Their Business Identity to use if formal: ${bizSafeName}
    
    Active Debtors/Unpaid Records: ${context.debtors || 'None.'}
    Has Open Ticket: ${context.hasOpenTicket ? 'YES' : 'NO'}
    Conversation Context: ${context.currentSession ? JSON.stringify(context.currentSession) : 'Floating conversation.'}
    -------------------------

    System Instruction: ${SYSTEM_INSTRUCTION}
    
    User Message: "${text}"

    PERSONALITY ADJUSTMENT FOR THIS USER:
    - If Tone is FRIENDLY: Use more Pidgin like "Chairman, I've logged am", "Done, Boss".
    - If Tone is FORMAL: Use professional English like "Details recorded, ${bossTitle}", "Receivable updated for ${bizSafeName}".
    - Always remain a relentlessly loyal partner focused on 100% collection.
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
                reply: textResponse.substring(0, 160) || `I'm processing that, ${bossTitle}! Abeg hold on.`
            }
        };
    }
    
    // Safety check for creation
    if (parsed.intent === "create_sale" && !parsed.data.totalAmount && !parsed.data.reply) {
        parsed.data.reply = tone === "friendly" ? "I catch the sale, but how much be the total money? 💰" : `Details noted. May I have the total transaction value to complete the entry?`;
    }

    // LOG USAGE (Gemini Call)
    logUsage("ai").catch(e => console.error("Logger fail:", e));

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

/**
 * Processes incoming audio messages (voice notes) using Gemini AI.
 * Part of the "Chairman Plan" Voice Sync feature.
 * @param {Buffer} audioBuffer - The audio data.
 * @param {string} mimeType - The mime type (e.g., audio/ogg; codecs=opus).
 * @param {object} context - Additional context.
 */
const processAudioWithAI = async (audioBuffer, mimeType, context = {}) => {
  if (!process.env.KREDDY_API_KEY) return null;

  try {
    const now = new Date().toISOString();
    const prompt = `
    --- MERCHANT CONTEXT ---
    Current Time: ${now}
    Merchant: ${context.merchantName || 'A user'}
    Their Debtors: ${context.debtors || 'None.'}
    -------------------------

    System Instruction: ${SYSTEM_INSTRUCTION}

    Task: Listen to the audio and extract the business details just like a text message.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    let textResponse = response.text();
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    console.log("🤖 Kreddy Voice Brain Raw:", textResponse);
    
    let parsed = JSON.parse(textResponse);
    logUsage("ai_multimodal").catch(e => console.error("Logger fail:", e));
    return parsed;
  } catch (error) {
    console.error("Gemini Voice AI Error:", error);
    return null;
  }
};

module.exports = { processMessageWithAI, processAudioWithAI };
