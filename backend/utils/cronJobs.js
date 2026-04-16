const cron = require("node-cron");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage, sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");
const { sendActivationNudgeEmail, sendFinishSetupEmail } = require("../emailLogic/emails");
const { sendIndividualMorningSummary } = require("./summaryService");
const SystemConfig = require("../models/SystemConfig");
const { generateDailyAdvice } = require("./adviceService");
const BackgroundJob = require("../models/BackgroundJob");

/**
 * 0. AUTONOMOUS MORNING DISPATCH (Runs at 8:00 AM WAT)
 * Ensures summaries go out even if the Admin didn't have time to manually approve.
 */
const scheduleMorningSummary = () => {
    cron.schedule("0 8 * * *", async () => {
        try {
            console.log("🌅 [AUTONOMOUS] Starting 8 AM Morning Dispatch...");
            
            // 1. Ensure a tip exists for today
            const config = await SystemConfig.findOne({ key: "daily_advice" });
            if (!config || (new Date() - new Date(config.lastUpdated)) > (20 * 60 * 60 * 1000)) {
                await generateDailyAdvice();
            }

            // 2. Auto-Approve if pending
            await SystemConfig.findOneAndUpdate(
                { key: "daily_advice" },
                { status: "approved", lastUpdated: new Date() }
            );

            // 3. Queue Jobs for everyone who doesn't have a job today yet
            const profiles = await BusinessProfile.find({ isSetup: true });
            const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);

            for (const p of profiles) {
                const exists = await BackgroundJob.findOne({
                    businessId: p._id,
                    type: "MORNING_SUMMARY",
                    createdAt: { $gte: startOfToday }
                });

                if (!exists) {
                    await BackgroundJob.create({
                        businessId: p._id,
                        type: "MORNING_SUMMARY",
                        status: "pending",
                        scheduledFor: new Date()
                    });
                }
            }
            console.log(`✅ [AUTONOMOUS] Queued reports for ${profiles.length} merchants.`);
        } catch (err) {
            console.error("Autonomous Dispatch Error:", err.message);
        }
    }, { timezone: "Africa/Lagos" });
};

/**
 * 1. TASK REMINDERS WORKER (Runs every minute)
 */
