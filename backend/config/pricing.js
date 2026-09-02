const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z'); // Official Launch Day
const LAUNCH_PROMO_END_DATE = new Date('2026-10-01T00:00:00Z'); // September Launch Month Promo: Free Chairman Tier for All

const PRICING_PLANS = {
    hustler: {
        monthly: 3000,
        yearly: 33000, // ~10% discount for annual
    },
    oga: {
        monthly: 6000,
        yearly: 66000,
    },
    chairman: {
        monthly: 9000,
        yearly: 99000,
    }
};

/**
 * Centralized usage caps per plan.
 * null = unlimited.
 * All controllers must reference this object — no hardcoded limits elsewhere.
 */
const PLAN_LIMITS = {
    hustler: {
        invoices: 50,       // Monthly sales/invoice records
        aiMessages: 100,    // AI-powered WhatsApp conversations
        reminders: 20,      // Customer payment reminders
        staff: 0,           // Staff members (owner only)
        voiceNotes: null,   // Not available on Hustler (handled by feature flag)
    },
    oga: {
        invoices: null,
        aiMessages: null,
        reminders: null,
        staff: 1,
        voiceNotes: null,
    },
    chairman: {
        invoices: null,
        aiMessages: null,
        reminders: null,
        staff: 3,
        voiceNotes: null,
    }
};

const getPlanPrice = (plan, cycle = "monthly") => {
    if (!PRICING_PLANS[plan] || !PRICING_PLANS[plan][cycle]) return null;
    return PRICING_PLANS[plan][cycle];
};

const getPlanLimit = (plan, feature) => {
    const planKey = plan || "hustler";
    return PLAN_LIMITS[planKey]?.[feature] ?? null;
};

module.exports = {
    PRICING_PLANS,
    PLAN_LIMITS,
    getPlanPrice,
    getPlanLimit,
    LAUNCH_DATE,
    LAUNCH_PROMO_END_DATE
};
