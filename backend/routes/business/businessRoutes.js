const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/business/businessController");
const { protect } = require("../../utils/authMiddleware");

router.get("/profile", protect, businessController.getProfile);
router.post("/profile", protect, businessController.updateProfile);
router.get("/activity-logs", protect, businessController.getActivityLogs);

// Payout Settings
router.get("/banks", protect, businessController.getBankList);
router.get("/resolve-account/:bankCode/:accountNumber", protect, businessController.resolveAccountDetails);
router.post("/payout-settings", protect, businessController.saveBankDetails);

module.exports = router;
