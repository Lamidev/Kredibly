const express = require("express");
const router = express.Router();
const PlatformStats = require("../../models/PlatformStats");
const { protect } = require("../../utils/authMiddleware");
const admin = require("../../utils/adminMiddleware");

router.get("/financial-health", protect, admin, async (req, res) => {
    try {
        // Get last 30 days of stats
        const stats = await PlatformStats.find()
            .sort({ date: -1 })
            .limit(30);

        // Calculate totals for a quick overview
        const totals = stats.reduce((acc, curr) => {
            acc.totalWhatsAppSent += curr.whatsappMessagesSent;
            acc.totalWhatsAppCost += curr.whatsappEstimatedCost;
            acc.totalAICalls += curr.aiCallsMade;
            acc.totalAICost += curr.aiEstimatedCost;
            acc.totalRevenue += curr.revenueProcessed;
            return acc;
        }, {
            totalWhatsAppSent: 0,
            totalWhatsAppCost: 0,
            totalAICalls: 0,
            totalAICost: 0,
            totalRevenue: 0
        });

        res.status(200).json({
            status: "success",
            summary: totals,
            dailyStats: stats
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch platform stats" });
    }
});

module.exports = router;
