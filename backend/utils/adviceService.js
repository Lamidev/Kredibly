const { GoogleGenerativeAI } = require("@google/generative-ai");
const SystemConfig = require("../models/SystemConfig");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

/**
 * Generate a high-value, long-form Daily Business Masterclass using Gemini 2.5 Pro.
 */
const generateDailyAdvice = async (tone = "English") => {
    try {
        console.log(`🧠 Kreddy Brain: Generating daily business advice...`);

        const toneInstruction = "Use professional and clear Standard English only. DO NOT use Pidgin or slang. Focus on clarity and authority.";

        const dayOfWeek = new Date().getDay(); // 0 (Sun) to 6 (Sat)
        const themes = [
            "Customer Relationship Management & Follow-ups (Sunday Reflection)", // 0
            "Operational Efficiency & Inventory Velocity (Monday Motivation)", // 1
            "Strategic Sales & Referral Engines (Tuesday Growth)", // 2
            "Marketing & Brand Trust in the Nigerian Market (Wednesday Wisdom)", // 3
            "Cashflow, Liquidity, and Debt Collection Mastery (Thursday Finance)", // 4
            "Customer Loyalty & Retention Strategies (Friday Focus)", // 5
            "Planning, Auditing, and Stock Management (Saturday Setup)" // 6
        ];
        const selectedTheme = themes[dayOfWeek];

        const prompt = `
        Kreddy, act as a High-Level Nigerian Business Growth Coach.
        Today's Date: ${new Date().toDateString()}
        Today's Theme Focus: ${selectedTheme}
        
        Task: Write a short, powerful growth coaching message for a Nigerian merchant to start their day.
        Tone: ${toneInstruction}
        
        Rules:
        1. Write naturally and professionally in clean paragraphs.
        2. NO BLOCKY AI HEADERS. Do NOT use headers like "*THE BIG INSIGHT:*" or "*ACTION STEP:*".
        3. NO EMOJIS. Keep the text clean, structured, and professional.
        4. NO BULLET POINTS or hashtags. 
        5. Focus on ${selectedTheme}. Give ONE clear, street-smart thing they should do today to grow.
        6. Keep it conversational, empathetic, and street-smart. Relate it to the Nigerian market (e.g. mention things like "gain", "market", "customers", "record").
        7. Avoid repeating common advice like "Cashflow is King" every day. Be specific about ${selectedTheme}.
        8. Length: 2 small paragraphs maximum (around 80-120 words). Short, punchy, and highly readable.
        9. Use mild bolding (*like this*) only for 1 or 2 key words of emphasis.
        10. DO NOT start with generic greetings like "Here is your tip" or "Good morning". Dive straight into the coaching.
        `;
        
        let advice;
        try {
            // Priority 1: Use Flash model
            const flashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await flashModel.generateContent(prompt);
            advice = result.response.text().trim();
        } catch (flashErr) {
            console.warn("⚠️ Gemini Flash Busy/Failed, trying Pro model:", flashErr.message);
            // Priority 2: Use Pro if Flash fails
            const proModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await proModel.generateContent(prompt);
            advice = result.response.text().trim();
        }

        const cleanedAdvice = cleanAIArtifacts(advice);

        const config = await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: { adviceText: cleanedAdvice, tone },
                status: "pending",
                lastGenerated: new Date(),
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        console.log("✅ Daily advice drafted and saved successfully.");
        return cleanedAdvice;
    } catch (err) {
        console.error("❌ Critical AI Advice Failure:", err.message);
        
        const fallbacks = [
            `Cashflow is king. Profit is just paper, but cash pays the bills and restocks your shelves. Make sure to record every kobo that enters your business today.\n\nTake two minutes to log your transactions in Kredibly so your records stay accurate.`,
            `Consistency wins in business. Keeping your books balanced every single day gives you total clarity over your margins and who owes you.\n\nReview your outstanding customer balances today and follow up early.`,
            `Customer retention is far cheaper than finding new buyers. Prompt service and transparent billing turn first-time buyers into lifelong clients.\n\nConsider sending a polite follow-up or check-in to your recent customers today.`
        ];

        const fallbackValue = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        // Save the fallback so the UI stays in sync even during errors
        await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: { adviceText: fallbackValue, tone },
                status: "pending",
                lastGenerated: new Date(),
                lastUpdated: new Date()
            },
            { upsert: true }
        );

        return fallbackValue;
    }
};

/**
 * RETRIEVE THE LATEST SAVED ADVICE (For Dispatches)
 * This is the "Truth" for both 8am Auto and Manual Send.
 */
const getDailyAdvice = async () => {
    try {
        const config = await SystemConfig.findOne({ key: "daily_advice" });
        if (!config || !config.value?.adviceText) {
            return "Cashflow is the lifeblood of your business. Stay on top of your daily sales and outstanding receivables to keep operations smooth.";
        }
        return cleanAIArtifacts(config.value.adviceText);
    } catch (e) {
        return "Consistency and prompt debt recovery are key to scaling your business.";
    }
};

/**
 * AI JANITOR: Strips annoying AI symbols, blocky prefixes, and emojis
 * Ensures the growth message looks human-vetted and executive.
 */
const cleanAIArtifacts = (text) => {
    if (!text) return "";
    return text
        // Strip emojis
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}]/gu, '')
        .replace(/^\s*[-•]\s*/gm, '')     // Remove lone bullet points at start of lines
        .replace(/#{1,3}/g, '')           // Remove hashtags
        .replace(/[-_]{2,}/g, '')         // Remove multiple hyphens/underscores
        .replace(/^"|"$/g, '')            // Remove outer quotes
        .replace(/^(Certainly!|Here is a tip|Good morning,|Sure!|Alright,|Here is a business tip:)/gi, '') // Remove AI chatter
        .replace(/\n{3,}/g, '\n\n')       // Normalize multiple newlines
        .trim();
};

module.exports = { generateDailyAdvice, getDailyAdvice };
