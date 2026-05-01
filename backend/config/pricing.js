const LAUNCH_DATE = new Date('2026-06-01T00:00:00Z'); // Official Launch Day
const SLASH_WINDOW_END = new Date('2026-06-01T00:00:00Z'); // Launch Promo Ends (End of May)

const PRICING_PLANS = {
    oga: {
        monthly: 6000,
        yearly: 64800, 
        launch: 3000   
    },
    chairman: {
        monthly: 9000,
        yearly: 97200, 
        launch: 4500   
    }
};

const getPlanPrice = (plan, cycle = "monthly") => {
    if (!PRICING_PLANS[plan] || !PRICING_PLANS[plan][cycle]) return null;
    return PRICING_PLANS[plan][cycle];
};

module.exports = {
    PRICING_PLANS,
    getPlanPrice,
    LAUNCH_DATE,
    SLASH_WINDOW_END
};
