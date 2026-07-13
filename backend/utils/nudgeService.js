const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppAlert, sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { sendInteractiveButtons } = require("./customerInvoiceService");

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
            if (!reminder || reminder.status === "cancelled" || !reminder.saleId || reminder.saleId.status === "paid") return { status: "skipped" };

            const profile = reminder.businessId;
            const sale = reminder.saleId;
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

            const msg = `${sale.customerName} still shows an outstanding balance of ₦${bal.toLocaleString()} from yesterday's reminder on Invoice #${sale.invoiceNumber}.\n\nDid they pay?`;

            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

            // Save session state regardless of channel so text replies also work
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
                // Send interactive quick-action buttons for fastest possible merchant response
                const sent = await sendInteractiveButtons(
                    whatsappNumber,
                    `Collection Check — ${sale.customerName}`,
                    msg,
                    "Tap a button or type a reply",
                    [
                        { id: `m_paid:${sale._id}`, title: "Yes, Paid" },
                        { id: `m_remind:${sale._id}`, title: "Remind Customer" },
                        { id: `m_snooze:${sale._id}`, title: "Snooze 24h" }
                    ]
                );
                // Fallback to plain text if interactive fails
                if (!sent) {
                    await sendWhatsAppMessage(whatsappNumber, `${msg}\n\nIf yes, say "${sale.customerName} paid" and I'll update the record.`);
                }
            } else if (profile.plan === "oga" || profile.plan === "chairman") {
                await sendWhatsAppAlert(whatsappNumber, bossTitle, `${msg}\n\nIf yes, say "${sale.customerName} paid" and I'll update the record.`, sale.invoiceNumber);
            } else {
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `Debt Follow-up: ${sale.customerName}`,
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
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

            const msg = `Invoice #${sale.invoiceNumber} for ${sale.customerName} (₦${bal.toLocaleString()}) was due yesterday and is now overdue.\n\nWhat would you like to do?`;

            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

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
                const sent = await sendInteractiveButtons(
                    whatsappNumber,
                    `Overdue — Invoice #${sale.invoiceNumber}`,
                    msg,
                    "",
                    [
                        { id: `m_remind:${sale._id}`, title: "Remind Customer" },
                        { id: `m_snooze:${sale._id}`, title: "Snooze 24h" }
                    ]
                );
                if (!sent) {
                    await sendWhatsAppMessage(whatsappNumber, msg);
                }
            } else if (profile.plan === "oga" || profile.plan === "chairman") {
                await sendWhatsAppAlert(whatsappNumber, bossTitle, msg, sale.invoiceNumber);
            } else {
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `Overdue Alert: ${sale.customerName}`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>Overdue Alert, ${bossTitle}!</h2>
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
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";

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
                return `• ${s.customerName}: ₦${bal.toLocaleString()} (${s.invoiceNumber}) — ${day}`;
            }).join('\n');

            let msg = `${sales.length} invoice(s) are expected to be paid ${timingText}:\n\n${saleList}\n\nTotal expected: ₦${totalBal.toLocaleString()}`;

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
                        subject: `Upcoming Receivables Summary`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>${bossTitle}, here is your upcoming summary:</h2>
                                <p>You have <b>${sales.length}</b> sales expected to be paid <b>${timingText}</b>, totaling <b>₦${totalBal.toLocaleString()}</b>.</p>
                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    ${saleList.replace(/\n/g, '<br>')}
                                </div>
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
