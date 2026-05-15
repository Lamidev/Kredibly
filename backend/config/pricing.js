const LAUNCH_DATE = new Date('2026-06-01T00:00:00Z'); // Official Launch Day

const PRICING_PLANS = {
    hustler: {
        monthly: 2500,
        yearly: 27000,
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
    LAUNCH_DATE
};
