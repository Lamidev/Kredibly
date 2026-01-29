const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const { protect } = require("../../utils/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/logout", authController.logout);
router.get("/check-auth", protect, authController.checkAuth);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;