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

// Parameterized routes
router.get("/:id", saleController.getSale); // Publicly accessible for invoice page
router.put("/:id", protect, saleController.updateSale);
router.post("/:id/payment", protect, saleController.addPayment);
router.post("/:id/confirm", saleController.confirmSale); // Publicly accessible
router.post("/:id/share-email", protect, saleController.shareSaleByEmail);
router.post("/:id/remind", protect, saleController.sendReminder);
router.delete("/:id", protect, saleController.deleteSale);

module.exports = router;
