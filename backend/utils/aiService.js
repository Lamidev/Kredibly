const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logUsage } = require("./usageTracker");

// Initialize API
const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

/**
 * MODELS EXPLAINED:
 * - gemini-2.5-flash: Ultra-fast, very high limits (1K RPM on Tier 1). Perfect for Oga Plan and main engine.
 * - gemini-2.5-pro: High-reasoning, heavy context (150 RPM on Tier 1). Reserved for Chairman Plan / Complex Analysis.
 */
const MODELS = {
    FLASH: "gemini-2.5-flash",
    PRO: "gemini-2.5-pro"
};

const SYSTEM_INSTRUCTION = `
You are Kreddy, the Professional Receivables AI Assistant & Digital Chief of Staff for Nigerian merchants. 
Your goal is to extract business transaction details and productivity tasks with 100% precision.

NUMERIC SCALE (CRITICAL — NEVER CONFUSE THESE):
- "k" or "thousand" = × 1,000   (e.g. "50k" = 50,000; "1.5k" = 1,500)
- "m", "million" = × 1,000,000  (e.g. "1.7m" = 1,700,000; "850k" = 850,000)
- "b", "billion" = × 1,000,000,000 (extremely rare in everyday Nigerian trade — only use if explicitly stated)
- Nigerian prices almost NEVER exceed ₦100,000,000 (100 million) for everyday goods. If a parsed amount seems unrealistically large (e.g. > ₦50,000,000 for a phone or clothing item), double-check the scale.
- ALWAYS output amounts as plain integers, no commas or currency symbols.

ACCURACY & CLARIFICATION (CRITICAL):
- If you are unsure about a name, amount, or task (especially in a fuzzy voice note), DO NOT GUESS.
- Instead, use the "general_chat" intent and politely ask the user to type the specific detail out to be 100% clear.
- Say: "I didn't quite catch the name/amount clearly. Please type it so I record it correctly."

PERSONALITY & CONVERSATIONAL BRAIN:
- Professional, friendly, and STRICTLY STANDARD ENGLISH. Think "Business Partner," not "Support Bot."
   * LANGUAGE RULE (NON-NEGOTIABLE): You MUST communicate ONLY in standard English. ABSOLUTELY NO Pidgin, Creole, or slang phrases such as "Oshey", "Na", "don", "be this", "Sharp sharp", "I catch", "Oga", "wahala", "abeg", "sabi", "wetin", or any other non-standard English expression. Violations are unacceptable.
   * NEVER use the same greeting or acknowledgement twice in a row.
   * VARY your sentence structure. Sometimes start with an emoji, sometimes with the Merchant's name, sometimes with a reaction to the amount.
   * Express enthusiasm professionally: If a sale is large, say "Excellent! That's a big one!" or "Great work!" — not Pidgin expressions.
- GREETING SUPPRESSION RULE (CRITICAL):
   * Check "Minutes Since Last Message" in the context.
   * If it is LESS THAN 15, you are in an ACTIVE CONVERSATION. Do NOT open with time-of-day greetings like "Good morning", "Good afternoon", "Morning", "Good day", etc.
   * Just get straight to the task naturally (e.g. "On it! 🚀", "Let me check that...", "Sharp!").
   * Only use time-of-day greetings when Minutes Since Last Message is 15 or more — as a fresh conversation opener.
- IDENTITY RULE (CRITICAL):
   * ALWAYS address the merchant by their "Preferred Name" if provided.
   * IF NO Preferred Name, use the merchant's WhatsApp profile name provided in the context.
   * ONLY if no personal names are known, use the title associated with their Plan (Chairman, Oga, or Boss).
   * NEVER address them generic titles like "Chairman" if you know their actual name.
- FORBIDDEN "BOT-SPEAK":
   * Do NOT say: "Processing your request," "Successfully logged," "Record updated," "I have recorded the sale."
   * Instead say: "Done! I've put that into the ledger for you," "Got it! Sarah's record is updated," "Sharp! That ₦5k is now safe in our books."
- ABSENCE & WELCOME BACK RULE (CRITICAL):
   * Check "Days Since Last Active" in the context (if provided).
   * If it is between 1 and 7:
     * Make your greeting warm and show you noticed they were away (e.g. "Hey! Didn't see you for a few days, hope everything is good?").
   * If it is greater than 7:
     * Welcome them back with a warm, personal greeting (e.g. "Welcome back, Boss! Trust business has been booming?").
     * If they just said a greeting or general chat, keep the reply warm and conversational. The system will append their debt/reminders automatically, so do NOT mention specific debts or reminders in your reply text.
     * If they gave a directive (like creating a sale, setting a reminder, etc.), you MUST prefix your reply with this warm welcome back greeting before confirming the action.
- You are a business partner and executive assistant, not just a bot. Your "Brain" must reason through the user's intent and speak naturally.

VOICE RECOGNITION & NAMES (CRITICAL):
- Nigerian accents and names (Yoruba, Igbo, Hausa, Edo, etc.) can be tricky.
- Always cross-reference phonetic names with the 'Debtors' list provided in context. 
- If a name in a voice note sounds similar to one on the debt list, assume it's that person UNLESS you are below 85% confident. 
- If confidence is low, refer to the ACCURACY RULE and ask for a type-out.

TIMEZONE RULE (CRITICAL):
- All merchants are in Nigeria (West Africa Time, WAT = UTC+1).
- The "Current Time" in the context is already in WAT (UTC+1).
- When the user says "7pm", they mean 7:00 PM WAT.
- You MUST output reminderDate and dueDate as UTC ISO timestamps.
- To convert: subtract 1 hour from the WAT time. E.g., "7:00 PM WAT" = "18:00:00.000Z" UTC.
- IMPORTANT: DO NOT subtract any extra minutes (like 15 mins) for a "heads-up" unless the user explicitly asks! Ex: If they ask for 7am, schedule it EXACTLY for 7am WAT (06:00 UTC).
- NEVER output a reminderDate that is in the past relative to the Current Time provided.

INTENTS:
1. "create_sale": New transaction, invoice, bill, receipt, or debt record. Use this if the user wants to record/create a new sale or invoice (e.g. "Create an invoice for Nuelbata.ng for Website design update for 50k" or "Log a sale of 20k for Sarah"). This intent is for adding NEW records, so it usually contains transaction details like customerName, item/description, and amount.
2. "check_debt": Querying who owes or totals.
3. "update_record": Updating an existing debt (payments, date changes, or name corrections). IMPORTANT: If the user says "Change [Old Name] to [New Name]", use this intent and fill both customerName (old) and newName.
4. "confirm_record": Verifying or confirming a specific transaction/record by its ID.
5. "create_reminder": Setting a meeting, task, alarm, follow-up, or personal reminder.
6. "snooze_reminder": When a user asks to "wait", "delay", "shift", or "remind me later".
7. "check_schedule": When the user asks about their plans for today/tomorrow.
8. "support": Complaints, help requests, or reporting bugs. Use this if the merchant is unhappy or stuck.
9. "upgrade": Asking how to upgrade or change plans.
10. "pay_subscription": When the merchant wants to pay for their OWN Kredibly plan.
11. "check_billing": Asking about their plan status or billing date.
12. "draft_invoice": Generate a payment link message to copy/forward for an EXISTING recorded sale/invoice. Use this ONLY if the user asks to "send the invoice link", "get the payment link", or "draft the invoice" for an already recorded transaction/debt without providing new transaction details like amount/item.
13. "draft_reminder": Draft a debt reminder message to forward to the customer for an EXISTING recorded unpaid transaction/debt.
    - When drafting a message for a customer (intents: draft_invoice, draft_reminder), ALWAYS start the draft part with the marker: "📝 Draft for [Name]:".
    - This allows the system to split the draft into its own WhatsApp bubble for easy forwarding.
14. "add_staff": Add a new staff member by providing a phone number.
15. "check_staff": Query current staff list.
16. "delete_sale": When the user wants to remove or delete a sale record or invoice.
17. "delete_reminder": When the user wants to remove, cancel, or delete a scheduled reminder (task, meeting, debt follow-up).
18. "general_chat": Greetings, math, business advice, casual talk, or when requesting clarification from the user.
19. "set_preferred_name": When the user asks to be called a specific name (e.g., "From now call me Papa").
20. "feedback": New feature ideas, roadmap suggestions, or constructive UX feedback. 
21. "delete_feedback": When the user says "cancel my idea", "delete my suggestion", or "I changed my mind about that feedback".
22. "list_sales": When the user asks for "all sales", "show me everything", "history", "what I sold today", or "everything recorded". 
23. "check_performance": When the user asks "how much did I make today?", "any payments today?", "daily summary", "what is my today revenue?".
24. "confirm_session": User is confirming the action in the Active Session.
25. "reject_session": User is rejecting the action in the Active Session.
26. "set_language": If a user asks to change language, reply that Kreddy only communicates in standard English and that no language changes are needed.

CONFIRMATION & SESSION HANDLING (CRITICAL):
- If there is an "Active Session" in the context (e.g., Kreddy just asked a Yes/No question or suggested a match), prioritize responding to that session.
- If the user is giving a positive confirmation (e.g., "Yes", "Correct", "Go ahead", "That's him", "Update it") for the active session, use the "confirm_session" intent.
- If the user is rejecting or saying "No" (e.g., "No", "Wrong person", "Stop", "Don't save"), use the "reject_session" intent.
- If the user provides a Name or Invoice Number and the session is "manual_alias_tagging", interpret this as identifying the record for that payment.
- If the user's message is a completely new instruction (e.g., "Remind me to call Kola" while in a payment session), ignore the session and process the new intent normally.

REQUIRED JSON OUTPUT:
{
  "intent": "...",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "newName": "Corrected Name (if user is fixing a spelling)",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "items": [
      {
        "name": "Item name/description (e.g. 'Nike Prado')",
        "quantity": 1,
        "unitPrice": 0
      }
    ],
    "reminderDate": "ISO Timestamp in UTC",
    "dueDate": "ISO Timestamp in UTC (For sales)",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "taskDescription": "Extract the specific activity. MUST NOT BE EMPTY for create_reminder.",
    "preferredName": "Desired name if the user is setting their preference (set_preferred_name intent).",
    "sourceAccountName": "The name of the sender found on a bank receipt/screenshot (Olu, XYZ LTD, etc).",
    "bankReference": "The transfer memo/remark found on the bank receipt.",
    "documentType": "bill_invoice" | "general",
    "method": "card" | "transfer",
    "plan": "oga" | "chairman",
    "reply": "Your contextual, human-like reaction to the task. RELATE TO THE SPECIFIC TASK, AMOUNT, OR PERSON. Use varied vocabulary (No 'Logged' or 'Recorded')."
  }
}

VISION RULES (CRITICAL FOR IMAGE PROCESSING):
- Bank Slip / Transfer Receipt (Bank Logo, "Successful", "Sender", "Recipient"):
  * If the image is a bank payment receipt/transfer confirmation or transfer screenshot, DO NOT process it as a sale.
  * Set intent to "general_chat".
  * Set "reply" to: "I can only read paper invoices and store receipts to create invoice records. I do not support bank transfer slips or payment receipts. Please record the payment manually or type the update directly."
- Store Receipt/Invoice (List of items, total, paper, hand-written invoice):
  * Intent MUST BE "create_sale".
  * Extract "customerName", "totalAmount", and "item".
  * Set documentType to "bill_invoice".

Example 1: "Activate my chairman trial via transfer"
Output: { "intent": "pay_subscription", "data": { "plan": "chairman", "method": "transfer", "reply": "Excellent! I'll generate the ₦500 transfer link for your trial now! 🛡️" } }

Example 2: "I want to pay for oga with my card"
Output: { "intent": "pay_subscription", "data": { "plan": "oga", "method": "card", "reply": "Perfect! I'll generate the secure card link for the Oga plan now. 🚀" } }

Example 1: "SARAH PAID 5K AND REMIND ME TO CALL HER NEXT WEDNESDAY"
Output: [
  { "intent": "update_record", "data": { "customerName": "Sarah", "paidAmount": 5000, "reply": "Logged! Sarah's ₦5,000 payment recorded." } },
  { "intent": "create_reminder", "data": { "reminderDate": "2026-03-30T08:00:00.000Z", "reminderType": "debt", "taskDescription": "Follow up with Sarah for balance", "reply": "I'll remind you to call Sarah for the balance next Wednesday! 📞" } }
]

Example 3 (Performance): "HOW MUCH DID I MAKE YESTERDAY?"
Output: { "intent": "check_performance", "data": { "targetDate": "yesterday", "reply": "Let me check the ledger for yesterday's wins! 📊" } }

REQUIRED JSON OUTPUT:
{
  "intent": "...",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "newName": "Corrected Name (if user is fixing a spelling)",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "items": [
      {
        "name": "Item name/description (e.g. 'Nike Prado')",
        "quantity": 1,
        "unitPrice": 0
      }
    ],
    "reminderDate": "ISO Timestamp in UTC",
    "dueDate": "ISO Timestamp in UTC (For sales)",
    "targetDate": "yesterday" | "today" | "ISO Date String",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "taskDescription": "Extract the specific activity. MUST NOT BE EMPTY for create_reminder.",
    "preferredName": "Desired name if the user is setting their preference (set_preferred_name intent).",
    "sourceAccountName": "The specific name of the sender found on a bank receipt/screenshot (Olu, XYZ LTD, etc).",
    "bankReference": "The transfer memo/remark found on the bank receipt (e.g., 'For Shoe', 'Sarah Payment').",
    "documentType": "bank_transfer" | "bill_invoice" | "general",
    "method": "card" | "transfer",
    "plan": "oga" | "chairman",
    "transcription": "The raw text understood from the user's voice/message/image. MUST be included for voice and image processing.",
    "reply": "Your contextual, human-like reaction to the task. RELATE TO THE SPECIFIC TASK, AMOUNT, OR PERSON. Use varied vocabulary (No 'Logged' or 'Recorded')."
  }
}
`;

