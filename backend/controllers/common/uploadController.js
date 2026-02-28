const cloudinary = require("../../config/cloudinary");

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            console.error("❌ Upload Logo: No file in request");
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        console.log("📤 Attempting Cloudinary Upload...", {
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Convert buffer to base64
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(fileBase64, {
            folder: "kredibly_logos",
            resource_type: "auto",
        });

        console.log("✅ Cloudinary Upload Success:", result.secure_url);

        res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        console.error("🚨 Logo Upload Error:", {
            message: error.message,
            stack: error.stack,
            cloudinaryError: error.http_code || "N/A"
        });
        res.status(500).json({ 
            success: false, 
            message: "Upload failed: " + (error.message || "Cloudinary connection issue") 
        });
    }
};
