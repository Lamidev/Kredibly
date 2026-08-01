const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { LAUNCH_DATE } = require("../config/pricing");

const extendTrials = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://localhost:27017/kredibly";
        await mongoose.connect(dbUri);

        const statuses = await BusinessProfile.aggregate([{ $group: { _id: "$planStatus", count: { $sum: 1 } } }]);
        console.log("Current Status Counts:", JSON.stringify(statuses));

        const trialDurationDays = 14;
        const newExpiry = new Date(LAUNCH_DATE);
        newExpiry.setDate(newExpiry.getDate() + trialDurationDays);
        
        console.log(`⏳ Updating all pre-launch profiles to expire on ${newExpiry.toDateString()} (Launch Date + 14 days)...`);
        
        const result = await BusinessProfile.updateMany(
            { planStatus: { $in: ['trialing', 'past_due', 'inactive'] } },
            { $set: { planStatus: 'trialing', plan: 'chairman', trialExpiresAt: newExpiry } }
        );

        const Notification = require("../models/Notification");
        const deletedNotifs = await Notification.deleteMany({ title: "Plan Ended 🔒" });
        console.log(`🧹 Cleaned up ${deletedNotifs.deletedCount} premature lockout notifications.`);

        console.log(`✅ Success! Updated ${result.modifiedCount} business profiles.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error extending trials:", err.message);
        process.exit(1);
    }
};

extendTrials();