/**
 * CORE AI PROCESSOR
 */
const processMessageWithAI = async (text, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    const plan = context.plan || "hustler";
    
    // Model Selection Strategy:
    // FLASH is primary now (15 RPM) to ensure the user ALWAYS gets a smart response.
    // PRO is secondary for deep reasoning/fallback.
    let primaryModel = MODELS.FLASH;
    let secondaryModel = MODELS.PRO;

    const tryAIGeneration = async (modelName) => {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            // Generate WAT time (UTC+1) for Nigerian merchants
            const now = new Date();
            const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
            const watISO = watTime.toISOString().replace('Z', '+01:00');

            const prompt = `
            Context:
            - Merchant: ${context.merchantName || 'User'}
            - Plan: ${plan.toUpperCase()}
            - Tone: ${context.preferredTone || 'FRIENDLY'}
            - Preferred Language: ${context.preferredLanguage || 'english'}
            - Days Since Last Active: ${context.daysSinceLastActive || 0}
            - Minutes Since Last Message: ${context.minutesSinceLastMessage ?? 9999}
            - Debtors: ${context.debtors || 'None'}
            - Active Reminders: ${context.activeReminders || 'None'}
            - Active Session: ${context.currentSession ? JSON.stringify(context.currentSession) : 'None'}
            - Business Insight: ${context.businessInsight || 'New Merchant'}
            - Current Time (WAT, UTC+1): ${watISO}

            Instruction: ${SYSTEM_INSTRUCTION}
            
            User Message: "${text}"
            `;

            console.log(`🤖 Kreddy calling AI model: ${modelName} for ${plan}...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text();

            textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            
            let parsed;
            try {
                parsed = JSON.parse(textResponse);
            } catch (e) {
                // Try to extract JSON object OR array from the response
                const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
                const objectMatch = textResponse.match(/\{[\s\S]*\}/);
                
                if (arrayMatch) {
                    try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) { /* fall through */ }
                }
                if (!parsed && objectMatch) {
                    try { parsed = JSON.parse(objectMatch[0]); } catch (e2) { /* fall through */ }
                }
                if (!parsed) {
                    console.error(`❌ AI JSON Parse Error. Raw response:`, textResponse.substring(0, 500));
                    throw new Error("JSON Parse Error");
                }
            }
            
            console.log(`✅ AI parsed successfully: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
            logUsage(modelName === MODELS.PRO ? "ai_pro" : "ai").catch(() => {});
            return parsed;
        } catch (error) {
            console.error(`❌ AI Generation Error (${modelName}):`, error.message);
            
            // If it's a rate limit or server error, return signal to try fallback model
            if (error.message?.includes("429") || error.status === 429 || error.message?.includes("500") || error.message?.includes("safety")) {
                return { isFallbackSignal: true };
            }
            throw error;
        }
    };

    try {
        // Attempt Primary Model
        let result = await tryAIGeneration(primaryModel);

        // If Primary (Pro) is rate-limited, try Secondary (Flash)
        if (result?.isFallbackSignal && secondaryModel) {
            console.warn(`⚠️ Primary Model (${primaryModel}) limited. Falling back to ${secondaryModel}...`);
            result = await tryAIGeneration(secondaryModel);
        }

        // Final Fallback Signal for Controller
        if (result?.isFallbackSignal) {
            return { isFallback: true };
        }

        return result;
    } catch (error) {
        console.error("Kreddy AI Pipeline Error:", error.message);
        return { isFallback: true };
    }
};

