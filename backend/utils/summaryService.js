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
        
        const { getDailyAdvice } = require("./adviceService");
        const dailyTip = await getDailyAdvice();

        // 🛡️ COST SAVING: Check if the 24-hour window is open
        const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

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

            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
            const canSendPaidTemplate = effectivePlan !== "hustler";

            let sent = false;
            
            if (isInsideWindow) {
                // 🟢 FREE-FORM HIJACK: Send 100% free text message because window is open!
                const freeFormText = `Good morning, ${bossTitle}! 🌅\n\n🎯 *Today's Kreddy Masterclass:*\n${dailyTip}\n\n📊 *Record for Yesterday:*\n💰 Total Cash: *₦${totalCashIn.toLocaleString()}*\n📑 New Sales: *${salesYesterday.length}*\n⏳ Pending Debt: *₦${pendingFromYesterday.toLocaleString()}*\n\n🗓️ *Today's Agenda:*\n${agendaText}\n\n_Let's make more money today!_ 🚀`;
                sent = await sendWhatsAppMessage(profile.whatsappNumber, freeFormText);
                if (sent) console.log(`✅ [FREE-FORM] Summary sent for ${profile.displayName}`);
            } else if (canSendPaidTemplate) {
                // 🟠 PAID TEMPLATE: Window is closed, but merchant is Oga/Chairman (Paid subscription covers this)
                sent = await sendWhatsAppTemplate(profile.whatsappNumber, 'kreddy_morning_summary', components);
                if (sent) console.log(`💰 [PAID-TEMPLATE] Summary forced via template for ${profile.displayName}`);
            } else {
                // 🔴 EMAIL ONLY: Hustler user + Window closed. No WhatsApp to save cost.
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);

                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `🌅 Your Kreddy Morning Summary`,
                        html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc;">
                                <h2 style="color: #059669; text-align: center;">Kreddy Accountant Summary 🌅</h2>
                                
                                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                    <h4 style="margin-top: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Today's Masterclass</h4>
                                    <div style="white-space: pre-line; color: #1e293b; font-size: 15px;">${dailyTip}</div>
                                </div>

                                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                                    <h4 style="margin-top: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Yesterday's Numbers</h4>
                                    <ul style="padding: 0; list-style: none;">
                                        <li style="margin-bottom: 8px;">💰 Total Cash: <b>₦${totalCashIn.toLocaleString()}</b></li>
                                        <li style="margin-bottom: 8px;">📑 New Sales: <b>${salesYesterday.length}</b></li>
                                        <li style="margin-bottom: 8px;">⏳ Pending Debt: <b>₦${pendingFromYesterday.toLocaleString()}</b></li>
                                    </ul>
                                    <h4 style="margin-top: 20px; color: #64748b; font-size: 12px; text-transform: uppercase;">Today's Agenda</h4>
                                    <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; background: #f1f5f9; padding: 12px; border-radius: 8px;">${agendaText}</pre>
                                </div>

                                <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px;">Kredibly: Helping you build a stronger business, one record at a time.</p>
                               </div>`
                    });
                    console.log(`📪 [EMAIL-SENT] Summary (with tip) for ${profile.displayName} sent to inbox.`);
                }
                sent = true; 
            }
            
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

            const { getDailyAdvice } = require("./adviceService");
            const dailyTip = await getDailyAdvice();

            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
            
            let sent = false;
            if (isInsideWindow) {
                // 🟢 FREE-FORM HIJACK
                const freeFormCoach = `Hello ${bossTitle}! 🚀\n\n🎯 *Today's Kreddy Masterclass:*\n\n${dailyTip}\n\n_Log your first sale today and stay winning!_ 🛡️`;
                sent = await sendWhatsAppMessage(profile.whatsappNumber, freeFormCoach);
                if (sent) console.log(`✅ [FREE-FORM] Growth Coach sent for ${profile.displayName}`);
            } else {
                // 🔴 EMAIL ONLY
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);

                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `💡 Today's Kreddy Business Masterclass`,
                        html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <h2 style="color: #059669; margin: 0;">Kreddy Growth Engine 🚀</h2>
                                    <p style="color: #64748b; font-weight: 600; font-size: 14px; text-transform: uppercase;">Daily Business Masterclass</p>
                                </div>
                                <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; white-space: pre-line; line-height: 1.6; font-size: 16px;">
                                    ${dailyTip}
                                </div>
                                <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 14px; color: #475569; font-weight: 500;">Record your sales today to keep the momentum going!</p>
                                    <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Helping you build a stronger legacy, one record at a time.</p>
                                </div>
                               </div>`
                    });
                    console.log(`💡 [EMAIL-SENT] Growth Masterclass for ${profile.displayName} delivered.`);
                }
                sent = true; 
            }
            
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
