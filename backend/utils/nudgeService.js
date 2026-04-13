const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");

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
            const bossTitle = profile.assistantSettings?.preferredName || planFTitle;
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

            const msg = `🤔 *Did They Pay, ${bossTitle}?*\n\nYesterday, you had a reminder to collect from *${sale.customerName}*.\n\nMy records show they still owe *₦${bal.toLocaleString()}*. \n\nDid they pay offline? If yes, just say: _"${sale.customerName} paid"_. \n\nIf not, would you like me to snooze this reminder for later, or send them another message?`;
            
            await sendWhatsAppAlert(whatsappNumber, bossTitle, msg);
            return { status: "completed" };

        } else if (type === "past_due_escalation") {
            const sale = await Sale.findById(saleId).populate("businessId");
            if (!sale || sale.status === "paid") return { status: "skipped" };

            const profile = sale.businessId;
            const planETitle = profile.plan === "chairman" ? "Chairman" : "Oga";
            const bossTitle = profile.assistantSettings?.preferredName || planETitle;
            const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
            
            const msg = `🚩 *Overdue Alert, ${bossTitle}!*\n\n*${sale.customerName}* was supposed to pay ₦${bal.toLocaleString()} yesterday, but the record is still unpaid.\n\nShould I draft a follow-up link for you to forward to them? \n\n_Type: "Send link to ${sale.customerName}"_`;
            
            await sendWhatsAppAlert(whatsappNumber, bossTitle, msg);
            return { status: "completed" };
        } else if (type === "upcoming_summary") {
            const { saleIds } = data;
            const sales = await Sale.find({ _id: { $in: saleIds } }).populate("businessId");
            if (!sales.length) return { status: "skipped" };

            const profile = sales[0].businessId;
            const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
            const tone = profile.assistantSettings?.reminderTemplate || "friendly";

            const totalBal = sales.reduce((sum, s) => sum + (s.totalAmount - s.payments.reduce((pSum, p) => pSum + p.amount, 0)), 0);
            
            let msg = tone === "friendly"
                ? `🌞 *Good Morning ${bossTitle}!* \n\nYou have *${sales.length}* sales expected to be paid today or tomorrow, totaling *₦${totalBal.toLocaleString()}*.\n\nI'm monitoring them for you! 🛡️`
                : `📊 *Receivables Intelligence Summary*\n\nInfrastructure is monitoring *${sales.length}* sales due in this 48h period. \n\nTotal value: *₦${totalBal.toLocaleString()}*. \n\nStanding by for collection instructions. 🛡️`;

            await sendWhatsAppAlert(whatsappNumber, bossTitle, msg);
            return { status: "completed" };
        }

        return { status: "failed", error: "Invalid nudge type" };

    } catch (err) {
        console.error("Nudge Service Error:", err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { sendIndividualDebtNudge };
