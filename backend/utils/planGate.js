/**
 * 🛡️ KREDIBLY PLAN GATE
 * Single source of truth for plan access rules.
 *
 * Rules:
 *  - Payment collection / webhooks  → always plan-agnostic (handled upstream)
 *  - Read operations (GET)          → always allowed
 *  - Write operations (POST/PATCH)  → blocked when planStatus is inactive/cancelled
 *  - WhatsApp AI                    → handled separately in whatsappController.js
 */

const ACTIVE_STATUSES = ['trialing', 'active', 'past_due'];
const WRITE_ALLOWED_STATUSES = ['trialing', 'active', 'past_due'];

/**
 * Returns true when the merchant can create/modify records.
 * @param {Object} profile - BusinessProfile document
 */
const isPlanActive = (profile) =>
    WRITE_ALLOWED_STATUSES.includes(profile?.planStatus);

/**
 * Returns feature caps for a given plan tier.
 * @param {string} plan - 'hustler' | 'oga' | 'chairman'
 */
const getPlanFeatures = (plan) => {
    switch (plan) {
        case 'chairman':
            return {
                maxMonthlyRecords: Infinity,
                maxStaff: 3,
                hasVoiceNotes: true,
                hasMorningSummary: true,
                hasWhiteLabel: true,
                hasMultiOffice: true,
                maxMonthlyMessages: 500,
                hasLanguageChoice: true,
            };
        case 'oga':
            return {
                maxMonthlyRecords: Infinity,
                maxStaff: 1,
                hasVoiceNotes: true,
                hasMorningSummary: true,
                hasWhiteLabel: false,
                hasMultiOffice: false,
                maxMonthlyMessages: 250,
                hasLanguageChoice: true,
            };
        case 'hustler':
        default:
            return {
                maxMonthlyRecords: 10,
                maxStaff: 0,
                hasVoiceNotes: false,
                hasMorningSummary: false,
                hasWhiteLabel: false,
                hasMultiOffice: false,
                maxMonthlyMessages: 50,
                hasLanguageChoice: false,
            };
    }
};

/**
 * Express middleware — blocks write operations for inactive/cancelled plans.
 * Attach to any POST/PATCH route that creates or modifies merchant records.
 *
 * Usage: router.post('/sales', requireActivePlan, saleController.createSale)
 *
 * The middleware expects req.user to be populated (by the auth middleware).
 * It fetches the business profile and attaches it to req.businessProfile
 * so downstream controllers can reuse it without a second DB call.
 */
const requireActivePlan = async (req, res, next) => {
    try {
        const BusinessProfile = require('../models/BusinessProfile');
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (!profile) {
            return res.status(404).json({ message: 'Business profile not found.' });
        }

        // Attach to request so the controller doesn't need to re-fetch
        req.businessProfile = profile;

        if (!isPlanActive(profile)) {
            return res.status(403).json({
                success: false,
                code: 'PLAN_INACTIVE',
                message: 'Your plan has ended. Reactivate to create new records.',
                planStatus: profile.planStatus,
                reactivateUrl: '/settings'
            });
        }

        next();
    } catch (err) {
        console.error('planGate.requireActivePlan Error:', err.message);
        res.status(500).json({ message: 'Server error during plan verification.' });
    }
};

module.exports = { isPlanActive, getPlanFeatures, requireActivePlan };
