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
router.post("/merchants/:id/verify", adminController.manualVerifyMerchant);
router.delete("/users/:id", adminController.deleteUser);
router.get("/coupons", adminController.getCoupons);
router.post("/coupons", adminController.createCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);
router.get("/payments", adminController.getPayments);
router.delete("/payments/:id", adminController.deletePayment);
router.get("/invoice-payments", adminController.getInvoicePayments);
router.delete("/invoice-payments/:saleId/:paymentId", adminController.deleteInvoicePayment);

// New Mission Control Routes
router.get("/mission-control/feed", adminController.getMissionControlFeed);
router.get("/mission-control/dispatch-report", adminController.getDetailedDispatchReport);
router.post("/background-jobs/:id/retry", adminController.retryBackgroundJob);
router.patch("/background-jobs/:id/cancel", adminController.cancelBackgroundJob);
router.delete("/background-jobs/:id", adminController.deleteBackgroundJob);

const dailyAdviceController = require("../../controllers/admin/dailyAdviceController");

router.get("/daily-advice", dailyAdviceController.getDailyAdvice);
router.post("/daily-advice/regenerate", dailyAdviceController.regenerateAdvice);
router.post("/daily-advice/approve", dailyAdviceController.approveAndQueueSummaries);

module.exports = router;
