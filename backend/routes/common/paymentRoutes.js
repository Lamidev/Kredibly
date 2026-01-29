const express = require('express');
const router = express.Router();
const { protect } = require('../../utils/authMiddleware');
const { verifyPayment } = require('../../controllers/common/paymentController');

// Verify payment and upgrade plan
router.post('/verify', protect, verifyPayment);

module.exports = router;
