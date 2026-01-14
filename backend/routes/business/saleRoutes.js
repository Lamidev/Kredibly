const express = require("express");
const router = express.Router();
const saleController = require("../../controllers/business/saleController");
const authMiddleware = require("../../utils/authMiddleware");

// Migration route MUST be above parameterized routes
router.post("/migrate-invoices", authMiddleware, saleController.migrateInvoices);

// Protected routes (User must be logged in)
router.post("/", authMiddleware, saleController.createSale);
router.get("/", authMiddleware, saleController.getSales);
router.get("/dashboard-stats", authMiddleware, saleController.getDashboardStats);

// Parameterized routes
router.get("/:id", saleController.getSale); // Publicly accessible for invoice page
router.put("/:id", authMiddleware, saleController.updateSale);
router.post("/:id/payment", authMiddleware, saleController.addPayment);
router.post("/:id/confirm", saleController.confirmSale); // Publicly accessible
router.post("/:id/share-email", authMiddleware, saleController.shareSaleByEmail);
router.post("/:id/remind", authMiddleware, saleController.sendReminder);
router.delete("/:id", authMiddleware, saleController.deleteSale);

module.exports = router;
