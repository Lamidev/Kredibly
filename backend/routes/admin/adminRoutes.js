const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const { protect } = require("../../utils/authMiddleware");
const adminMiddleware = require("../../utils/adminMiddleware");

// All routes here require both standard auth AND admin check
router.use(protect);
router.use(adminMiddleware);

router.get("/stats", adminController.getGlobalStats);
router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);
router.get("/waitlist", adminController.getWaitlistEntries);
router.delete("/waitlist/:id", adminController.deleteWaitlistEntry);
router.get("/coupons", adminController.getCoupons);
router.delete("/coupons/:id", adminController.deleteCoupon);
router.get("/payments", adminController.getPayments);

module.exports = router;
