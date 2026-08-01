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

router.post('/initialize-subscription', protect, initializeNombaSubscription);
router.post('/initialize-nomba-account', initializeNombaAccount);
router.post('/verify-nomba-payment', protect, verifyNombaPaymentStatus);
router.post('/webhook/nomba', handleNombaWebhook);

// ─── SQUAD (Dormant — Kept for future reactivation) ──────────────────────────
// const { initializeSquadAccount, handleSquadWebhook } = require('../../controllers/common/squadController');
// router.post('/initialize-squad-account', initializeSquadAccount);
// router.post('/webhook/squad', handleSquadWebhook);

module.exports = router;
