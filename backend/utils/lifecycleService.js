const BusinessProfile = require("../models/BusinessProfile");
const User = require("../models/User");
const Sale = require("../models/Sale");
const { getDailyAdvice } = require("./adviceService");
const { 
    sendInactivityDay2Email, 
    sendInactivityDay7Email, 
    sendWeeklyMondayDigestEmail 
} = require("../emailLogic/emails");

/**
 * 🛡️ 2-STEP INACTIVITY / ACTIVATION DRIP
 * Runs daily to activate dormant/new users without endless spam.
 * - Day 2: First invoice creation helper.
 * - Day 7: Debt recovery & automated reminders.
 * - Capped: 2 emails maximum per lifecycle.
 */
const runInactivityDrip = async () => {
    try {
        console.log("⏳ [LIFECYCLE-DRIP] Running 2-Step Inactivity Checker...");
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. CANDIDATES FOR DAY 2 DRIP (Inactive for >= 48 hours, never sent Day 2)
        const day2Candidates = await BusinessProfile.find({
            $or: [
                { lastInboundAt: { $lte: twoDaysAgo } },
                { lastInboundAt: null, createdAt: { $lte: twoDaysAgo } }
            ],
            "inactivityDrip.day2SentAt": null
        }).populate("ownerId");

        let day2Count = 0;
        for (const profile of day2Candidates) {
            const user = profile.ownerId;
            if (!user || !user.email) continue;

            const name = profile.assistantSettings?.preferredName || user.name || profile.displayName || "there";
            await sendInactivityDay2Email(user.email, name);

            profile.inactivityDrip = profile.inactivityDrip || {};
            profile.inactivityDrip.day2SentAt = new Date();
            await profile.save();
            day2Count++;
        }

        // 2. CANDIDATES FOR DAY 7 DRIP (Inactive for >= 7 days, Day 2 sent, never sent Day 7)
        const day7Candidates = await BusinessProfile.find({
            $or: [
                { lastInboundAt: { $lte: sevenDaysAgo } },
                { lastInboundAt: null, createdAt: { $lte: sevenDaysAgo } }
            ],
            "inactivityDrip.day2SentAt": { $ne: null },
            "inactivityDrip.day7SentAt": null
        }).populate("ownerId");

        let day7Count = 0;
        for (const profile of day7Candidates) {
            const user = profile.ownerId;
            if (!user || !user.email) continue;

            const name = profile.assistantSettings?.preferredName || user.name || profile.displayName || "there";
            await sendInactivityDay7Email(user.email, name);

            profile.inactivityDrip = profile.inactivityDrip || {};
            profile.inactivityDrip.day7SentAt = new Date();
            await profile.save();
            day7Count++;
        }

        console.log(`✅ [LIFECYCLE-DRIP] Processed: ${day2Count} Day-2 drips, ${day7Count} Day-7 drips.`);
    } catch (err) {
        console.error("❌ [LIFECYCLE-DRIP] Execution Error:", err.message);
    }
};

/**
 * 🌅 WEEKLY MONDAY MORNING KICKOFF (Every Monday at 8:00 AM WAT)
 * Sends all onboarded merchants a unified week-ahead briefing & last week's performance.
 */
const runWeeklyMondayDigest = async () => {
    try {
        console.log("🌅 [MONDAY-DIGEST] Starting Weekly Monday Kickoff Dispatch...");
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch fresh Monday advice
        const weeklyAdvice = await getDailyAdvice();

        // Target all onboarded merchants
        const profiles = await BusinessProfile.find({
            displayName: { $exists: true, $ne: "" }
        }).populate("ownerId");

        let sentCount = 0;
        for (const profile of profiles) {
            const user = profile.ownerId;
            if (!user || !user.email) continue;

            // Gather last 7 days sales & payments
            const salesLast7Days = await Sale.find({
                businessId: profile._id,
                createdAt: { $gte: sevenDaysAgo }
            });

            const paymentsLast7Days = await Sale.find({
                businessId: profile._id,
                "payments.date": { $gte: sevenDaysAgo }
            });

            let cashCollected = 0;
            paymentsLast7Days.forEach(s => {
                s.payments.forEach(p => {
                    if (new Date(p.date) >= sevenDaysAgo) cashCollected += p.amount;
                });
            });

            // Pending unpaid debts
            const allUnpaidSales = await Sale.find({
                businessId: profile._id,
                status: { $in: ["unpaid", "partial"] }
            });

            let pendingDebt = 0;
            allUnpaidSales.forEach(s => {
                const paid = s.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                pendingDebt += Math.max(0, s.totalAmount - paid);
            });

            const userName = profile.assistantSettings?.preferredName || user.name || "Partner";

            await sendWeeklyMondayDigestEmail(user.email, {
                userName,
                businessName: profile.displayName,
                cashCollected,
                invoicesCount: salesLast7Days.length,
                pendingDebt,
                weeklyAdvice
            });

            profile.lastWeeklyDigestAt = new Date();
            await profile.save();
            sentCount++;
        }

        console.log(`✅ [MONDAY-DIGEST] Successfully delivered ${sentCount} Monday Kickoff briefings.`);
    } catch (err) {
        console.error("❌ [MONDAY-DIGEST] Execution Error:", err.message);
    }
};

module.exports = {
    runInactivityDrip,
    runWeeklyMondayDigest
};