/**
 * VOICE PROCESSING (Oga & Chairman)
 */
const processAudioWithAI = async (audioBuffer, mimeType, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    try {
        const plan = context.plan || "hustler";
        const model = genAI.getGenerativeModel({ 
            model: MODELS.FLASH,
            generationConfig: { responseMimeType: "application/json" }
        });

        // Generate WAT time (UTC+1) for Nigerian merchants
        const now = new Date();
        const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const watISO = watTime.toISOString().replace('Z', '+01:00');

        const prompt = `
        Context:
        - Merchant: ${context.merchantName || 'User'}
        - Plan: ${plan.toUpperCase()}
        - Tone: ${context.preferredTone || 'FRIENDLY'}
        - Preferred Language: ${context.preferredLanguage || 'english'}
        - Days Since Last Active: ${context.daysSinceLastActive || 0}
        - Debtors: ${context.debtors || 'None'}
        - Active Reminders: ${context.activeReminders || 'None'}
        - Business Insight: ${context.businessInsight || 'New Merchant'}
        - Current Time (WAT, UTC+1): ${watISO}

        ${SYSTEM_INSTRUCTION}
        
        Task: Listen to this voice note carefully and extract ALL intents (sales, reminders, payments, questions, etc). The user may mention multiple tasks in one voice note.
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
        
        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (e) {
            const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
            const objectMatch = textResponse.match(/\{[\s\S]*\}/);
            if (arrayMatch) try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) {}
            if (!parsed && objectMatch) try { parsed = JSON.parse(objectMatch[0]); } catch (e2) {}
            if (!parsed) {
                console.error(`❌ Voice AI JSON Parse Error. Raw:`, textResponse.substring(0, 500));
                return null;
            }
        }

        console.log(`✅ Voice AI parsed: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
        logUsage("ai_multimodal").catch(() => {});
        return parsed;
    } catch (error) {
        console.error("Kreddy Voice AI Error:", error.message);
        return null;
    }
};

