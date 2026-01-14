const express = require("express");
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    dismissNotification,
    clearAllNotifications
} = require("../../controllers/business/notificationController");
const authMiddleware = require("../../utils/authMiddleware");

// All routes are protected
router.use(authMiddleware);

router.get("/", getNotifications);
router.delete("/clear-all", clearAllNotifications);
router.put("/:id/read", markAsRead);
router.delete("/:id", dismissNotification);

module.exports = router;
