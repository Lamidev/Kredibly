const PRICING_PLANS = {
    oga: {
        monthly: 5000,
        yearly: 54000, // 5000 * 12 * 0.9 (10% off)
        launch: 2500   // 50% Off Founders Rate
    },
    chairman: {
        monthly: 8500,
        yearly: 91800, // 8500 * 12 * 0.9 (10% off)
        launch: 4250   // 50% Off Founders Rate
    }
};

/**
 * Gets the base price for a plan and cycle
 * @param {string} plan - 'oga' or 'chairman'
 * @param {string} cycle - 'monthly', 'yearly', or 'launch' 
 * @returns {number|null} Price in Naira
 */
const getPlanPrice = (plan, cycle = "monthly") => {
    if (!PRICING_PLANS[plan] || !PRICING_PLANS[plan][cycle]) return null;
    return PRICING_PLANS[plan][cycle];
};

module.exports = {
    PRICING_PLANS,
    getPlanPrice
};
