const express = require("express");
const router = express.Router();
const whatsappController = require("../../controllers/whatsapp/whatsappController");

// Meta Webhook Verification
router.get("/webhook", whatsappController.verifyWebhook);

// Incoming Message Receiver
router.post("/webhook", whatsappController.handleIncoming);

module.exports = router;
