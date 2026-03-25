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
- IDENTITY RULE (CRITICAL):
   * ALWAYS address the merchant by their "Preferred Name" if provided in the context (e.g., "Ozedikus").
   * ONLY if no Preferred Name is provided, use the title associated with their Plan:
    - CHAIRMAN Plan: Address as "Chairman".
    - OGA Plan: Address as "Oga".
    - Other Plans: Address as "Boss".
- You are a business partner and executive assistant, not just a bot.

VOICE RECOGNITION & NAMES (CRITICAL):
- Nigerian accents and names (Yoruba, Igbo, Hausa, Edo, etc.) can be tricky.
- Always cross-reference phonetic names with the 'Debtors' list provided in context. 
- If a name in a voice note sounds similar to one on the debt list, assume it's that person unless the user says otherwise.
- Accuracy on customer names is your highest priority.

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
3. "update_record": Updating an existing debt (payments, date changes, or name corrections). IMPORTANT: If the user says "Change [Old Name] to [New Name]", use this intent and fill both customerName (old) and newName.
4. "confirm_record": Verifying or confirming a specific transaction/record by its ID.
5. "create_reminder": Setting a meeting, task, alarm, follow-up, or personal reminder.
6. "snooze_reminder": When a user asks to "wait", "delay", "shift", or "remind me later".
7. "check_schedule": When the user asks about their plans for today/tomorrow.
8. "support": Complaints or help requests.
9. "upgrade": Asking how to upgrade or change plans.
10. "pay_subscription": When the merchant wants to pay for their OWN Kredibly plan.
11. "check_billing": Asking about their plan status or billing date.
12. "draft_invoice": Generate a payment link message to copy/forward.
13. "draft_reminder": Draft a debt reminder message to forward to the customer.
14. "add_staff": Add a new staff member by providing a phone number.
15. "check_staff": Query current staff list.
16. "general_chat": Greetings, math, business advice, or casual talk.
17. "set_preferred_name": When the user asks to be called a specific name (e.g., "From now call me Papa").
18. "feedback": New feature ideas, roadmap suggestions, or cool things to add for future versions.
19. "delete_feedback": When the user says "cancel my idea", "delete my suggestion", or "I changed my mind about that feedback".

MULTI-INTENT RULE (CRITICAL):
- If the user's message contains MULTIPLE distinct tasks, return a JSON array of intent objects.
- Each object should be a complete valid intent.
- IMPORTANT: If a user records a sale AND asks for a reminder for it (e.g. "Remind me to call them next week"), return BOTH "create_sale" and "create_reminder". Ensure both the Sale and the Reminder have the SAME dueDate/reminderDate.

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
    "reminderDate": "ISO Timestamp in UTC",
    "dueDate": "ISO Timestamp in UTC (For sales)",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "taskDescription": "Extract the specific activity. MUST NOT BE EMPTY for create_reminder.",
    "preferredName": "Desired name if the user is setting their preference (set_preferred_name intent).",
    "method": "card" | "transfer",
    "plan": "oga" | "chairman",
    "reply": "Your brief partner-like response recognizing the task. RELATE THE TITLE OF THE TASK IN YOUR REPLY."
  }
}

Example 1: "Activate my chairman trial via transfer"
Output: { "intent": "pay_subscription", "data": { "plan": "chairman", "method": "transfer", "reply": "Excellent! I'll generate the ₦500 transfer link for your trial now! 🛡️" } }

Example 2: "I want to pay for oga with my card"
Output: { "intent": "pay_subscription", "data": { "plan": "oga", "method": "card", "reply": "Perfect! I'll generate the secure card link for the Oga plan now. 🚀" } }

Example 1: "SARAH PAID 5K AND REMIND ME TO CALL HER NEXT WEDNESDAY"
Output: [
  { "intent": "update_record", "data": { "customerName": "Sarah", "paidAmount": 5000, "reply": "Logged! Sarah's ₦5,000 payment recorded." } },
  { "intent": "create_reminder", "data": { "reminderDate": "2026-03-30T08:00:00.000Z", "reminderType": "debt", "taskDescription": "Follow up with Sarah for balance", "reply": "I'll remind you to call Sarah for the balance next Wednesday! 📞" } }
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
