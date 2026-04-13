const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const WhatsAppSession = require("../models/WhatsAppSession");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { sendEmail } = require("./emailService");
const BackgroundJob = require("../models/BackgroundJob");
const { sendIndividualMorningSummary } = require("./summaryService");
const { processIndividualEscrowPayout } = require("./payoutService");
const { sendIndividualDebtNudge } = require("./nudgeService");
const { sendIndividualPlanAlert } = require("./planAlertService");

const processBackgroundJobs = async () => {
    try {
        // 1. Recover "Zombie" Jobs (Stuck in processing for > 15 mins)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        await BackgroundJob.updateMany(
            { status: "processing", updatedAt: { $lt: fifteenMinsAgo } },
            { status: "pending", error: "Job timed out, resetting for retry" }
        );

        const jobs = await BackgroundJob.find({ status: "pending" })
            .limit(20) // Smaller chunks for tighter pacing
            .populate("businessId");

        if (jobs.length === 0) return;

        // Only log if something is actually happening
        // console.log(`⚙️ Processing ${jobs.length} background jobs...`); 

        for (const job of jobs) {
            job.status = "processing";
            await job.save();

            try {
                let result = { status: "failed", error: "Unknown job type" };

                if (job.type === "MORNING_SUMMARY") {
                    const profile = job.businessId;
                    if (!profile) {
                        result = { status: "failed", error: "Business profile not found" };
                    } else {
                        result = await sendIndividualMorningSummary(profile);
                    }
                } else if (job.type === "ESCROW_PAYOUT") {
                    result = await processIndividualEscrowPayout(job.data?.escrowId);
                } else if (job.type === "DEBT_NUDGE") {
                    result = await sendIndividualDebtNudge(job.data);
                } else if (job.type === "TRIAL_EXPIRY") {
                    result = await sendIndividualPlanAlert({ ...job.data, profileId: job.businessId?._id || job.businessId });
                }
                
                // Handle Results
                if (result.status === "completed" || result.status === "sent" || result.status === "skipped") {
                    job.status = "completed";
                    job.completedAt = new Date();
                    job.error = null;
                } else {
                    job.status = "failed";
                    job.error = result.error || result.reason || "Operation failed";
                    job.attempts += 1;
                    
                    // Basic Retry Logic (Max 3 attempts)
                    if (job.attempts < 3) {
                        job.status = "pending";
                        job.scheduledFor = new Date(Date.now() + 30 * 60 * 1000); // Retry in 30 mins
                    }
                }
                
                await job.save();

                // 2. PACING: Wait 15 seconds if there are more jobs in this batch
                if (jobs.indexOf(job) < jobs.length - 1) {
                    await new Promise(res => setTimeout(res, 15000));
                }

            } catch (jobErr) {
                console.error(`❌ Job Error [${job._id}]:`, jobErr.message);
                job.status = "failed";
                job.error = jobErr.message;
                job.attempts += 1;
                if (job.attempts < 3) {
                    job.status = "pending";
                    job.scheduledFor = new Date(Date.now() + 30 * 60 * 1000);
                }
                await job.save();
            }
        }
    } catch (err) {
        console.error("Queue Worker Error:", err);
    }
};

const checkAndNotify = async () => {
    // ⚙️ THE WORKER: Process queued jobs from Mission Control
    await processBackgroundJobs();
    
    // Note: Periodic direct-polling logic has been migrated to the Queue System (cronJobs.js)
    // to prevent duplicate notifications and ensure all Kreddy activity is observable.
};

const startProactiveAssistant = () => {
    console.log("⏰ Kreddy Lean-Efficient Assistant Active (Checking every 1 min)");
    checkAndNotify();
    setInterval(checkAndNotify, 60 * 1000); 
};

module.exports = { startProactiveAssistant, processBackgroundJobs };
