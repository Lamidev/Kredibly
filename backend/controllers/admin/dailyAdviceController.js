const SystemConfig = require("../../models/SystemConfig");
const BusinessProfile = require("../../models/BusinessProfile");
const BackgroundJob = require("../../models/BackgroundJob");
const { generateDailyAdvice } = require("../../utils/adviceService");

/**
 * GET: Fetch the current daily advice and its status
 */
exports.getDailyAdvice = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: "daily_advice" });
        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.regenerateAdvice = async (req, res) => {
    try {
        const { tone } = req.body;
        const advice = await generateDailyAdvice(tone || "English");
        res.status(200).json({ success: true, advice });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST: Approve the current advice and queue Morning Summaries for all users
 */
exports.approveAndQueueSummaries = async (req, res) => {
    try {
        const { editedAdvice, tone, broadcastEmail = true } = req.body;

        // 1. Update and Approve
        const config = await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: { adviceText: editedAdvice, tone }, 
                status: "approved", 
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );

        if (!config) return res.status(404).json({ error: "Advice not found" });

        // 2. Trigger Monday Weekly Kickoff email broadcast to all merchants
        if (broadcastEmail) {
            const { runWeeklyMondayDigest } = require("../../utils/lifecycleService");
            runWeeklyMondayDigest().catch(err => console.error("Admin Manual Monday Digest Error:", err.message));
        }

        // 3. Queue WhatsApp morning reports for active merchants
        const profiles = await BusinessProfile.find({ 
            isKreddyConnected: true,
            whatsappNumber: { $exists: true, $ne: "" }
        }); 

        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
        
        // Reset lastSummaryAt for active profiles so manual tests dispatch immediately
        await BusinessProfile.updateMany(
            { _id: { $in: profiles.map(p => p._id) } },
            { $set: { lastSummaryAt: null } }
        );

        await BackgroundJob.deleteMany({
            type: "MORNING_SUMMARY",
            createdAt: { $gte: startOfToday }
        });

        const jobs = profiles.map(p => ({
            businessId: p._id,
            type: "MORNING_SUMMARY",
            status: "pending",
            scheduledFor: new Date()
        }));

        if (jobs.length > 0) {
            await BackgroundJob.insertMany(jobs);
        }

        res.status(200).json({ 
            message: `Approved advice & triggered kickoff broadcast for ${profiles.length} WhatsApp merchants and all email subscribers!`,
            config
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH: Update only the preferred tone for autonomous generation
 */
exports.updateTonePreference = async (req, res) => {
    try {
        const { tone } = req.body;
        if (!tone) return res.status(400).json({ error: "Tone is required" });

        const current = await SystemConfig.findOne({ key: "daily_advice" });
        const newValue = current?.value && typeof current.value === 'object' 
            ? { ...current.value, tone } 
            : { tone };

        const config = await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: newValue,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, tone: config.value.tone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
