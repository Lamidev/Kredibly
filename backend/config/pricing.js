const LAUNCH_DATE = new Date('2026-06-01T00:00:00Z'); // Official Launch Day
const SLASH_WINDOW_END = new Date('2026-06-01T00:00:00Z'); // Launch Promo Ends (End of May)

const PRICING_PLANS = {
    hustler: {
        monthly: 2500,
        yearly: 27000, // 10% discount for annual
    },
    oga: {
        monthly: 5000,
        yearly: 54000, 
    },
    chairman: {
        monthly: 7500,
        yearly: 81000, 
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
