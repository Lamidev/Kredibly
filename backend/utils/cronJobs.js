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
            }).populate("businessId").populate("saleId");

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

                let msg = `${icon} *Kreddy Reminder!* \n\n${title}, you asked me to remind you to:\n*"${reminder.description}"*\n\n`;

                if (reminder.saleId) {
                    const sale = reminder.saleId; // Corrected from typo
                    const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    
                    msg += `💰 *Debt Details:* \n- Customer: ${sale.customerName}\n- Balance: ₦${bal.toLocaleString()}\n- Link: ${APP_URL}/i/${sale.invoiceNumber}\n\n`;
                    msg += `*Forward this link to them to collect payment!* 💸\n\n`;
                }

                msg += `Let's get it done! 🚀`;

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
    // Schedule for 7:00 AM UTC (8:00 AM WAT) every day
    cron.schedule("0 7 * * *", async () => {
        console.log("🌞 Running Morning Chief Summary (8AM WAT)...");
        
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

                // Only send if there was activity OR if it's a Chairman/Oga
                if (salesYesterday.length > 0 || totalCashIn > 0 || profile.plan === 'chairman' || profile.plan === 'oga') {
                    const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                    
                    let msg = `🌞 *Rise and Grind, ${bossTitle}!* \n\nHere is your *Kredibly Intelligence Summary* for yesterday:\n\n`;
                    msg += `💰 *Cash Collected:* ₦${totalCashIn.toLocaleString()}\n`;
                    msg += `📑 *New Sales:* ${salesYesterday.length}\n`;
                    msg += `⏳ *New Credit:* ₦${pendingFromYesterday.toLocaleString()}\n\n`;

                    if (totalCashIn > 50000 && profile.plan !== 'hustler') {
                        msg += `🔥 *Yesterday was a strong day! Keep that energy up today.* 🚀\n\n`;
                    } else if (salesYesterday.length === 0) {
                        msg += `💡 *No new sales recorded yesterday. Remember to track every kobo today!* 🛡️\n\n`;
                    }

                    // ADD OUTSTANDING DEBTS (Top 3) for premium plans
                    if (profile.plan !== 'hustler') {
                        const topDebtors = await Sale.find({
                            businessId: profile._id,
                            status: { $ne: "paid" }
                        }).sort({ totalAmount: -1 }).limit(3);

                        if (topDebtors.length > 0) {
                            msg += `🔴 *Top Outstanding Balances:*\n`;
                            topDebtors.forEach(d => {
                                const bal = d.totalAmount - d.payments.reduce((sum, p) => sum + p.amount, 0);
                                const dueStr = d.dueDate ? ` (Due: ${new Date(d.dueDate).toLocaleDateString()})` : "";
                                msg += `• ${d.customerName}: ₦${bal.toLocaleString()}${dueStr}\n`;
                            });
                            msg += `\n`;
                        }
                    }

                    // ADD AGENDA FOR PREMIUM PLANS
                    if (profile.plan !== 'hustler') {
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

                    msg += `Check full details on your dashboard: ${process.env.FRONTEND_URL || 'https://usekredibly.com'}`;

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

/**
 * PLAN EXPIRY REMINDERS (10:00 AM WAT / 9:00 AM UTC Daily)
 */
const schedulePlanExpiryReminders = () => {
    cron.schedule("0 9 * * *", async () => {
        console.log("💳 Checking for expiring plans...");
        try {
            const now = new Date();
            const threeDaysLimit = new Date(); threeDaysLimit.setDate(threeDaysLimit.getDate() + 3);
            
            // Find active plans expiring soon
            const expiringSoon = await BusinessProfile.find({
                plan: { $in: ["oga", "chairman"] },
                planStatus: "active",
                nextBillingDate: { $lte: threeDaysLimit, $gt: now }
            });

            for (const profile of expiringSoon) {
                const expiry = new Date(profile.nextBillingDate);
                const diffTime = expiry.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                const planName = profile.plan.toUpperCase();

                let msg = "";
                if (diffDays === 3) {
                    msg = `💳 *Plan Update, ${bossTitle}!* \n\nYour *${planName}* plan expires in 3 days. Renew now to keep your Kreddy AI powered up! 🚀\n\n🔗 *Quick Renew:* Just say _"I want to renew my plan"_ here on WhatsApp!`;
                } else if (diffDays === 1) {
                    msg = `⚠️ *Final Reminder, ${bossTitle}!* \n\nYour *${planName}* plan expires tomorrow. Don't let your business automation pause! 🛡️\n\n🔗 *Quick Renew:* Just say _"Pay for my ${profile.plan}"_!`;
                }

                if (msg && profile.whatsappNumber) {
                    await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Expiry Alert Fail:", e));
                }
            }

            // Also check for newly expired plans
            const justExpired = await BusinessProfile.find({
                plan: { $in: ["oga", "chairman"] },
                planStatus: "active",
                nextBillingDate: { $lte: now }
            });

            for (const profile of justExpired) {
                profile.planStatus = 'past_due';
                await profile.save();

                const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                const msg = `🚨 *Plan Expired, ${bossTitle}!* \n\nYour premium features have paused. Renew now to continue tracking debt with AI without limits! 💰\n\n🔗 *Upgrade Now:* Just say _"I want to pay for ${profile.plan}"_`;
                
                if (profile.whatsappNumber) {
                    await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Expired Alert Fail:", e));
                }
            }
        } catch (error) {
            console.error("Cron Job Error (Plan Expiry):", error);
        }
    });
};

/**
 * PROACTIVE "DID THEY PAY?" CHECK (Runs Hourly)
 * Checks reminders from 24 hours ago. If the debt is still UNPAID, it prompts the merchant.
 */
const scheduleProactiveFollowUps = () => {
    cron.schedule("0 * * * *", async () => {
        console.log("🕵️‍♀️ Running Proactive Follow-up Check...");
        try {
            const twentyFourHoursAgoStart = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
            const twentyFourHoursAgoEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);   // 24 hours ago

            // Find reminders that fired exactly between 24-25 hours ago
            const pastReminders = await Reminder.find({
                status: "delivered",
                type: "debt",
                saleId: { $ne: null },
                deliveredAt: { $gte: twentyFourHoursAgoStart, $lte: twentyFourHoursAgoEnd }
            }).populate("businessId").populate("saleId");

            for (const reminder of pastReminders) {
                const sale = reminder.saleId;
                if (!sale || sale.status === "paid" || !reminder.businessId) continue;

                const profile = reminder.businessId;
                const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);

                const msg = `🤔 *Did They Pay, ${bossTitle}?*\n\nYesterday, you had a reminder to collect from *${sale.customerName}*.\n\nMy records show they still owe *₦${bal.toLocaleString()}*. \n\nDid they pay offline? If yes, just say: _"${sale.customerName} paid"_. \n\nIf not, would you like me to snooze this reminder for later, or send them another message?`;
                
                if (reminder.whatsappNumber) {
                    await sendWhatsAppMessage(reminder.whatsappNumber, msg).catch(e => console.error("Proactive Alert Fail:", e));
                }
            }
        } catch (error) {
            console.error("Cron Job Error (Proactive Check):", error);
        }
    });
};

module.exports = { scheduleMorningSummary, scheduleRemindersWorker, schedulePlanExpiryReminders, scheduleProactiveFollowUps };
