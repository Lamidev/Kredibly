const express = require("express");
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    dismissNotification,
    clearAllNotifications
} = require("../../controllers/business/notificationController");
const { protect } = require("../../utils/authMiddleware");

// All routes are protected
router.use(protect);

router.get("/", getNotifications);
router.delete("/clear-all", clearAllNotifications);
router.put("/:id/read", markAsRead);
router.delete("/:id", dismissNotification);

module.exports = router;
