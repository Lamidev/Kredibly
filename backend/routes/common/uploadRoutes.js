const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../../controllers/common/uploadController");
const { protect } = require("../../utils/authMiddleware");

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

router.post("/upload-logo", protect, upload.single("logo"), uploadController.uploadImage);

module.exports = router;
