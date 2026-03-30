const LAUNCH_DATE = new Date('2026-05-01T00:00:00Z'); // Official Launch Day
const SLASH_WINDOW_END = new Date('2026-07-01T00:00:00Z'); // Grand Opening Sale Ends (Cut-off)

const PRICING_PLANS = {
    oga: {
        monthly: 5000,
        yearly: 54000, 
        launch: 2500   
    },
    chairman: {
        monthly: 8500,
        yearly: 91800, 
        launch: 4250   
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
