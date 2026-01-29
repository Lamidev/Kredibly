const express = require("express");
const router = express.Router();
const supportController = require("../../controllers/admin/supportController");
const { protect } = require("../../utils/authMiddleware");
const adminMiddleware = require("../../utils/adminMiddleware");

router.use(protect);

// User routes
router.post("/tickets", supportController.createTicket);
router.get("/tickets/me", supportController.getUsersTickets);

// Admin reports and resolution
router.get("/tickets/all", adminMiddleware, supportController.getAllTickets);
router.patch("/tickets/:id/resolve", adminMiddleware, supportController.resolveTicket);
router.patch("/tickets/:id/reply", supportController.replyToTicket);
router.patch("/tickets/:id/seen", supportController.markSeen);

module.exports = router;