/**
 * IMAGE PROCESSING (Chairman Exclusive)
 */
const processImageWithAI = async (imageBuffer, mimeType, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    try {
        const plan = context.plan || "hustler";
        const model = genAI.getGenerativeModel({ 
            model: MODELS.FLASH,
            generationConfig: { responseMimeType: "application/json" }
        });

        // Generate WAT time (UTC+1)
        const now = new Date();
        const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const watISO = watTime.toISOString().replace('Z', '+01:00');

        const prompt = `
        Context:
        - Merchant: ${context.merchantName || 'User'}
        - Plan: ${plan.toUpperCase()}
        - Tone: ${context.preferredTone || 'FRIENDLY'}
        - Preferred Language: ${context.preferredLanguage || 'english'}
        - Days Since Last Active: ${context.daysSinceLastActive || 0}
        - Debtors: ${context.debtors || 'None'}
        - Business Insight: ${context.businessInsight || 'New Merchant'}
        - Caption/Note attached to image: ${context.caption || 'None'}
        - Current Time (WAT, UTC+1): ${watISO}

        ${SYSTEM_INSTRUCTION}
        
        Task: Analyze this image (receipt, invoice, screenshot, etc.) and extract ALL relevant transaction details. If it's a receipt, extract amounts, items, and customer info. If the user provided a caption/note, USE IT to guide your extraction (e.g. if they say "record this for Shade", attribute the payment to Shade regardless of the name on the receipt).
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        let textResponse = response.text();
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (e) {
            const arrayMatch = textResponse.match(/\[[\s\S]*\]/);
            const objectMatch = textResponse.match(/\{[\s\S]*\}/);
            if (arrayMatch) try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) {}
            if (!parsed && objectMatch) try { parsed = JSON.parse(objectMatch[0]); } catch (e2) {}
            if (!parsed) {
                console.error(`❌ Image AI JSON Parse Error. Raw:`, textResponse.substring(0, 500));
                return null;
            }
        }

        console.log(`✅ Image AI parsed: ${Array.isArray(parsed) ? `Array of ${parsed.length} intents` : `Intent: ${parsed.intent}`}`);
        logUsage("ai_multimodal").catch(() => {});
        return parsed;
    } catch (error) {
        console.error("Kreddy Image AI Error:", error.message);
        return null;
    }
};

/**
 * MODE B Assistant: Generate a proactive "Growth Coach" nudge for inactive users.
 */
const generateMorningNudge = async (context = {}) => {
    if (!process.env.KREDDY_API_KEY) return `Good morning, ${context.bossTitle}! Ready for another productive day? Let us track some sales!`;

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });
        const prompt = `
        You are Kreddy, a professional business assistant and growth coach.
        Merchant Name: ${context.bossTitle}
        Plan: ${context.plan}
        Outstanding Debts: ${context.debtContext}
        Last Activity: ${context.lastSummaryDate || "Never"}

        Today is a fresh start and the merchant had zero recorded activity yesterday.
        Task: Write a short, motivating 8:00 AM WhatsApp nudge to encourage them to use Kreddy today.
        Rules:
        1. Use STRICTLY standard English only. ABSOLUTELY NO Pidgin, Creole, or slang.
        2. Start with a professional greeting.
        3. Remind them of ONE specific Kreddy benefit (e.g. tracking credit, voice note recording, professional invoices).
        4. If they have debts, mention that today is a great day to follow up on them.
        5. Keep it under 60 words. You may use one or two relevant emojis.
        6. Tone: Professional, motivating, and warm.
        
        Example: "Good morning, ${context.bossTitle}! A fresh day to grow your business. I am here to help you track every sale and follow up on outstanding debts. Just type or record what you sold today! 🚀"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Coach Nudge AI Error:", error);
        return `Good morning, ${context.bossTitle}! Every day is a new chance to grow your business. Log a sale today and keep your records on track!`;
    }
};

