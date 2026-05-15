const mongoose = require("mongoose");
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
const sendIndividualMorningSummary = async (profileInput, now = new Date()) => {
    try {
        console.log(`🔍 [SUMMARY] Resolving merchant record for input: ${profileInput}...`);
        let profile = profileInput;
        // ⚡ FIX: If we received an ID instead of a full object (from Job Runner), fetch it.
        if (typeof profile === "string" || mongoose.Types.ObjectId.isValid(profile)) {
            profile = await BusinessProfile.findById(profileInput);
        }

        if (!profile) return { status: "failed", error: "Profile not found" };

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
        const isInsideWindow = profile.isKreddyConnected && 
                             profile.lastInboundAt && 
                             (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        const isProUser = profile.plan === "oga" || profile.plan === "chairman";

        if ((isInsideWindow || isProUser) && profile.whatsappNumber) {
            // 🟢 GROUP 1: FULL ACCOUNTANT SUMMARY (WhatsApp)
            console.log(`📡 [ACTIVE/PRO] Preparing Full Summary for ${profile.displayName} on WhatsApp...`);

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
                status: { $ne: "completed" } 
            }).limit(2);

            let agendaSection = "";
            if (remindersToday.length > 0) {
                const agendaText = remindersToday.map((r, i) => `${i + 1}. ${r.description}`).join('\n');
                agendaSection = `🗓️ *Today's Agenda:*\n${agendaText}\n\n`;
            }

            // Top Aging Debts
            const topDebtors = await Sale.find({
                businessId: profile._id,
                status: { $in: ["unpaid", "partial"] }
            })
            .sort({ totalAmount: -1, createdAt: 1 })
            .limit(3);

            let debtorSection = "";
            if (topDebtors.length > 0) {
                const debtorList = topDebtors.map(d => {
                    const bal = d.totalAmount - d.payments.reduce((s, p) => s + p.amount, 0);
                    return `• ${d.customerName}: *₦${bal.toLocaleString()}* (#${d.invoiceNumber}) - _${d.description}_`;
                }).join('\n');
                debtorSection = `🧐 *Top Debt Alerts:*\n${debtorList}\n\n`;
            }

            const message = `Good morning, ${bossTitle}! 🌅\n\n📊 *Yesterday's Performance:*\n💰 Cash Collected: *₦${totalCashIn.toLocaleString()}*\n📑 New Invoices: *${salesYesterday.length}* (₦${salesYesterday.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()})\n⏳ Debt Recorded: *₦${pendingDebt.toLocaleString()}*\n\n${agendaSection}${debtorSection}🎯 *Kreddy Growth Masterclass:*\n${dailyTip}\n\n_Let's scale your empire today!_ 🛡️`;

            let sent = false;
            if (isInsideWindow) {
                sent = await sendWhatsAppMessage(profile.whatsappNumber, message);
            } else {
                // Closed window but PRO user -> Use Template
                const { sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");
                sent = await sendWhatsAppAlert(profile.whatsappNumber, bossTitle, message);
            }

            if (sent) {
                console.log(`✅ [WHATSAPP] Summary delivered to ${profile.displayName}.`);
                profile.lastSummaryAt = new Date();
                await profile.save();
                return { status: "sent", channel: "whatsapp" };
            } else {
                console.error(`❌ [WHATSAPP] Delivery FAILED for ${profile.displayName}.`);
                return { status: "failed", error: "WhatsApp delivery failed" };
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

            console.log(`✅ [EMAIL] Growth Masterclass sent to ${user.email}.`);
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
