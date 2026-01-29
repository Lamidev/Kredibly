const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/business/businessController");
const { protect } = require("../../utils/authMiddleware");

router.get("/profile", protect, businessController.getProfile);
router.post("/profile", protect, businessController.updateProfile);
router.get("/activity-logs", protect, businessController.getActivityLogs);

module.exports = router;
