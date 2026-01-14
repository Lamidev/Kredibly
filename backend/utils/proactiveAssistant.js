const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

const startProactiveAssistant = () => {
    // Run every 6 hours (simple but effective for MVP)
    setInterval(async () => {
        try {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Find unpaid sales with due date between now and end of tomorrow
            // and haven't had an auto-reminder sent TODAY
            const upcomingDebts = await Sale.find({
                status: { $ne: "paid" },
                dueDate: { $gte: todayStart, $lte: tomorrow },
                $or: [
                    { lastAutoReminderSent: { $lt: todayStart } },
                    { lastAutoReminderSent: { $exists: false } }
                ]
            }).populate("businessId");

            for (const sale of upcomingDebts) {
                const business = sale.businessId;
                if (business && business.whatsappNumber && business.assistantSettings?.enableReminders !== false) {
                    const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);
                    const isDueToday = sale.dueDate.toDateString() === now.toDateString();

                    const message = isDueToday
                        ? `👀 *Friendly Nudge: ${sale.customerName} is due today!*\n💰 Balance: *₦${balance.toLocaleString()}*\n\nThey promised to pay by today. Shall we send them a professional reminder link? 📲\n\n_Type "D ${sale.customerName}" to get the link!_`
                        : `👋 *Looking out for you!*\n\nJust a quick heads-up that *${sale.customerName}* is expected to pay *₦${balance.toLocaleString()}* tomorrow. I'll let you know if anything changes! 🛡️`;

                    await sendWhatsAppMessage(business.whatsappNumber, message);

                    sale.lastAutoReminderSent = new Date();
                    await sale.save();
                }
            }
        } catch (error) {
            // Silently fail in background
        }
    }, 6 * 60 * 60 * 1000); // 6 hours
};

module.exports = { startProactiveAssistant };
