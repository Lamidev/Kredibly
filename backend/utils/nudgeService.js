const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppAlert, sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

/**
 * Sends a nudge message (DEBT_NUDGE) based on the provided context.
 * @param {Object} data - Context data { type, saleId, reminderId, profileId, whatsappNumber }
 * @returns {Promise<Object>} - Status of the operation.
 */
const sendIndividualDebtNudge = async (data) => {
    try {
        const { type, saleId, reminderId, profileId, whatsappNumber } = data;

        if (type === "proactive_followup") {
            const reminder = await Reminder.findById(reminderId).populate("businessId").populate("saleId");
            if (!reminder || !reminder.saleId || reminder.saleId.status === "paid") return { status: "skipped" };

            const profile = reminder.businessId;
            const sale = reminder.saleId;
            const planFTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || planFTitle;
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

            const msg = `🤔 *Did They Pay, ${bossTitle}?*\n\nYesterday, you had a reminder to collect from *${sale.customerName}* for *${sale.description}*.\n\nMy records show they still owe *₦${bal.toLocaleString()}*. \n\nDid they pay offline? If yes, just say: _"${sale.customerName} paid"_. \n\nIf not, would you like me to snooze this reminder for later, or send them another message?`;
            
            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
            
            // 🛡️ Save session state to capture Yes/No replies
            const cleanFrom = String(whatsappNumber).replace(/\D/g, '');
            const WhatsAppSession = require("../models/WhatsAppSession");
            await WhatsAppSession.findOneAndUpdate(
                { whatsappNumber: cleanFrom },
                {
                    type: "recovery_followup",
                    data: { saleId: sale._id, customerName: sale.customerName, balance: bal },
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                },
                { upsert: true }
            );

            if (isInsideWindow) {
                await sendWhatsAppMessage(whatsappNumber, msg);
            } else if (profile.plan === "oga" || profile.plan === "chairman") {
                await sendWhatsAppAlert(whatsappNumber, bossTitle, msg, sale.invoiceNumber);
            } else {
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `🤔 Debt Follow-up: ${sale.customerName}`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>Hey ${bossTitle},</h2>
                                <p>Yesterday, you had a reminder to collect from <b>${sale.customerName}</b>.</p>
                                <p>My records show they still owe <b>₦${bal.toLocaleString()}</b>. Did they pay offline?</p>
                                <p><i>Tip: Type "${sale.customerName} paid" next time you chat with me on WhatsApp!</i></p>
                               </div>`
                    });
                    console.log(`📪 [EMAIL-SENT] Debt Nudge for ${profile.displayName} sent.`);
                }
            }
            return { status: "completed" };

        } else if (type === "past_due_escalation") {
            const sale = await Sale.findById(saleId).populate("businessId");
            if (!sale || sale.status === "paid") return { status: "skipped" };

            const profile = sale.businessId;
            const planETitle = profile.plan === "chairman" ? "Chairman" : "Oga";
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || planETitle;
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
            
            const msg = `🚩 *Overdue Alert, ${bossTitle}!*\n\n*${sale.customerName}* was supposed to pay *₦${bal.toLocaleString()}* for *${sale.description}* yesterday, but the record is still unpaid.\n\nShould I draft a follow-up link for you to forward to them? \n\n_Type: "Send link to ${sale.customerName}"_`;
            
            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

            // 🛡️ Save session state to capture Yes/No confirmations
            const cleanFrom = String(whatsappNumber).replace(/\D/g, '');
            const WhatsAppSession = require("../models/WhatsAppSession");
            await WhatsAppSession.findOneAndUpdate(
                { whatsappNumber: cleanFrom },
                {
                    type: "alarm_confirmation",
                    data: { saleId: sale._id, customerName: sale.customerName },
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                },
                { upsert: true }
            );

            if (isInsideWindow) {
                await sendWhatsAppMessage(whatsappNumber, msg);
            } else if (profile.plan === "oga" || profile.plan === "chairman") {
                await sendWhatsAppAlert(whatsappNumber, bossTitle, msg, sale.invoiceNumber);
            } else {
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `🚩 Overdue Alert: ${sale.customerName}`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>🚩 Overdue Alert, ${bossTitle}!</h2>
                                <p><b>${sale.customerName}</b> was supposed to pay ₦${bal.toLocaleString()} yesterday, but the record is still unpaid.</p>
                                <p>Log into your dashboard to take action!</p>
                               </div>`
                    });
                    console.log(`📪 [EMAIL-SENT] Past Due Alert for ${profile.displayName} sent.`);
                }
            }
            return { status: "completed" };
        } else if (type === "upcoming_summary") {
            const { saleIds } = data;
            const sales = await Sale.find({ _id: { $in: saleIds } }).populate("businessId");
            if (!sales.length) return { status: "skipped" };

            const profile = sales[0].businessId;
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || (profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss"));
            
            // Calculate specific timing
            const now = new Date();
            const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
            const startOfTomorrow = new Date(now); startOfTomorrow.setDate(now.getDate() + 1); startOfTomorrow.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(now); endOfTomorrow.setDate(now.getDate() + 1); endOfTomorrow.setHours(23, 59, 59, 999);

            let hasToday = false;
            let hasTomorrow = false;
            sales.forEach(s => {
                if (s.dueDate >= startOfToday && s.dueDate <= endOfToday) hasToday = true;
                if (s.dueDate >= startOfTomorrow && s.dueDate <= endOfTomorrow) hasTomorrow = true;
            });

            const timingText = (hasToday && hasTomorrow) ? "today and tomorrow" : (hasToday ? "today" : "tomorrow");
            const totalBal = sales.reduce((sum, s) => sum + (s.totalAmount - s.payments.reduce((pSum, p) => pSum + p.amount, 0)), 0);
            
            // Build Detailed List
            const saleList = sales.map(s => {
                const bal = s.totalAmount - s.payments.reduce((pSum, p) => pSum + p.amount, 0);
                const day = (s.dueDate >= startOfToday && s.dueDate <= endOfToday) ? "Today" : "Tomorrow";
                return `• *${s.customerName}*: ₦${bal.toLocaleString()} (${s.invoiceNumber}) - _${s.description}_ [${day}]`;
            }).join('\n');

            let msg = `🌞 *Good Morning ${bossTitle}!* \n\nYou have *${sales.length}* ${sales.length === 1 ? 'sale' : 'sales'} expected to be paid *${timingText}*, totaling *₦${totalBal.toLocaleString()}*.\n\n⏳ *Upcoming Collections:*\n${saleList}\n\nI'm monitoring them for you! 🛡️`;

            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

            if (isInsideWindow) {
                await sendWhatsAppMessage(whatsappNumber, msg);
            } else if (profile.plan === "oga" || profile.plan === "chairman") {
                await sendWhatsAppAlert(whatsappNumber, bossTitle, msg);
            } else {
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `📊 Upcoming Receivables Summary`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>${bossTitle}, here is your upcoming summary:</h2>
                                <p>You have <b>${sales.length}</b> sales expected to be paid <b>${timingText}</b>, totaling <b>₦${totalBal.toLocaleString()}</b>.</p>
                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    ${saleList.replace(/\n/g, '<br>')}
                                </div>
                                <p>I'm monitoring them for you! 🛡️</p>
                               </div>`
                    });
                }
            }
            return { status: "completed" };
        }

        return { status: "failed", error: "Invalid nudge type" };

    } catch (err) {
        console.error("Nudge Service Error:", err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { sendIndividualDebtNudge };
