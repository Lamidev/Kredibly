const PRICING_PLANS = {
    oga: {
        monthly: 7000,
        yearly: 75600 // 7000 * 12 * 0.9
    },
    chairman: {
        monthly: 30000,
        yearly: 324000 // 30000 * 12 * 0.9
    }
};

/**
 * Gets the base price for a plan and cycle
 * @param {string} plan - 'oga' or 'chairman'
 * @param {string} cycle - 'monthly' or 'yearly' 
 * @returns {number|null} Price in Naira
 */
const getPlanPrice = (plan, cycle) => {
    if (!PRICING_PLANS[plan] || !PRICING_PLANS[plan][cycle]) return null;
    return PRICING_PLANS[plan][cycle];
};

module.exports = {
    PRICING_PLANS,
    getPlanPrice
};
