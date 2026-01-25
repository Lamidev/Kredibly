const express = require("express");
const router = express.Router();
const waitlistController = require("../../controllers/common/waitlistController");

router.post("/join", waitlistController.joinWaitlist);
router.get("/stats", waitlistController.getWaitlistStats);

module.exports = router;
