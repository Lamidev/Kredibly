const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logUsage } = require("./usageTracker");

// Initialize API
const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

/**
 * MODELS EXPLAINED:
 * - gemini-1.5-flash: Ultra-fast, very high free-tier limits (15 RPM). Perfect for Beta and Oga Plan.
 * - gemini-1.5-pro: High-reasoning, heavy context. Reserved for Chairman Plan / Complex Analysis.
 */
const MODELS = {
    FLASH: "gemini-1.5-flash",
    PRO: "gemini-1.5-pro"
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

INTENTS:
1. "create_sale": New transaction or debt record.
2. "check_debt": Querying who owes or totals.
3. "update_record": Updating an existing debt (payments, date changes).
4. "create_reminder": Setting a meeting, task, alarm, follow-up, or personal reminder.
5. "snooze_reminder": When a user asks to "wait", "delay", or "remind me later" regarding a previous notification.
6. "support": Complaints or help requests.
7. "upgrade": Asking how to upgrade, change plans, or get more limits.
8. "general_chat": Greetings, math, or non-transactional talk.

REQUIRED JSON OUTPUT:
{
  "intent": "create_sale" | "check_debt" | "update_record" | "create_reminder" | "snooze_reminder" | "support" | "upgrade" | "general_chat",
  "confidence": 0.0 to 1.0,
  "data": {
    "customerName": "Name",
    "totalAmount": Number,
    "paidAmount": Number,
    "item": "Description",
    "dueDate": "ISO Timestamp for debt/sale",
    "reminderDate": "ISO Timestamp strictly for the exact time of the alarm/meeting",
    "reminderType": "debt" | "task" | "meeting" | "personal",
    "recurrence": "none" | "daily" | "weekly" | "monthly",
    "snoozeDuration": Number (minutes to delay the reminder, only for 'snooze_reminder'),
    "taskDescription": "What to remind the user about",
    "reply": "Your brief partner-like response"
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

            const prompt = `
            Context:
            - Merchant: ${context.merchantName || 'User'}
            - Plan: ${plan.toUpperCase()}
            - Tone: ${context.preferredTone || 'FRIENDLY'}
            - Debtors: ${context.debtors || 'None'}
            - Current Time: ${new Date().toISOString()}

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
                const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                else throw new Error("JSON Parse Error");
            }
            
            logUsage(modelName === MODELS.PRO ? "ai_pro" : "ai").catch(() => {});
            return parsed;
        } catch (error) {
            console.error(`❌ AI Generation Error (${modelName}):`, error.message);
            
            // If it's a rate limit or "Brain Glitch", return a specific signal to try fallback
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
 * VOICE PROCESSING (Chairman Exclusive)
 */
const processAudioWithAI = async (audioBuffer, mimeType, context = {}) => {
    if (!process.env.KREDDY_API_KEY) return null;

    try {
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH }); // Flash covers audio well

        const prompt = `
        ${SYSTEM_INSTRUCTION}
        Task: Extract transaction details from this audio.
        Merchant Context: ${context.merchantName || 'User'}
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
        
        logUsage("ai_multimodal").catch(() => {});
        return JSON.parse(textResponse);
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
        const model = genAI.getGenerativeModel({ model: MODELS.FLASH });

        const prompt = `
        ${SYSTEM_INSTRUCTION}
        Task: Extract transaction details (sale, etc) from this receipt or image.
        Merchant Context: ${context.merchantName || 'User'}
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
        
        // Handle markdown block parsing better if needed
        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (e) {
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            else throw new Error("JSON Parse Error");
        }

        logUsage("ai_multimodal").catch(() => {});
        return parsed;
    } catch (error) {
        console.error("Kreddy Image AI Error:", error.message);
        return null;
    }
};

module.exports = { processMessageWithAI, processAudioWithAI, processImageWithAI };
