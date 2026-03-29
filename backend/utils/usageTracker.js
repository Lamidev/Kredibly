const PlatformStats = require("../models/PlatformStats");

/**
 * UTILITY: TRACK OPERATIONAL COSTS
 * This records every WhatsApp message and AI call to help us monitor burn.
 */
const logUsage = async (type, data = {}) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Estimated Costs (Based on actual Meta/Google pricing for Nigeria market)
        const WHATSAPP_COST_PER_MSG = 18; // NGN (Service/Utility average)
        const AI_COST_PER_CALL = 0.5; // NGN (Gemini Flash optimized cost)

        let update = {};
        if (type === "whatsapp") {
            update = { 
                $inc: { 
                    whatsappMessagesSent: 1, 
                    whatsappEstimatedCost: WHATSAPP_COST_PER_MSG 
                } 
            };
        } else if (type === "ai") {
            update = { 
                $inc: { 
                    aiCallsMade: 1, 
                    aiEstimatedCost: AI_COST_PER_CALL 
                } 
            };
        } else if (type === "revenue") {
            update = { 
                $inc: { 
                    revenueProcessed: data.amount || 0 
                } 
            };
        } else if (type === "merchant_fee") {
            // Paystack Transfer Fee: ~1% capped at 300 NGN
            const estimatedFee = Math.min(300, (data.amount || 0) * 0.01);
            update = { 
                $inc: { 
                    merchantFeeAbsorbed: estimatedFee 
                } 
            };
        }

        await PlatformStats.findOneAndUpdate(
            { date: today },
            update,
            { upsert: true, new: true }
        );
    } catch (error) {
        // Silent fail to ensure main business logic (sending message) never stops
        console.error("⚠️ Usage Tracking Error:", error.message);
    }
};

module.exports = { logUsage };
