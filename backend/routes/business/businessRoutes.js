const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/business/businessController");
const authMiddleware = require("../../utils/authMiddleware");

router.get("/profile", authMiddleware, businessController.getProfile);
router.post("/profile", authMiddleware, businessController.updateProfile);

module.exports = router;
