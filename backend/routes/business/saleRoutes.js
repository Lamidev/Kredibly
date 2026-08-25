const express = require("express");
const router = express.Router();
const saleController = require("../../controllers/business/saleController");
const { protect } = require("../../utils/authMiddleware");

// Migration route MUST be above parameterized routes
router.post("/migrate-invoices", protect, saleController.migrateInvoices);

// Protected routes (User must be logged in)
router.post("/", protect, saleController.createSale);
router.get("/", protect, saleController.getSales);
router.get("/dashboard-stats", protect, saleController.getDashboardStats);
router.get("/analytics", protect, saleController.getAnalytics);

// Public invoice PDF stream route (for Meta WhatsApp document download & customer viewing)
router.get("/:invoiceNumber/pdf", saleController.streamInvoicePDF);

// Parameterized routes
router.get("/:id", protect, saleController.getSale);
router.put("/:id", protect, saleController.updateSale);
router.post("/:id/payment", protect, saleController.addPayment);
router.post("/:id/confirm", saleController.confirmSale); // Publicly accessible for webhook confirms
router.post("/:id/remind", protect, saleController.sendReminder);
router.post("/:id/approve-extension", protect, saleController.approveExtension);
router.post("/:id/reject-extension", protect, saleController.rejectExtension);
router.delete("/:id", protect, saleController.deleteSale);

module.exports = router;
