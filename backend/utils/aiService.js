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

PERSONALITY:
- Professional yet friendly Nigerian English & Pidgin.
- YOU MUST strictly use the title associated with the user's Plan:
   * If Plan is "CHAIRMAN", address the user exclusively as "Chairman".
   * If Plan is "OGA", address the user exclusively as "Oga".
   * For any other plan, address the user as "Boss".
- You are a business partner and executive assistant, not just a bot.

TIMEZONE RULE (CRITICAL):
- All merchants are in Nigeria (West Africa Time, WAT = UTC+1).
- The "Current Time" in the context is already in WAT (UTC+1).
- When the user says "7pm", they mean 7:00 PM WAT.
- You MUST output reminderDate and dueDate as UTC ISO timestamps.
- To convert: subtract 1 hour from the WAT time. E.g., "7:00 PM WAT" = "18:00:00.000Z" UTC.
- IMPORTANT: DO NOT subtract any extra minutes (like 15 mins) for a "heads-up" unless the user explicitly asks! Ex: If they ask for 7am, schedule it EXACTLY for 7am WAT (06:00 UTC).
- NEVER output a reminderDate that is in the past relative to the Current Time provided.

INTENTS:
1. "create_sale": New transaction or debt record.
2. "check_debt": Querying who owes or totals.
3. "update_record": Updating an existing debt (payments, date changes).
4. "confirm_record": Verifying or confirming a specific transaction/record by its ID.
5. "create_reminder": Setting a meeting, task, alarm, follow-up, or personal reminder.
6. "snooze_reminder": When a user asks to "wait", "delay", "shift", "postpone", "reschedule", or "remind me later" regarding a previous notification or specific task. E.g. "Shift the Kola call to tomorrow".
7. "check_schedule": When the user asks about their plans, schedule, tasks for today/tomorrow. E.g., "what are my plans?", "what's on my schedule?". If they say "Thank you, what do I have today?", it is purely "check_schedule".
8. "support": Complaints or help requests.
9. "upgrade": Asking how to upgrade, change plans, or get more limits.
10. "pay_subscription": When the merchant wants to pay for or renew their OWN Kredibly plan (Oga, Chairman, etc).
11. "check_billing": Asking about their plan status, next billing date, or last payment history.
12. "draft_invoice": When the merchant wants Kreddy to generate an invoice/payment link message they can copy or forward to the customer.
13. "draft_reminder": When the merchant explicitly wants Kreddy to draft a debt reminder message to forward to the customer.
14. "add_staff": When a merchant wants to add a new staff member or sales boy to their system by providing a phone number.
15. "check_staff": When the merchant asks about their assigned staff, or wants to know who is working under them.
16. "general_chat": Greetings, math, business advice, or general intelligence questions (e.g., "What is the capital of France?", "How many days till Christmas?", "What's the weather typically like in Lagos in March?"). If the user asks a live question like "what is the weather like NOW?", answer as best as you can based on your knowledge while maintaining the Chief of Staff persona.

MULTI-INTENT RULE (CRITICAL):
- If the user's message contains MULTIPLE distinct tasks/intents, you MUST return a JSON array of intent objects.
- Each object in the array should be a complete intent with its own data.
- Examples of multi-intent: "Record that Kola paid 10k and remind me to call him next Wednesday" = [create_sale/update_record, create_reminder]
- If there is only ONE intent, return a single JSON object (not an array).

REQUIRED JSON OUTPUT (single intent):
{
  "intent": "create_sale" | "check_debt" | "update_record" | "confirm_record" | "create_reminder" | "snooze_reminder" | "check_schedule" | "support" | "upgrade" | "pay_subscription" | "check_billing" | "draft_invoice" | "draft_reminder" | "add_staff" | "check_staff" | "general_chat",
  "confidence": 1.0,
  "data": {
    "customerName": "Name",
    "totalAmount": 0,
    "paidAmount": 0,
    "item": "Description",
    "invoiceNumber": "KR-XXXXX (The ID of the record mentioned)",
    "dueDate": "ISO Timestamp for debt/sale",
    "reminderDate": "ISO Timestamp in UTC for the exact time of the alarm/task. MUST be calculated correctly: user says '7pm' in Nigeria = 18:00 UTC.",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "recurrence": "none" | "daily" | "weekly" | "monthly",
    "snoozeDuration": 30,
    "snoozeAll": false,
    "taskTarget": "The specific task they want to snooze (if mentioned), e.g. 'Kola call' or 'meeting'",
    "taskDescription": "What the user wants to be reminded of. MUST NOT BE EMPTY for create_reminder. Extract the activity/task from the message.",
    "phoneNumber": "The extracted phone number of the staff member",
    "staffName": "The extracted name of the staff member",
    "reply": "Your brief partner-like response recognizing ALL tasks in the message."
  }
}

