const express = require('express');
const router = express.Router();
const { protect } = require('../../utils/authMiddleware');

// ─── NOMBA PAYMENTS (Primary — Instant Bank Transfer & Subscriptions) ───────
const { 
    initializeNombaAccount, 
    initializeNombaSubscription,
    handleNombaWebhook,
    verifyNombaPaymentStatus 
} = require('../../controllers/common/nombaController');

// Guard to freeze Nomba payment endpoints while operations are halted
const checkNombaDisabled = (req, res, next) => {
    if (process.env.NOMBA_ENABLED === 'false' || process.env.PLATFORM_PAUSED === 'true') {
        return res.status(200).json({ status: "acknowledged", message: "Nomba operations currently paused during platform transition." });
    }
    next();
};

router.post('/initialize-subscription', protect, checkNombaDisabled, initializeNombaSubscription);
router.post('/initialize-nomba-account', checkNombaDisabled, initializeNombaAccount);
router.post('/verify-nomba-payment', protect, verifyNombaPaymentStatus);
router.post('/webhook/nomba', checkNombaDisabled, handleNombaWebhook);

// ─── SQUAD (Dormant — Kept for future reactivation) ──────────────────────────
// const { initializeSquadAccount, handleSquadWebhook } = require('../../controllers/common/squadController');
// router.post('/initialize-squad-account', initializeSquadAccount);
// router.post('/webhook/squad', handleSquadWebhook);

module.exports = router;
