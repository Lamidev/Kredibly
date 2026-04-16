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
        const { editedAdvice } = req.body;

        // 1. Update and Approve
        const config = await SystemConfig.findOneAndUpdate(
            { key: "daily_advice" },
            { 
                value: editedAdvice, 
                status: "approved", 
                lastUpdated: new Date() 
            },
            { new: true }
        );

        if (!config) return res.status(404).json({ error: "Advice not found" });

        // 2. QUEUE THE JOBS: This is the "Engine Start" button
        // We find all business profiles that are setup
        const profiles = await BusinessProfile.find({ isSetup: true });
        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
        
        const existingJobs = await BackgroundJob.find({
            type: "MORNING_SUMMARY",
            createdAt: { $gte: startOfToday }
        }).select("businessId");

        const existingProfileIds = new Set(existingJobs.map(j => j.businessId.toString()));
        
        const jobs = profiles
            .filter(p => !existingProfileIds.has(p._id.toString()))
            .map(p => ({
                businessId: p._id,
                type: "MORNING_SUMMARY",
                status: "pending",
                scheduledFor: new Date()
            }));

        // Use insertMany for high speed
        if (jobs.length > 0) {
            await BackgroundJob.insertMany(jobs);
        }

        res.status(200).json({ 
            message: `Successfully approved and queued ${jobs.length} summaries!`,
            config
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
