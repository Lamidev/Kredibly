const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
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
        // Priority: Settings > Business Name > Respectful Title
        const bossTitle = profile.assistantSettings?.preferredName || profile.businessName || "Chief";

        // 4. Determine if merchant is ACTIVE (Inside 24h WhatsApp Window)
        const isInsideWindow = profile.lastInboundAt && (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        if (isInsideWindow) {
            // -------------------------------------------------------------------------
            // 🟢 MODE A: FULL ACCOUNTANT SUMMARY (WhatsApp - Active Merchants)
            // -------------------------------------------------------------------------
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
            // -------------------------------------------------------------------------
            // 🟠 MODE B: GROWTH MASTERCLASS (Email - Inactive Merchants)
            // -------------------------------------------------------------------------
            console.log(`📪 [INACTIVE] Sending Growth Masterclass to ${profile.displayName} via Email...`);
            
            const user = await require("../models/User").findById(profile.ownerId);
            if (!user || !user.email) return { status: "failed", error: "No email found for inactive user" };

            const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <span style="background: #ECFDF5; color: #059669; padding: 10px 20px; borderRadius: 100px; fontSize: 13px; fontWeight: 900; letterSpacing: 0.1em; text-transform: uppercase;">Growth Masterclass</span>
                    </div>
                    
                    <h2 style="color: #0F172A; text-align: center; font-size: 24px; font-weight: 950; margin-bottom: 30px;">Rise & Grind, ${bossTitle}! 🌅</h2>
                    
                    <div style="background: #F8FAF9; padding: 30px; border-radius: 20px; border: 1px dashed #D1FAE5; margin-bottom: 32px;">
                        <h4 style="margin: 0 0 12px 0; color: #065F46; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">Today's Street-Smart Tip</h4>
                        <div style="white-space: pre-line; color: #1E293B; font-size: 16px; line-height: 1.6; font-weight: 600;">${dailyTip}</div>
                    </div>

                    <div style="text-align: center;">
                        <p style="color: #64748B; font-size: 14px; margin-bottom: 24px; font-weight: 700;">Wake up Kreddy on WhatsApp to see your full numbers for yesterday! 📊</p>
                        <a href="https://wa.me/2349141040854?text=Kreddy%2C%20I'm%20ready%20to%20grow%20today!" 
                           style="display: block; background-color: #25D366; color: white; padding: 18px; border-radius: 16px; text-decoration: none; font-weight: 950; font-size: 18px; margin-bottom: 12px; box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3);">
                           CHIEF, SHOW ME MY NUMBERS! 🚀
                        </a>
                        <a href="https://usekredibly.com/dashboard" style="display: block; color: #64748B; padding: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">View Web Dashboard</a>
                    </div>

                    <div style="border-top: 1px solid #E2E8F0; margin-top: 40px; padding-top: 20px; text-align: center;">
                        <p style="font-size: 11px; color: #94A3B8; font-weight: 700;">Kredibly Growth Engine &copy; 2026. Keep Scaling!</p>
                    </div>
                </div>
            `;

            await sendEmail({
                to: user.email,
                subject: `🌅 Rise & Grind: Today's Kreddy Masterclass`,
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
