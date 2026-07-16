const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/business/businessController");
const { protect } = require("../../utils/authMiddleware");

router.get("/profile", protect, businessController.getProfile);
router.post("/profile", protect, businessController.updateProfile);
router.get("/activity-logs", protect, businessController.getActivityLogs);

// Reminders & Task Operations
router.get("/reminders", protect, businessController.getReminders);
router.post("/reminders", protect, businessController.createReminder);
router.put("/reminders/:id", protect, businessController.updateReminder);
router.delete("/reminders/:id", protect, businessController.deleteReminder);

// Payout Settings
router.get("/banks", protect, businessController.getBankList);
router.get("/resolve-account/:bankCode/:accountNumber", protect, businessController.resolveAccountDetails);
router.post("/payout-settings", protect, businessController.saveBankDetails);

// KYC & Compliance
router.post("/kyc/verify", protect, businessController.verifyKYC);
router.post("/trigger-welcome", protect, businessController.triggerWelcome);

module.exports = router;