const scheduleRemindersWorker = () => {
    cron.schedule("* * * * *", async () => {
        try {
            // ---------------------------------------------------------
            // PART 1: Proactive 15-Minute "Heads-up" for Upcoming Tasks
            // ---------------------------------------------------------
            const headsUpTime = new Date(Date.now() + 15 * 60 * 1000); 
            const upcomingHeadsUps = await Reminder.find({
                status: "pending",
                isHeadsUpSent: false,
                type: { $in: ["meeting", "personal"] },
                triggerDate: { $lte: headsUpTime, $gt: new Date() }
            }).populate("businessId");

            for (const headsUp of upcomingHeadsUps) {
                try {
                    const profile = headsUp.businessId;
                    if (!profile) {
                        headsUp.status = "failed";
                        headsUp.error = "Orphaned reminder: No business profile linked";
                        await headsUp.save();
                        continue;
                    }
                    const bossTitle = profile.assistantSettings?.preferredName || "Boss";
                    const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
                    const isProUser = profile.plan === "oga" || profile.plan === "chairman";

                    const headsUpMsg = `🔔 *Quick Heads-up, ${bossTitle}!* \n\nIn 15 minutes, you have a task coming up: *"${headsUp.description}"*.\n\n_Standing by to help you crush it!_ 🛡️`;

                    if (isInsideWindow) {
                        await sendWhatsAppMessage(headsUp.whatsappNumber, headsUpMsg);
                        console.log(`✅ [FREE-FORM] 15m Heads-up sent for ${profile.displayName}`);
                    } else if (isProUser) {
                        await sendWhatsAppAlert(headsUp.whatsappNumber, bossTitle, headsUpMsg);
                        console.log(`💰 [PAID-TEMPLATE] 15m Heads-up forced for ${profile.displayName}`);
                    }

                    headsUp.isHeadsUpSent = true;
                    await headsUp.save();
                } catch (err) {
                    console.error("Heads-up delivery error:", err.message);
                }
            }

            // ---------------------------------------------------------
            // PART 2: Actual Time Reminders
            // ---------------------------------------------------------
            const pendingReminders = await Reminder.find({
                status: "pending",
                triggerDate: { $lte: new Date() }
            }).populate("businessId").populate("saleId");

            for (const reminder of pendingReminders) {
                const acquired = await Reminder.findOneAndUpdate(
                    { _id: reminder._id, status: "pending" },
                    { status: "processing" }
                ).populate("businessId").populate("saleId");
                
                if (!acquired) continue;

                if (!acquired.businessId) {
                    acquired.status = "delivered";
                    acquired.deliveredAt = new Date();
                    await acquired.save();
                    continue;
                }

                const plan = acquired.businessId.plan || "hustler";
                const planTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                const title = acquired.businessId.assistantSettings?.preferredName || planTitle;

                const typeIcons = { debt: "⏳", task: "📝", meeting: "🤝", personal: "💡" };
                const icon = typeIcons[reminder.type] || "🔔";

                let msg = `${icon} *Kreddy Reminder!* \n\n${title}, you asked me to remind you to:\n*"${acquired.description}"*\n\n`;

                if (acquired.saleId) {
                    const sale = acquired.saleId;
                    const bal = sale.totalAmount - (sale.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    
                    if (bal <= 0) {
                        acquired.status = "delivered";
                        await acquired.save();
                        continue;
                    }

                    msg += `💰 *Debt Details:* \n- Customer: ${sale.customerName}\n- Balance: ₦${bal.toLocaleString()}\n- Link: ${APP_URL}/i/${sale.invoiceNumber}\n\n`;
                    msg += `*Forward this link to them to collect payment!* 💸\n\n`;
                }

                msg += `Let's get it done! 🚀\n\n_Reply "snooze 10 mins" if you are running late!_`;

                console.log(`⏰ Processing Reminder [${acquired._id}] for ${title} (${acquired.whatsappNumber})...`);

                const profile = acquired.businessId;
                const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
                const isProUser = profile.plan === "oga" || profile.plan === "chairman";

                let success = false;
                
                if (isInsideWindow) {
                    // 🟢 Free Message (Inside 24h Window)
                    success = await sendWhatsAppMessage(acquired.whatsappNumber, msg).catch(e => false);
                } else if (isProUser) {
                    // 🟠 Paid Template (Pro User + Window Closed) — Opens the window for the day!
                    success = await sendWhatsAppAlert(acquired.whatsappNumber, title, msg).catch(e => false);
                } else {
                    // 🔴 Email Only (Free User + Window Closed)
                    const { sendEmail } = require("./emailService");
                    const user = await require("../models/User").findById(profile.ownerId);
                    
                    if (user && user.email) {
                        await sendEmail({
                            to: user.email,
                            subject: `🔔 Task Reminder: ${title}`,
                            html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2>Hey ${profile.assistantSettings?.preferredName || "Boss"},</h2>
                                    <p>You set a reminder for: <b>"${acquired.description}"</b></p>
                                    <p>Kreddy is reminding you to get it done! 🛡️</p>
                                    <hr />
                                    <p style="font-size: 12px; color: #777;">Tip: Reply to Kreddy on WhatsApp to get these alerts there instantly!</p>
                                   </div>`
                        });
                        console.log(`📪 [EMAIL-SENT] Reminder [${acquired._id}] sent to inbox.`);
                    }
                    success = true; 
                }

                if (success) {
                    console.log(`✅ Reminder [${acquired._id}] delivered to ${acquired.whatsappNumber}`);
                    acquired.status = "delivered";
                    acquired.deliveredAt = new Date();
                    acquired.error = null;
                } else {
                    console.error(`❌ Reminder [${acquired._id}] FAILED to deliver (check Template/Meta logs)`);
                    acquired.status = "failed";
                    acquired.error = "WhatsApp Template Delivery Failed";
                }

                await acquired.save();

                if (success && acquired.saleId) {
                    const sale = acquired.saleId;
                    const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    const draftMsg = `Hi ${sale.customerName}, this is a friendly reminder regarding your balance of ₦${bal.toLocaleString()} with ${acquired.businessId.displayName}. You can view and pay here: ${APP_URL}/i/${sale.invoiceNumber}`;
                    
                    setTimeout(async () => {
                        await sendWhatsAppAlert(acquired.whatsappNumber, title, draftMsg).catch(e => {});
                    }, 1000);
                }

                acquired.status = "delivered";
                acquired.deliveredAt = new Date();
                await acquired.save();

                if (acquired.recurrence && acquired.recurrence !== "none") {
                    const nextDate = new Date(acquired.triggerDate);
                    if (acquired.recurrence === "daily") nextDate.setDate(nextDate.getDate() + 1);
                    else if (acquired.recurrence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
                    else if (acquired.recurrence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

                    await Reminder.create({
                        businessId: acquired.businessId._id,
                        whatsappNumber: acquired.whatsappNumber,
                        description: acquired.description,
                        type: acquired.type,
                        recurrence: acquired.recurrence,
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
 * 3. PLAN & TRIAL EXPIRY (9:00 AM Lagos)
 */
const schedulePlanExpiryReminders = () => {
    cron.schedule("0 9 * * *", async () => {
        try {
            const now = new Date();
            const query = await BusinessProfile.find({
                planStatus: { $in: ["trialing", "active", "past_due"] }
            });

            for (const profile of query) {
                await BackgroundJob.create({
                    type: "TRIAL_EXPIRY",
                    businessId: profile._id,
                    status: "pending",
                    data: { checkDate: now }
                });
            }
        } catch (error) { console.error("Cron Job Error (Plan Expiry):", error); }
    }, { timezone: "Africa/Lagos" });
};

/**
 * 4. PROACTIVE "DID THEY PAY?" (Hourly)
 */
const scheduleProactiveFollowUps = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            const rangeStart = new Date(Date.now() - 25 * 60 * 60 * 1000);
            const rangeEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const pastReminders = await Reminder.find({
                status: "delivered",
                type: "debt",
                saleId: { $ne: null },
                deliveredAt: { $gte: rangeStart, $lte: rangeEnd }
            });

            for (const reminder of pastReminders) {
                 await BackgroundJob.create({
                    type: "DEBT_NUDGE",
                    businessId: reminder.businessId,
                    status: "pending",
                    data: { type: "proactive_followup", reminderId: reminder._id, whatsappNumber: reminder.whatsappNumber }
                });
            }
        } catch (error) { console.error("Cron Error (Follow-up Queuer):", error); }
    });
};

/**
 * 5. PAST DUE ESCALATION (12:00 PM Lagos)
 */
const schedulePastDueEscalations = () => {
    cron.schedule("0 12 * * *", async () => {
        try {
            const yesterdayStart = new Date(); yesterdayStart.setDate(yesterdayStart.getDate() - 1); yesterdayStart.setHours(0,0,0,0);
            const yesterdayEnd = new Date(yesterdayStart); yesterdayEnd.setHours(23,59,59,999);

            const overdueSales = await Sale.find({
                status: "unpaid",
                dueDate: { $gte: yesterdayStart, $lte: yesterdayEnd }
            }).populate("businessId");

            for (const sale of overdueSales) {
                if (!sale.businessId || sale.businessId.plan === "hustler" || !sale.businessId.whatsappNumber) continue;
                await BackgroundJob.create({
                    type: "DEBT_NUDGE",
                    businessId: sale.businessId._id,
                    status: "pending",
                    data: { type: "past_due_escalation", saleId: sale._id, whatsappNumber: sale.businessId.whatsappNumber }
                });
            }
        } catch (error) { console.error("Cron Error (Escalation Queuer):", error); }
    }, { timezone: "Africa/Lagos" });
};

/**
 * 6. ESCROW RELEASE (Hourly)
 */
const scheduleEscrowPayouts = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            const EscrowPayment = require("../models/EscrowPayment");
            const readyToRelease = await EscrowPayment.find({
                status: "pending",
                releaseDate: { $lte: new Date() }
            });

            for (const escrow of readyToRelease) {
                const existing = await BackgroundJob.findOne({
                    type: "ESCROW_PAYOUT",
                    "data.escrowId": escrow._id.toString(),
                    status: { $in: ["pending", "processing"] }
                });

                if (!existing) {
                    await BackgroundJob.create({
                        type: "ESCROW_PAYOUT",
                        businessId: escrow.businessId,
                        status: "pending",
                        data: { escrowId: escrow._id.toString() }
                    });
                }
            }
        } catch (error) { console.error("Cron Error (Escrow Queuer):", error); }
    });
};

/**
 * 7. MONTHLY USAGE RESET (1st of Month)
 */
const scheduleMonthlyUsageReset = () => {
    cron.schedule("0 0 1 * *", async () => {
        try {
            await BusinessProfile.updateMany({}, { 
                $set: { 
                    "monthlyUsage.messages": 0,
                    "monthlyUsage.lastReset": new Date()
                }
            });
        } catch (error) { console.error("Cron Error (Usage Reset):", error); }
    });
};

/**
 * 8. QUEUE HOUSEKEEPING (Daily Midnight)
 */
const scheduleQueueHousekeeping = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
            await BackgroundJob.deleteMany({
                status: { $in: ["completed", "cancelled"] },
                createdAt: { $lt: cutoff }
            });
        } catch (error) { console.error("Cron Error (Housekeeping):", error); }
    }, { timezone: "Africa/Lagos" });
};

/**
 * 9. UPCOMING SALES NUDGES (10:00 AM Lagos)
 */
const scheduleUpcomingNudges = () => {
    cron.schedule("0 10 * * *", async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
            const tomorrowEnd = new Date(now); tomorrowEnd.setDate(now.getDate() + 1); tomorrowEnd.setHours(23, 59, 59, 999);

            const upcomingSales = await Sale.find({
                status: { $ne: "paid" },
                dueDate: { $gte: todayStart, $lte: tomorrowEnd },
                $or: [{ lastAutoReminderSent: { $lt: todayStart } }, { lastAutoReminderSent: { $exists: false } }]
            }).populate("businessId");

            const grouped = upcomingSales.reduce((acc, sale) => {
                const bId = sale.businessId?._id?.toString();
                if (bId) {
                    if (!acc[bId]) acc[bId] = [];
                    acc[bId].push(sale);
                }
                return acc;
            }, {});

            for (const bId in grouped) {
                const sales = grouped[bId];
                const business = sales[0].businessId;
                if (!business || !business.whatsappNumber || !business.isKreddyConnected) continue;

                await BackgroundJob.create({
                    type: "DEBT_NUDGE",
                    businessId: bId,
                    status: "pending",
                    data: { type: "upcoming_summary", saleIds: sales.map(s => s._id), whatsappNumber: business.whatsappNumber }
                });
            }
        } catch (error) { console.error("Cron Error (Upcoming Queuer):", error); }
    }, { timezone: "Africa/Lagos" });
};

/**
 * 10. BANK SECURITY LOCK CHECKER (Hourly)
 */
const scheduleBankLockChecker = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            const now = new Date();
            const profilesToUnlock = await BusinessProfile.find({
                "bankDetails.bankDetailsLockUntil": { $lte: now, $ne: null }
            });

            for (const profile of profilesToUnlock) {
                profile.bankDetails.bankDetailsLockUntil = null;
                await profile.save();

                const planTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                const bossTitle = profile.assistantSettings?.preferredName || planTitle;
                const msg = `🔓 *Security Update: Lock Lifted!*\n\n${bossTitle}, your bank detail security lock has expired. \n\n⚡ *Instant Settlements* have been resumed for your account. Every payment will now go directly to your bank account again.\n\n_Kreddy is keeping your money moving safely!_ 🛡️`;
                
                await sendWhatsAppAlert(profile.whatsappNumber, bossTitle, msg).catch(e => {});
            }
        } catch (error) { console.error("Cron Error (Bank Lock Checker):", error); }
    });
};

module.exports = { 
    scheduleMorningSummary, 
    scheduleRemindersWorker, 
    schedulePlanExpiryReminders, 
    scheduleProactiveFollowUps, 
    schedulePastDueEscalations,
    scheduleEscrowPayouts,
    scheduleMonthlyUsageReset,
    scheduleQueueHousekeeping,
    scheduleUpcomingNudges,
    scheduleBankLockChecker
};
