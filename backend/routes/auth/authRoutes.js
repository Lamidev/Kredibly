const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const authMiddleware = require("../../utils/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/logout", authController.logout);
router.get("/check-auth", authMiddleware, authController.checkAuth);

module.exports = router;