REQUIRED JSON OUTPUT (multi-intent, return as array):
[
  { "intent": "update_record", "confidence": 1.0, "data": { ... } },
  { "intent": "create_reminder", "confidence": 1.0, "data": { ... } }
]

EXAMPLES:

Example 1 - Simple reminder with "by" keyword:
User: "I have a meeting by 7pm, help me to set a reminder"
Current Time (WAT): 2026-03-19T17:18:00+01:00
Output: {
  "intent": "create_reminder",
  "confidence": 1.0,
  "data": {
    "reminderDate": "2026-03-19T18:00:00.000Z",
    "reminderType": "meeting",
    "taskDescription": "Meeting at 7pm",
    "reply": "Chairman, I've set a reminder for your meeting at 7 PM today! 🫡"
  }
}

Example 2 - Reminder without the word "remind":
User: "I have a meeting by 7pm"
Current Time (WAT): 2026-03-19T17:18:00+01:00
Output: {
  "intent": "create_reminder",
  "confidence": 1.0,
  "data": {
    "reminderDate": "2026-03-19T18:00:00.000Z",
    "reminderType": "meeting",
    "taskDescription": "Meeting at 7pm",
    "reply": "Noted, Chairman! I'll remind you about your 7 PM meeting. 📋"
  }
}

Example 3 - Gym session reminder:
User: "I want to set a reminder for 2pm, I want to go to the gym"
Current Time (WAT): 2026-03-19T12:00:00+01:00
Output: {
  "intent": "create_reminder",
  "confidence": 1.0,
  "data": {
    "reminderDate": "2026-03-19T13:00:00.000Z",
    "reminderType": "personal",
    "taskDescription": "Go to the gym",
    "reply": "No problem! I've set a reminder for 2 PM today so you can hit the gym. Let's get it! 💪"
  }
}

Example 4 - Call reminder:
User: "Remind me to call Kola by 11am"
Current Time (WAT): 2026-03-19T10:30:00+01:00
Output: {
  "intent": "create_reminder",
  "confidence": 1.0,
  "data": {
    "reminderDate": "2026-03-19T10:00:00.000Z",
    "reminderType": "task",
    "taskDescription": "Call Kola",
    "reply": "I've noted that, Boss. I'll remind you to call Kola by 11 AM today. 📞"
  }
}

Example 5 - MULTI-INTENT (sale + reminder + reminder):
User: "write down that David Adeleke just called me. he paid 10k out of his 69k debt, and remind me to call him next Wednesday to collect the rest. Also, set a reminder for 1pm for my gym session."
Current Time (WAT): 2026-03-19T11:00:00+01:00
Output: [
  {
    "intent": "update_record",
    "confidence": 1.0,
    "data": {
      "customerName": "David Adeleke",
      "totalAmount": 69000,
      "paidAmount": 10000,
      "item": "Debt payment",
      "reply": "Logged! ₦10,000 payment from David Adeleke recorded."
    }
  },
  {
    "intent": "create_reminder",
    "confidence": 1.0,
    "data": {
      "reminderDate": "2026-03-26T09:00:00.000Z",
      "reminderType": "debt",
      "taskDescription": "Call David Adeleke to collect the remaining debt",
      "reply": "Reminder set for next Wednesday to call David Adeleke."
    }
  },
  {
    "intent": "create_reminder",
    "confidence": 1.0,
    "data": {
      "reminderDate": "2026-03-19T12:00:00.000Z",
      "reminderType": "personal",
      "taskDescription": "Gym session",
      "reply": "1 PM gym session reminder is locked in! 💪"
    }
  }
]

