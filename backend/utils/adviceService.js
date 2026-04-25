const { GoogleGenerativeAI } = require("@google/generative-ai");
const SystemConfig = require("../models/SystemConfig");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");

/**
 * Generate a high-value, long-form Daily Business Masterclass using Gemini 2.5 Pro.
 * @param {String} tone - 'English' or 'Pidgin'
 */
const generateDailyAdvice = async (tone = "English") => {
    try {
        console.log(`🧠 Kreddy Brain: Generating ${tone} business advice...`);

        const toneInstruction = tone === "Pidgin" 
            ? "Use authentic Street-Smart Nigerian Pidgin only. Be warm, energetic, and encouraging."
            : "Use professional and clear Standard English only. DO NOT use Pidgin or slang. Focus on clarity and authority.";

        const prompt = `
        Kreddy, act as a High-Level Nigerian Business Growth Coach.
        Today's Date: ${new Date().toDateString()}
        
        Task: Write a short, powerful "masterclass" message for a Nigerian merchant to start their day.
        Tone: ${toneInstruction}
        
        Rules:
        1. Write exactly like a human business coach sending a quick morning voice-note or direct WhatsApp text. 
        2. NO BLOCKY AI HEADERS. Do NOT use "*💡 THE BIG INSIGHT:*" or "*✅ ACTION STEP:*". Just write naturally in paragraphs.
        3. NO BULLET POINTS or hashtags. 
        4. Focus on ONE specific growth concept (e.g. inventory velocity, compounding trust, or cashflow) and give ONE clear thing they should do today.
        5. Keep it conversational, empathetic, and street-smart. Relate it to the Nigerian market.
        6. Length: 2 small paragraphs maximum (around 80-120 words). Short, punchy, and highly readable.
        7. Use mild bolding (*like this*) only for 1 or 2 key words of emphasis.
        8. DO NOT start with generic greetings like "Here is your tip" or "Absolutely!". Dive straight into the coaching.
        `;
        
        let advice;
        try {
            // Priority 1: Use Pro model for higher quality long-form advice
            const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await proModel.generateContent(prompt);
            advice = result.response.text().trim();
        } catch (proErr) {
            console.warn("⚠️ Gemini 2.5 Pro Busy/Failed, falling back to Flash model...");
            // Priority 2: Use Flash if Pro is overloaded (503)
            const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await flashModel.generateContent(prompt);
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
        return advice;
    } catch (err) {
        console.error("❌ Critical AI Advice Failure:", err.message);
        
        const fallbacks = tone === "Pidgin" ? [
            `💡 *THE BIG INSIGHT:* Cashflow na Lifeblood\n\n🛡️ *WETIN MATTER:* Profit na paper, na cash dey pay light bill. Log every kobo today!\n\n✅ *WETIN TO DO:* Open Kredibly, log one sale now. Let's win! 🛡️`,
            `🚀 *SCALE UP:* Customer Trust na Gold\n\n🛡️ *WETIN MATTER:* If you deliver on time, dem go come back. Check your pending orders now!\n\n✅ *WETIN TO DO:* Call one customer to confirm delivery. Oya! 🚀`,
            `📈 *GROWTH:* Small Wins count\n\n🛡️ *WETIN MATTER:* No look for big money only, small small kobo dey build empire. Record everything!\n\n✅ *WETIN TO DO:* Log your smallest sale from yesterday. Focus! 📈`
        ] : [
            `💡 *THE BIG INSIGHT:* Cashflow is King\n\n🛡️ *WHY IT MATTERS:* Profit is just paper, but cash pays the bills. Record every kobo today!\n\n✅ *ACTION STEP:* Log one sale in Kredibly now. Let's win! 🛡️`,
            `🚀 *SCALE UP:* Consistency Wins\n\n🛡️ *WHY IT MATTERS:* Showing up every day is 80% of the battle. Keep your ledger updated.\n\n✅ *ACTION STEP:* Review your outstanding debts for 5 minutes. 🚀`,
            `📈 *GROWTH:* Customer Retention\n\n🛡️ *WHY IT MATTERS:* It's cheaper to keep a customer than to find a new one. Service is everything.\n\n✅ *ACTION STEP:* Send a thank-you note to your last customer. 📈`
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
            return "Good morning! Focus on your cashflow today. Every kobo counts! 🛡️";
        }
        return cleanAIArtifacts(config.value.adviceText);
    } catch (e) {
        return "Rise and grind! Consistency is the secret to scaling. 🚀";
    }
};

/**
 * AI JANITOR: Strips annoying AI symbols and fluff
 * Ensures the growth message looks human-vetted.
 */
const cleanAIArtifacts = (text) => {
    if (!text) return "";
    return text
        .replace(/^\s*[-•]\s*/gm, '')     // Remove lone bullet points at start of lines
        .replace(/#{1,3}/g, '')           // Remove hashtags
        .replace(/[-_]{2,}/g, '')         // Remove multiple hyphens/underscores
        .replace(/^"|"$/g, '')            // Remove outer quotes
        .replace(/^(Certainly!|Here is a tip|Good morning,|Sure!|Alright,|Here is a business tip:)/gi, '') // Remove AI chatter
        .trim();
};

module.exports = { generateDailyAdvice, getDailyAdvice };
