const express = require('express');
const router = express.Router();
const { protect } = require('../../utils/authMiddleware');
const { 
    verifyPayment, 
    getUpgradeQuote, 
    initializeVirtualAccountPayment, 
    verifyInvoicePayment 
} = require('../../controllers/common/paymentController');
const { handlePaystackWebhook } = require('../../controllers/common/webhookController');
const saleController = require('../../controllers/business/saleController');

// ─── SUBSCRIPTION PAYMENTS (Paystack) ──────────────────────────────────────
router.post('/verify', protect, verifyPayment);
router.get('/upgrade-quote', protect, getUpgradeQuote);

// ─── INVOICE PAYMENTS (Paystack — Fallback / Secondary) ────────────────────
router.post('/verify-invoice', verifyInvoicePayment);
router.post('/initialize-transfer', initializeVirtualAccountPayment);

// ─── NOMBA PAYMENTS (Primary — Instant Bank Transfer) ──────────────────────
const { 
    initializeNombaAccount, 
    initializeNombaSubscription,
    handleNombaWebhook,
    verifyNombaPaymentStatus 
} = require('../../controllers/common/nombaController');

router.post('/initialize-subscription', protect, initializeNombaSubscription);
router.post('/initialize-nomba-account', initializeNombaAccount);
router.post('/verify-nomba-payment', verifyNombaPaymentStatus);
router.post('/webhook/nomba', handleNombaWebhook);

// ─── PAYSTACK WEBHOOK (Keep for subscription & fallback invoice payments) ──
router.post('/webhook', handlePaystackWebhook);

// ─── SQUAD (Disabled — Kept for reference only) ────────────────────────────
// const { initializeSquadAccount, handleSquadWebhook } = require('../../controllers/common/squadController');
// router.post('/initialize-squad-account', initializeSquadAccount);
// router.post('/webhook/squad', handleSquadWebhook);

// ─── PUBLIC INVOICE ROUTES ─────────────────────────────────────────────────
router.get('/invoice/:id', saleController.getSale);
router.get('/share/:id', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/i/${req.params.id}`);
});

module.exports = router;