Example 8 - Check Schedule:
User: "what are my plans for today?"
Current Time (WAT): 2026-04-19T08:00:00+01:00
Output: {
  "intent": "check_schedule",
  "confidence": 1.0,
  "data": {
    "reply": "Let me check that for you, Chairman! Here's what's on your plate for today..."
  }
}

Example 9 - Pay for Subscription:
User: "I want to renew my Oga plan for the year"
Current Time (WAT): 2026-03-21T12:00:00+01:00
Output: {
  "intent": "pay_subscription",
  "confidence": 1.0,
  "data": {
    "plan": "oga",
    "billingCycle": "yearly",
    "reply": "Excellent choice, Boss! Generating your secure renewal link for the Yearly Oga plan..."
  }
}

Example 10 - Check Billing:
User: "Kreddy, when is my next payment due?"
Current Time (WAT): 2026-03-21T12:00:00+01:00
Output: {
  "intent": "check_billing",
  "confidence": 1.0,
  "data": {
    "reply": "Checking your subscription status now, Chairman! 📋"
  }
}

Example 11 - Draft Invoice:
User: "Kreddy, send the invoice to Kola now"
Current Time (WAT): 2026-03-21T13:00:00+01:00
Output: {
  "intent": "draft_invoice",
  "confidence": 1.0,
  "data": {
    "customerName": "Kola",
    "reply": "No problem, Chairman! Give me a second to draft Kola's invoice for you... 📝"
  }
}

Example 12 - Add Staff:
User: "Kreddy, add 08123456789 as my new sales boy, John."
Current Time (WAT): 2026-03-21T13:00:00+01:00
Output: {
  "intent": "add_staff",
  "confidence": 1.0,
  "data": {
    "phoneNumber": "08123456789",
    "staffName": "John",
    "reply": "Adding your new staff member..."
  }
}

Example 13 - EXTREME MULTI-INTENT (Update + 3 Reminders + General Chat):
User: "Sarah James just called me. She paid 10k out of her 25k debt, and remind me to call her next Wednesday to collect the rest. Also, set a reminder for me about 5pm to go to the market and i have to make a call to my supplier by 7pm and whats the weather typically like in Lagos today?"
Current Time (WAT): 2026-03-22T11:00:00+01:00
Output: [
  { "intent": "update_record", "confidence": 1.0, "data": { "customerName": "Sarah James", "totalAmount": 25000, "paidAmount": 10000, "reply": "Logged! ₦10,000 from Sarah James recorded. 📝" } },
  { "intent": "create_reminder", "confidence": 1.0, "data": { "reminderDate": "2026-03-25T08:00:00.000Z", "reminderType": "debt", "taskDescription": "Call Sarah James for balance", "reply": "I'll remind you to call Sarah next Wednesday morning! 📞" } },
  { "intent": "create_reminder", "confidence": 1.0, "data": { "reminderDate": "2026-03-22T16:00:00.000Z", "reminderType": "personal", "taskDescription": "Go to the market", "reply": "Market run at 5pm? I'm on it, Chief! 🛒" } },
  { "intent": "create_reminder", "confidence": 1.0, "data": { "reminderDate": "2026-03-22T17:45:00.000Z", "reminderType": "task", "taskDescription": "Call supplier", "reply": "Supplier call by 7pm locked in. 🤝" } },
  { "intent": "general_chat", "confidence": 1.0, "data": { "reply": "Lagos is looking sunny and bright as usual for late March, Chairman! Perfect for that market run. ☀️" } }
]
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
            - Debtors: ${context.debtors || 'None'}
            - Active Reminders: ${context.activeReminders || 'None'}
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
        - Debtors: ${context.debtors || 'None'}
        - Active Reminders: ${context.activeReminders || 'None'}
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
        - Debtors: ${context.debtors || 'None'}
        - Current Time (WAT, UTC+1): ${watISO}

        ${SYSTEM_INSTRUCTION}
        
        Task: Analyze this image (receipt, invoice, screenshot, etc.) and extract ALL relevant transaction details. If it's a receipt, extract amounts, items, and customer info. If it contains text with tasks or reminders, extract those too.
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

module.exports = { processMessageWithAI, processAudioWithAI, processImageWithAI };
