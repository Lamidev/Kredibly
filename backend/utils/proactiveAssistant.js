const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const WhatsAppSession = require("../models/WhatsAppSession");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

/**
 * The Brain of Proactive Notifications.
 * Checks for upcoming debts, overdue payments, and granular reminders (in X mins).
 */
const checkAndNotify = async () => {
    try {
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date();
        tomorrowEnd.setDate(now.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        /**
         * 1. FIND UPCOMING/OVERDUE DEBTS (Daily/Tomorrow Nudges)
         */
        const upcomingDebts = await Sale.find({
            status: { $ne: "paid" },
            dueDate: { $gte: todayStart, $lte: tomorrowEnd },
            $or: [
                { lastAutoReminderSent: { $lt: todayStart } },
                { lastAutoReminderSent: { $exists: false } }
            ]
        }).populate("businessId");

        // Group by Business
        const groupedByBusiness = upcomingDebts.reduce((acc, sale) => {
            const bId = sale.businessId?._id?.toString();
            if (!bId) return acc;
            if (!acc[bId]) acc[bId] = { business: sale.businessId, sales: [] };
            acc[bId].sales.push(sale);
            return acc;
        }, {});

        for (const bId in groupedByBusiness) {
            const { business, sales } = groupedByBusiness[bId];
            if (business && business.whatsappNumber && business.assistantSettings?.enableReminders !== false) {
                if (sales.length === 1) {
                    const sale = sales[0];
                    const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);
                    const isDueToday = sale.dueDate.toDateString() === now.toDateString();

                    const message = isDueToday
                        ? `👀 *Friendly Nudge: ${sale.customerName} is due today!* \n💰 Balance: *₦${balance.toLocaleString()}* \n\nThey promised to pay by today. Shall we send them a professional reminder link? 📲 \n\n_Type "D ${sale.customerName}" to get the link!_`
                        : `👋 *Looking out for you!* \n\nJust a quick heads-up that *${sale.customerName}* is expected to pay *₦${balance.toLocaleString()}* tomorrow. I'll let you know if anything changes! 🛡️`;

                    await sendWhatsAppMessage(business.whatsappNumber, message);
                    sale.lastAutoReminderSent = new Date();
                    await sale.save();
                } else {
                    // Grouped Message
                    let summaryMsg = `📑 *Daily Debt Summary for ${business.displayName}* \n\nYou have *${sales.length}* payments due today/tomorrow:\n\n`;
                    sales.forEach((s, i) => {
                        const bal = s.totalAmount - s.payments.reduce((sum, p) => sum + p.amount, 0);
                        const day = s.dueDate.toDateString() === now.toDateString() ? "TODAY" : "TOMORROW";
                        summaryMsg += `${i + 1}. *${s.customerName}* - ₦${bal.toLocaleString()} (${day})\n`;
                    });
                    summaryMsg += `\nWhich one should I draft a message for? (Type "Draft [Name]" or "Draft All") 🛡️`;

                    await sendWhatsAppMessage(business.whatsappNumber, summaryMsg);
                    
                    // Mark all as notified
                    for (const s of sales) {
                        s.lastAutoReminderSent = new Date();
                        await s.save();
                    }
                }
            }
        }

        /**
         * 2. FIND GRANULAR REMINDERS (The "Remind me in 5 mins" type)
         * These are reminders where dueDate is NOW or slightly in the past,
         * but we haven't sent a punchy 'Alarm' style notification yet.
         */
        const granularReminders = await Sale.find({
            status: { $ne: "paid" },
            dueDate: { $lte: now },
            $expr: {
                $or: [
                    { $not: ["$lastAutoReminderSent"] }, // Field doesn't exist
                    { $lt: ["$lastAutoReminderSent", "$dueDate"] } // Reminder was for an OLDER date
                ]
            }
        }).populate("businessId");

        for (const sale of granularReminders) {
            const business = sale.businessId;
            if (business && business.whatsappNumber) {
                const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);
                const invoiceLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/i/${sale.invoiceNumber}`;
                
                // Drafted message for the debtor
                const debtorMsg = `Hi ${sale.customerName}, this is a friendly reminder for your balance of ₦${balance.toLocaleString()} with ${business.displayName}. You can view and pay here: ${invoiceLink}`;

                const alarmMsg = `⏰ *Kreddy Alarm: Time is up for ${sale.customerName}!* \n\nYou asked me to remind you about this *₦${balance.toLocaleString()}* payment now.\n\n🔗 *Invoice:* ${invoiceLink}\n\n*Draft for Customer:* \n_"${debtorMsg}"_\n\nShall I send this link to them for you? (Reply "Yes" or type "D ${sale.customerName}")`;
                
                await sendWhatsAppMessage(business.whatsappNumber, alarmMsg);

                // PERSIST context so 'Yes' works
                await WhatsAppSession.findOneAndUpdate(
                    { whatsappNumber: business.whatsappNumber },
                    {
                        type: 'alarm_confirmation',
                        data: { 
                            saleId: sale._id, 
                            customerName: sale.customerName, 
                            balance,
                            debtorMsg
                        },
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
                    },
                    { upsert: true }
                );

                sale.lastAutoReminderSent = new Date(); 
                await sale.save();
            }
        }

    } catch (error) {
        console.error("Proactive Assistant Error:", error);
    }
};

const startProactiveAssistant = () => {
    console.log("⏰ Kreddy Proactive Assistant Started (Checking every 1 min)");
    
    // Run immediately on server start
    checkAndNotify();

    // Then run every 1 minute
    setInterval(checkAndNotify, 60 * 1000); 
};

module.exports = { startProactiveAssistant };
