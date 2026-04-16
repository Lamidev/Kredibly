const { GoogleGenerativeAI } = require("@google/generative-ai");
const SystemConfig = require("../models/SystemConfig");

const genAI = new GoogleGenerativeAI(process.env.KREDDY_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "You are Kreddy, the street-smart Nigerian business coach. Your job is to give one daily, punchy business tip or motivational quote to Nigerian merchants. Keep it short, relative to business growth or debt collection, and always end with your signature protector emoji 🛡️."
});

/**
 * Generate a high-value, long-form Daily Business Masterclass using Gemini 2.5 Pro.
 * @param {String} tone - 'English' or 'Pidgin'
 */
const generateDailyAdvice = async (tone = "English") => {
    try {
        console.log(`🧠 Kreddy Brain: Generating ${tone} business advice...`);
        
        // Use Pro model for higher quality long-form advice
        const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const toneInstruction = tone === "Pidgin" 
            ? "Use authentic Street-Smart Nigerian Pidgin. Be warm, energetic, and encouraging."
            : "Use professional but friendly Nigerian English. Focus on clarity and authority.";

        const prompt = `
        Kreddy, act as a High-Level Nigerian Business Growth Coach.
        Task: Write a "Kreddy Masterclass" for a Nigerian merchant to start their day.
        Tone: ${toneInstruction}
        
        Structure Required:
        1. 💡 THE BIG INSIGHT: A powerful heading and explanation of one specific business growth concept (e.g., compounding customer trust, inventory velocity, cashflow vs profit).
        2. 🛡️ WHY IT MATTERS: Explain how this prevents failure or increases money in their pocket.
        3. ✅ ACTION STEP: One clear thing they should do TODAY using Kredibly or in their shop.

        Rules:
        - Keep it between 120 - 180 words. Give REAL value.
        - Relate it to the Nigerian market (fuel prices, exchange rates, or customer trust).
        - End with a motivating "Let's win!" vibe.
        `;

        const result = await proModel.generateContent(prompt);
        const advice = result.response.text().trim();

        await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: advice,
                status: "pending",
                lastGenerated: new Date(),
                lastUpdated: new Date(),
                metadata: { tone }
            },
            { upsert: true, new: true }
        );

        console.log("✅ Daily advice cached successfully.");
        return advice;
    } catch (err) {
        console.error("❌ Advice Generation Error:", err.message);
        return `💡 THE BIG INSIGHT: Professional Bookkeeping\n\n🛡️ WHY IT MATTERS: Without records, you are flying blind. You don't know who owes you or if you are making profit.\n\n✅ ACTION STEP: Open Kredibly today and log every single sale, no matter how small. Let's win! 🛡️`;
    }
};

/**
 * Gets today's advice from cache (or generates it if missing).
 */
const getDailyAdvice = async () => {
    const config = await SystemConfig.findOne({ key: "daily_advice" });
    
    // Refresh if missing or older than 20 hours
    const isOld = !config || (new Date() - new Date(config.lastUpdated)) > (20 * 60 * 60 * 1000);
    
    if (isOld) {
        return await generateDailyAdvice();
    }
    
    return config.value;
};

module.exports = { generateDailyAdvice, getDailyAdvice };
