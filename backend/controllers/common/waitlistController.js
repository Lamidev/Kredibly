const Waitlist = require("../../models/Waitlist");
const { sendWaitlistEmail } = require("../../emailLogic/emails");

const joinWaitlist = async (req, res) => {
    const { name, email, whatsappNumber, industry, referredBy } = req.body;

    try {
        // Check if email or whatsapp already exists
        const existingEmail = await Waitlist.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "This email is already on the waitlist!" });
        }

        const existingWhatsApp = await Waitlist.findOne({ whatsappNumber });
        if (existingWhatsApp) {
            return res.status(400).json({ success: false, message: "This WhatsApp number is already on the waitlist!" });
        }

        const newEntry = new Waitlist({
            name,
            email,
            whatsappNumber,
            industry,
            referredBy
        });

        await newEntry.save();

        // Send notification to admin (You)
        const adminEmail = process.env.ADMIN_EMAIL || "usekredibly@gmail.com";
        sendWaitlistEmail(adminEmail, newEntry).catch(err => console.error("Email error:", err));

        // If referred by someone, increment their count
        if (referredBy) {
            await Waitlist.findOneAndUpdate(
                { referralCode: referredBy },
                { $inc: { referralCount: 1 } }
            );
        }

        res.status(201).json({
            success: true,
            message: "Welcome to the future of commerce! You're on the list.",
            data: {
                name: newEntry.name,
                referralCode: newEntry.referralCode,
                referralCount: newEntry.referralCount
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWaitlistStats = async (req, res) => {
    try {
        const total = await Waitlist.countDocuments();
        res.status(200).json({ success: true, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { joinWaitlist, getWaitlistStats };
