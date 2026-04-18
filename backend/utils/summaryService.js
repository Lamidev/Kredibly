const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { GROWTH_MASTERCLASS_TEMPLATE } = require("../emailLogic/emailTemplates");
const { sendEmail } = require("./emailService");
const { getDailyAdvice } = require("./adviceService");

/**
 * NEW KREDY GROWTH ENGINE LOGIC:
 * 1. Active Users (<24h window): Full Accountant Summary on WhatsApp (FREE)
 * 2. Inactive Users (>24h window): Growth Masterclass on Email (DRIVES ENGAGEMENT)
 */
const sendIndividualMorningSummary = async (profile, now = new Date()) => {
    try {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // 1. Skip if already handled today (Accountant or Growth)
        if (profile.lastSummaryAt && profile.lastSummaryAt >= startOfToday) {
            return { status: "skipped", reason: "Merchant already handled today" };
        }

        // 2. Fetch Daily Advice Segment (Masterclass)
        const dailyTip = await getDailyAdvice();

        // 3. Resolve merchant's preferred name strictly
        const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Chief";

        // 4. Determine if merchant is ACTIVE (Inside 24h WhatsApp Window)
        // Group 1: Connected + Interacted in last 24h + Has WhatsApp
        const isInsideWindow = profile.isKreddyConnected && 
                             profile.lastInboundAt && 
                             (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        if (isInsideWindow && profile.whatsappNumber) {
            // 🟢 GROUP 1: FULL ACCOUNTANT SUMMARY (WhatsApp - NO EMAIL)
            // ... (keeping Mode A as is since it's WhatsApp)
            console.log(`📡 [ACTIVE] Sending Full Summary to ${profile.displayName} on WhatsApp...`);

            // Fetch Data for Report
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            const endOfYesterday = new Date(startOfYesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            const salesYesterday = await Sale.find({
                businessId: profile._id,
                createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
            });

            const allSalesWithPaymentsYesterday = await Sale.find({
                businessId: profile._id,
                "payments.date": { $gte: startOfYesterday, $lte: endOfYesterday }
            });

            let totalCashIn = 0;
            allSalesWithPaymentsYesterday.forEach(s => {
                s.payments.forEach(p => {
                    if (new Date(p.date) >= startOfYesterday && new Date(p.date) <= endOfYesterday) totalCashIn += p.amount;
                });
            });

            let pendingDebt = 0;
            salesYesterday.forEach(s => {
                const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                pendingDebt += Math.max(0, s.totalAmount - paid);
            });

            const remindersToday = await Reminder.find({
                businessId: profile._id,
                triggerDate: { $gte: startOfToday, $lte: new Date(startOfToday.getTime() + 86400000) },
                status: { $ne: "cancelled" }
            });

            let agendaText = "No specific tasks scheduled. Keep pushing! 🚀";
            if (remindersToday.length > 0) {
                agendaText = remindersToday.map((r, i) => `${i + 1}. ${r.description}`).join('\n');
            }

            const message = `Good morning, ${bossTitle}! 🌅\n\n🎯 *Today's Kreddy Masterclass:*\n${dailyTip}\n\n📊 *Yesterday's Report:*\n💰 Cash in: *₦${totalCashIn.toLocaleString()}*\n📑 Sales: *${salesYesterday.length}*\n⏳ Debt: *₦${pendingDebt.toLocaleString()}*\n\n🗓️ *Today's Agenda:*\n${agendaText}\n\n_Let's scale your empire today!_ 🛡️`;

            const sent = await sendWhatsAppMessage(profile.whatsappNumber, message);
            if (sent) {
                profile.lastSummaryAt = new Date();
                await profile.save();
                return { status: "sent", channel: "whatsapp" };
            } else {
                return { status: "failed", error: "WhatsApp Free-form failed for active user" };
            }

        } else {
            // 🟠 MODE B: GROWTH MASTERCLASS (Email - Inactive Merchants)
            console.log(`📪 [INACTIVE] Sending Growth Masterclass to ${profile.displayName} via Email...`);
            
            const user = await require("../models/User").findById(profile.ownerId);
            if (!user || !user.email) return { status: "failed", error: "No email found for inactive user" };

            const emailHtml = GROWTH_MASTERCLASS_TEMPLATE
                .replace(/{name}/g, profile.displayName)
                .replace(/{adviceText}/g, dailyTip);

            await sendEmail({
                to: user.email,
                subject: `🌅 Morning Insight: A quick note for ${profile.displayName}`,
                html: emailHtml
            });

            profile.lastSummaryAt = new Date();
            await profile.save();
            return { status: "sent", channel: "email" };
        }

    } catch (error) {
        console.error("Critical Summary Engine Failure:", error);
        return { status: "failed", error: error.message };
    }
};

module.exports = { sendIndividualMorningSummary };
