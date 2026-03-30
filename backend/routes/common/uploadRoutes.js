const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../../controllers/common/uploadController");
const { protect } = require("../../utils/authMiddleware");

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(file.originalname.toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + allowedTypes));
    }
});

router.post("/upload-logo", protect, upload.single("logo"), uploadController.uploadImage);

module.exports = router;
