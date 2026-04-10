const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const ActivityLog = require("../models/ActivityLog");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

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

        const effectivePlan = isPreLaunch ? 'oga' : profile.plan;
        
        // Only send if activity OR high tier plan OR Pre-Launch
        if (salesYesterday.length > 0 || totalCashIn > 0 || effectivePlan === 'chairman' || effectivePlan === 'oga') {
            const planTitle = effectivePlan === "chairman" ? "Chairman" : (effectivePlan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || planTitle;
            const isHustler = effectivePlan === 'hustler';
            
            let msg = "";
            if (isHustler && !isPreLaunch) {
                msg = `🌞 *Rise and Grind, ${bossTitle}!* \n\nYou recorded *${salesYesterday.length || 0} sales* yesterday! 🚀 \n\nTo see your total *Cash Collected*, *Outstanding Credit*, and *Today's Agenda*, upgrade to the *Oga Plan* now. Don't leave your money hanging! 🛡️\n\n`;
            } else {
                msg = `🌞 *Rise and Grind, ${bossTitle}!* \n\nHere is your *Kredibly Intelligence Summary* for yesterday:\n\n`;
                msg += `💰 *Cash Collected:* ₦${totalCashIn.toLocaleString()}\n`;
                msg += `📑 *New Sales:* ${salesYesterday.length}\n`;
                msg += `⏳ *New Credit:* ₦${pendingFromYesterday.toLocaleString()}\n\n`;

                if (totalCashIn > 50000) {
                    msg += `🔥 *Yesterday was a strong day! Keep that energy up today.* 🚀\n\n`;
                } else if (salesYesterday.length === 0) {
                    msg += `💡 *No new sales recorded yesterday. Remember to track every kobo today!* 🛡️\n\n`;
                }

                // Top Debts
                const topDebtors = await Sale.find({ businessId: profile._id, status: { $ne: "paid" } }).sort({ totalAmount: -1 }).limit(3);
                if (topDebtors.length > 0) {
                    msg += `🔴 *Top Outstanding Balances:*\n`;
                    topDebtors.forEach(d => {
                        const bal = d.totalAmount - d.payments.reduce((sum, p) => sum + p.amount, 0);
                        msg += `• ${d.customerName}: ₦${bal.toLocaleString()}\n`;
                    });
                    msg += `\n`;
                }

                // Agenda
                const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
                const todaysReminders = await Reminder.find({ businessId: profile._id, triggerDate: { $gte: startOfToday, $lte: todayEnd }, status: "pending" });
                if (todaysReminders.length > 0) {
                    msg += `📅 *Today's Agenda:*\n`;
                    todaysReminders.forEach(r => {
                        const timeStr = new Date(r.triggerDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
                        msg += `• ${timeStr}: ${r.description}\n`;
                    });
                    msg += `\n`;
                }
            }

            msg += `Check full details on your dashboard: ${process.env.FRONTEND_URL || 'https://usekredibly.com'}`;

            const sent = await sendWhatsAppMessage(profile.whatsappNumber, msg);
            
            if (sent) {
                profile.lastSummaryAt = new Date();
                await profile.save();
                
                await ActivityLog.create({
                    businessId: profile._id,
                    action: "SYSTEM_TASK",
                    entityType: "SYSTEM",
                    details: `Morning Summary delivered to ${profile.displayName} (${profile.whatsappNumber}) via Queue`
                });
                return { status: "sent" };
            } else {
                return { status: "error", reason: "WhatsApp API returned fail" };
            }
        } else {
            return { status: "skipped", reason: "No activity and basic plan" };
        }
    } catch (err) {
        console.error(`❌ Summary Error for ${profile?.displayName}:`, err.message);
        return { status: "error", error: err.message };
    }
};

module.exports = { sendIndividualMorningSummary };
