const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const { protect } = require("../../utils/authMiddleware");


// Guard to block new registrations while Kredibly is in transition
const checkRegistrationPaused = (req, res, next) => {
    if (process.env.REGISTRATION_PAUSED === 'true' || process.env.PLATFORM_PAUSED === 'true') {
        return res.status(403).json({
            status: "fail",
            message: "New account registrations are paused as Kredibly evolves into our next chapter. For assistance or questions, please email hello@usekredibly.com."
        });
    }
    next();
};

router.post("/register", checkRegistrationPaused, authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerificationCode);
router.post("/logout", authController.logout);
router.get("/check-auth", protect, authController.checkAuth);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/verify-password", protect, authController.verifyPassword);
router.post("/push-subscription", protect, authController.savePushSubscription);
router.post("/push-unsubscribe", protect, authController.deletePushSubscription);

module.exports = router;