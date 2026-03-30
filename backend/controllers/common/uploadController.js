const cloudinary = require("../../config/cloudinary");

/**
 * OPTIMIZED: CLOUDINARY UPLOAD STREAM
 * Instead of converting to massive Base64 strings (which slows down local and production),
 * we stream the buffer directly to Cloudinary.
 */
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            console.error("❌ Upload Logo: No file in request");
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // 🛡️ STREAM BUFFER TO CLOUDINARY (Faster than Base64)
        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "kredibly_logos",
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(buffer);
            });
        };

        const result = await uploadFromBuffer(req.file.buffer);

        res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error) {
        console.error("🚨 Logo Upload Error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Upload failed: " + (error.message || "Cloudinary connection issue") 
        });
    }
};