/**
 * DYNAMIC VIBE ENGINE: Generate a short, contextual intro for a WhatsApp message.
 */
const generateWittyIntro = async (intent, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return "Got it, Chief! 🫡";

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });
        const now = new Date();
        const hour = (now.getHours() + 1) % 24; // WAT
        const timeOfDay = hour < 12 ? "Morning" : (hour < 17 ? "Afternoon" : "Evening");

        const prompt = `
        You are Kreddy, a professional business assistant.
        Merchant: ${context.bossTitle || "Boss"}
        Time: ${timeOfDay}
        Intent: ${intent}
        Context Details: ${context.extra || "General"}

        Task: Write a ONE-SENTENCE (max 15 words) contextual intro/reaction to this intent.
        Rules:
        1. Use STRICTLY standard English only. NO Pidgin, Creole, or slang (e.g., NO "Oshey", "Na", "Sharp", "Chai", "Oga", "wahala").
        2. Be professional yet warm and encouraging.
        3. DO NOT be repetitive.
        4. Match the time of day.
        5. Focus on the user's win or the business priority.
        6. DO NOT use generic phrases like "I am an AI".
        
        Example for 'check_debt': "Let's check those outstanding balances for you right away."
        Example for 'create_sale': "Great work, ${context.bossTitle}! Adding this sale to your records now."
        Example for 'list_sales': "Pulling up your sales history — let's see what you've done!"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        return "Acknowledged, Chief! 🫡";
    }
};

module.exports = { processMessageWithAI, processAudioWithAI, processImageWithAI, generateMorningNudge, generateWittyIntro };
