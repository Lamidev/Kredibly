const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const authMiddleware = require("../../utils/authMiddleware");
const adminMiddleware = require("../../utils/adminMiddleware");

// All routes here require both standard auth AND admin check
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", adminController.getGlobalStats);
router.get("/users", adminController.getAllUsers);
router.get("/waitlist", adminController.getWaitlistEntries);

module.exports = router;
