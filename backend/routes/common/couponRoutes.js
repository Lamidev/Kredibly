const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../utils/authMiddleware');
const { validateCoupon, createCoupon } = require('../../controllers/common/couponController');

// Public/User Routes
router.post('/validate', protect, validateCoupon);

// Admin Routes
router.post('/create', protect, admin, createCoupon);

module.exports = router;
