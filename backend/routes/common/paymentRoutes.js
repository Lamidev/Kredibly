const express = require('express');
const router = express.Router();
const { protect } = require('../../utils/authMiddleware');
const { verifyPayment } = require('../../controllers/common/paymentController');
const { handlePaystackWebhook } = require('../../controllers/common/webhookController');
const saleController = require('../../controllers/business/saleController');

// Verify payment and upgrade plan
router.post('/verify', protect, verifyPayment);

// Verify invoice payment (Public)
const { verifyInvoicePayment } = require('../../controllers/common/paymentController');
router.post('/verify-invoice', verifyInvoicePayment);

// Webhook for invoice payments and other Paystack events
router.post('/webhook', handlePaystackWebhook);

// Public Invoice Routes (to support Frontend PublicInvoicePage)
router.get('/invoice/:id', saleController.getSale);
router.get('/share/:id', (req, res) => {
    // Redirect to the frontend public invoice page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/i/${req.params.id}`);
});

module.exports = router;
