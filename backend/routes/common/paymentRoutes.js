const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/common/paymentController");

// Public Invoice View
router.get("/invoice/:invoiceNumber", paymentController.getPublicInvoice);

// Paystack Webhook (No Auth required, signature checked in controller)
router.post("/webhook/paystack", paymentController.handlePaystackWebhook);

module.exports = router;
