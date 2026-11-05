const express = require("express");
const router = express.Router();
const whatsappController = require("../../controllers/whatsapp/whatsappController");

// Meta Webhook Verification
router.get("/webhook", whatsappController.verifyWebhook);

// Incoming Message Receiver

// Guard to freeze inbound WhatsApp processing while operations are halted
const checkWhatsAppDisabled = (req, res, next) => {
    if (process.env.WHATSAPP_ENABLED === 'false' || process.env.PLATFORM_PAUSED === 'true') {
        return res.status(200).send("EVENT_RECEIVED");
    }
    next();
};

router.post("/webhook", checkWhatsAppDisabled, whatsappController.handleIncoming);

module.exports = router;
