const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const ActivityLog = require("../models/ActivityLog");
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require("../controllers/whatsapp/whatsappController");
/**
 * Core logic to generate and send a morning summary for a specific business profile.
 * @param {Object} profile - The BusinessProfile document.
 * @param {Date} now - The current date/time (to determine yesterday).
 * @returns {Promise<Object>} - Status of the send operation.
 */
const sendIndividualMorningSummary = async (profile, now = new Date()) => {
    try {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(yesterday);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const LAUNCH_DATE = new Date('2026-05-01T00:00:00Z');
        const isPreLaunch = now < LAUNCH_DATE;

        // Skip if already sent today
        if (profile.lastSummaryAt && profile.lastSummaryAt >= startOfToday) {
            return { status: "skipped", reason: "Already sent today" };
        }

        // ACTIVATION LOCK: Only send if they have messaged Kreddy!
        if (!profile.isKreddyConnected) {
            return { status: "skipped", reason: "Kreddy not connected" };
        }

        // Fetch sales made yesterday
        const salesYesterday = await Sale.find({
            businessId: profile._id,
            createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        // Fetch total cash received yesterday
        const allSalesWithPaymentsYesterday = await Sale.find({
            businessId: profile._id,
            "payments.date": { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        let totalCashIn = 0;
        allSalesWithPaymentsYesterday.forEach(sale => {
            sale.payments.forEach(p => {
                const pDate = new Date(p.date);
                if (pDate >= startOfYesterday && pDate <= endOfYesterday) {
                    totalCashIn += p.amount;
                }
            });
        });

        let pendingFromYesterday = 0;
        salesYesterday.forEach(s => {
            const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
            pendingFromYesterday += Math.max(0, s.totalAmount - paid);
        });

        // Fetch reminders due today
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const remindersToday = await Reminder.find({
            businessId: profile._id,
            triggerDate: { $gte: startOfToday, $lte: endOfToday },
            status: { $ne: "cancelled" }
        });

        let agendaText = "No specific tasks scheduled for today. Keep pushing! 🚀";
        if (remindersToday.length > 0) {
            agendaText = remindersToday.map((r, i) => `${i + 1}. ${r.description}`).join('\n');
        }

        const effectivePlan = isPreLaunch ? 'oga' : profile.plan;
        
        // Only send if activity OR reminders OR high tier plan OR Pre-Launch
        if (salesYesterday.length > 0 || totalCashIn > 0 || remindersToday.length > 0 || effectivePlan === 'chairman' || effectivePlan === 'oga') {
            const planTitle = effectivePlan === "chairman" ? "Chairman" : (effectivePlan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || planTitle;

            const components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: bossTitle },
                        { type: "text", text: totalCashIn.toLocaleString() },
                        { type: "text", text: salesYesterday.length.toString() },
                        { type: "text", text: pendingFromYesterday.toLocaleString() },
                        { type: "text", text: agendaText }
                    ]
                }
            ];

            const sent = await sendWhatsAppTemplate(profile.whatsappNumber, 'kreddy_morning_summary', components);
            
            if (sent) {
                profile.lastSummaryAt = new Date();
                await profile.save();
                
                await ActivityLog.create({
                    businessId: profile._id,
                    action: "SYSTEM_TASK",
                    entityType: "SYSTEM",
                    details: `Morning Accountant Summary (Template) delivered to ${profile.displayName}`
                });
                return { status: "sent" };
            } else {
                return { status: "error", reason: "WhatsApp API returned fail on summary template" };
            }
        } else {
            // MODE B: THE GROWTH COACH (For Inactive Users)
            const planTitle = effectivePlan === "chairman" ? "Chairman" : (effectivePlan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || planTitle;

            const components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: bossTitle }
                    ]
                }
            ];

            const sent = await sendWhatsAppTemplate(profile.whatsappNumber, 'kreddy_growth_coach', components);
            
            if (sent) {
                profile.lastSummaryAt = new Date();
                await profile.save();
                
                await ActivityLog.create({
                    businessId: profile._id,
                    action: "SYSTEM_TASK",
                    entityType: "SYSTEM",
                    details: `Morning Coach Nudge (Template) delivered to ${profile.displayName} (Inactive Yesterday)`
                });
                return { status: "sent" };
            } else {
                return { status: "error", reason: "WhatsApp API returned fail on nudge template" };
            }
        }
    } catch (err) {
        console.error(`❌ Summary Error for ${profile?.displayName}:`, err.message);
        return { status: "error", error: err.message };
    }
};

module.exports = { sendIndividualMorningSummary };
