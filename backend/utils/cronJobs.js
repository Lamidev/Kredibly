const cron = require("node-cron");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

/**
 * TASK REMINDERS WORKER (Runs every minute)
 */
const scheduleRemindersWorker = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const pendingReminders = await Reminder.find({
                status: "pending",
                triggerDate: { $lte: new Date() }
            }).populate("businessId");

            for (const reminder of pendingReminders) {
                if (!reminder.businessId) {
                    reminder.status = "delivered";
                    reminder.deliveredAt = new Date();
                    await reminder.save();
                    continue;
                }

                const plan = reminder.businessId.plan || "hustler";
                let title = "Boss";
                if (plan === "oga") title = "Oga";
                if (plan === "chairman") title = "Chairman";

                const typeIcons = {
                    debt: "⏳",
                    task: "📝",
                    meeting: "🤝",
                    personal: "💡"
                };
                const icon = typeIcons[reminder.type] || "🔔";

                const msg = `${icon} *Kreddy Reminder!* \n\n${title}, you asked me to remind you to:\n*"${reminder.description}"*\n\nLet's get it done! 🚀`;

                await sendWhatsAppMessage(reminder.whatsappNumber, msg).catch(e => {
                    console.error(`Failed to send reminder to ${reminder.whatsappNumber}:`, e.message);
                });

                reminder.status = "delivered";
                reminder.deliveredAt = new Date();
                await reminder.save();

                // --- RECURRENCE LOGIC ---
                if (reminder.recurrence && reminder.recurrence !== "none") {
                    const nextDate = new Date(reminder.triggerDate);
                    if (reminder.recurrence === "daily") nextDate.setDate(nextDate.getDate() + 1);
                    else if (reminder.recurrence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
                    else if (reminder.recurrence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

                    await Reminder.create({
                        businessId: reminder.businessId._id,
                        whatsappNumber: reminder.whatsappNumber,
                        description: reminder.description,
                        type: reminder.type,
                        recurrence: reminder.recurrence,
                        triggerDate: nextDate,
                        status: "pending"
                    });
                }
            }
        } catch (error) {
            console.error("Cron Job Error (Reminders Worker):", error);
        }
    });
};

/**
 * MORNING CHIEF SUMMARY (8:00 AM Daily)
 * Sends a summary of yesterday's performance to the Business Owner.
 */
const scheduleMorningSummary = () => {
    // Schedule for 8:00 AM every day
    cron.schedule("0 8 * * *", async () => {
        console.log("🌞 Running Morning Chief Summary...");
        
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const startOfYesterday = new Date(yesterday);
            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            const profiles = await BusinessProfile.find({ whatsappNumber: { $exists: true, $ne: "" } });

            for (const profile of profiles) {
                // Fetch sales made yesterday
                const salesYesterday = await Sale.find({
                    businessId: profile._id,
                    createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
                });

                // Fetch total cash received yesterday (from any sale)
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

                let totalBilled = 0;
                let pendingFromYesterday = 0;
                salesYesterday.forEach(s => {
                    totalBilled += s.totalAmount;
                    const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                    pendingFromYesterday += Math.max(0, s.totalAmount - paid);
                });

                // Only send if there was activity OR if it's a Chairman
                if (salesYesterday.length > 0 || totalCashIn > 0 || profile.plan === 'chairman') {
                    const greetings = {
                        hustler: "Morning Chief!",
                        oga: "Good morning, Oga!",
                        chairman: "Respect, Chairman!"
                    };

                    const greeting = greetings[profile.plan] || "Good morning!";
                    
                    let msg = `🌞 *${greeting}* \n\nHere is your *Kredibly Summary* for yesterday:\n\n`;
                    msg += `💰 *Cash Collected:* ₦${totalCashIn.toLocaleString()}\n`;
                    msg += `📑 *New Sales:* ${salesYesterday.length}\n`;
                    msg += `⏳ *New Credit Given:* ₦${pendingFromYesterday.toLocaleString()}\n\n`;

                    if (totalCashIn > 50000 && profile.plan !== 'hustler') {
                        msg += `🔥 *Yesterday was a strong day! Keep that energy up today.* 🚀\n\n`;
                    } else if (salesYesterday.length === 0) {
                        msg += `💡 *No new sales recorded yesterday. Remember to track every kobo today!* 🛡️\n\n`;
                    }

                    // ADD AGENDA FOR CHAIRMEN
                    if (profile.plan === 'chairman') {
                        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
                        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
                        const todaysReminders = await Reminder.find({
                            businessId: profile._id,
                            triggerDate: { $gte: todayStart, $lte: todayEnd },
                            status: "pending"
                        });
                        
                        if (todaysReminders.length > 0) {
                            msg += `📅 *Today's Agenda:*\n`;
                            todaysReminders.forEach(r => {
                                const timeStr = new Date(r.triggerDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                msg += `• ${timeStr}: ${r.description}\n`;
                            });
                            msg += `\n`;
                        }
                    }

                    msg += `Check details on your dashboard: https://usekredibly.com`;

                    await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => {
                        console.error(`Failed to send summary to ${profile.displayName}:`, e.message);
                    });
                }
            }
        } catch (err) {
            console.error("Cron Job Error (Morning Summary):", err);
        }
    });
};

module.exports = { scheduleMorningSummary, scheduleRemindersWorker };
