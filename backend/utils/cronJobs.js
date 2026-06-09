const cron = require("node-cron");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage, sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");
const { sendActivationNudgeEmail, sendFinishSetupEmail } = require("../emailLogic/emails");
const { sendIndividualMorningSummary } = require("./summaryService");
const { sendIndividualDebtNudge } = require("./nudgeService");
const { processIndividualEscrowPayout } = require("./payoutService");
const SystemConfig = require("../models/SystemConfig");
const { generateDailyAdvice } = require("./adviceService");
const BackgroundJob = require("../models/BackgroundJob");

/**
 * 0. AUTONOMOUS MORNING DISPATCH (Runs at 8:00 AM WAT)
 * Ensures summaries go out even if the Admin didn't have time to manually approve.
 */
const scheduleMorningSummary = () => {
    // PRIMARY TRIGGER: 8:00 AM WAT
    cron.schedule("0 8 * * *", async () => {
        await executeAutonomousDispatch();
    }, { timezone: "Africa/Lagos" });

    // SECONDARY BACKUP: 8:15 AM WAT (In case server was rebooting at 8:00)
    cron.schedule("15 8 * * *", async () => {
        await executeAutonomousDispatch(true); // 'true' means only catch those who were missed
    }, { timezone: "Africa/Lagos" });
};

const executeAutonomousDispatch = async (isBackup = false) => {
    try {
        console.log(`🌅 [AUTONOMOUS${isBackup ? '-BACKUP' : ''}] Starting Morning Dispatch...`);
        
        // 1. Step 1: Advice Retrieval (Honoring Admin Edits)
        try {
            const config = await SystemConfig.findOne({ key: "daily_advice" });
            const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
            
            const isStale = !config || !config.lastUpdated || config.lastUpdated < startOfToday;
            const hasDraft = config && config.value?.adviceText;
            
            const previousTone = config?.value?.tone || "English";
            if (isStale || !hasDraft) {
                console.log(`🧠 Advice is stale or missing. Generating fresh Masterclass for autopilot in ${previousTone}...`);
                await generateDailyAdvice(previousTone); 
            } else {
                console.log("📜 Today's draft already exists. Using it for autonomous dispatch...");
            }
            
            // Ensure status is approved for the jobs
            await SystemConfig.findOneAndUpdate(
                { key: "daily_advice" },
                { status: "approved" }
            );
        } catch (aiErr) {
            console.error("⚠️ AI Advice Failed, using hardcoded fallback:", aiErr.message);
            // Ensure we at least have 'something' so summaries can send
            await SystemConfig.findOneAndUpdate(
                { key: "daily_advice" },
                { 
                    value: { 
                        adviceText: `Cashflow is King. Profit is just paper, but cash pays the bills and buys stock. Record every kobo that enters your hand today. Let's win!`,
                        tone: "English"
                    },
                    status: "approved",
                    lastUpdated: new Date()
                },
                { upsert: true }
            );
        }

        // 2. Step 2: Individual Merchant Dispatch
        // Expanded to include Group 3 (Onboarded but not yet connected)
        const profiles = await BusinessProfile.find({ 
            onboardingStep: { $gte: 0 } 
        });

        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
        
        let queuedCount = 0;
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
                queuedCount++;
            }
        }
        
        if (queuedCount > 0) {
            console.log(`✅ [AUTONOMOUS] Successfully queued ${queuedCount} reports.`);
        } else if (!isBackup) {
            console.log("ℹ️ [AUTONOMOUS] No new reports to queue (All caught up).");
        }

    } catch (err) {
        console.error("❌ Critical Autonomous Dispatch Failure:", err.message);
    }
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
                    const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Boss";
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
                const title = acquired.businessId.assistantSettings?.preferredName || acquired.businessId.displayName || planTitle;

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

                    msg += `💰 *Debt Details:* \n- Customer: ${sale.customerName}\n- Item: ${sale.description}\n- Balance: ₦${bal.toLocaleString()}\n- Issued: ${new Date(sale.createdAt).toLocaleDateString()}\n- Link: ${APP_URL}/i/${sale.invoiceNumber}\n\n`;
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
                                    <h2>Hey ${profile.assistantSettings?.preferredName || profile.displayName || "Boss"},</h2>
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
                    const tone = profile.assistantSettings?.reminderTemplate || "friendly";
                    const isPidgin = profile.assistantSettings?.preferredLanguage === "pidgin";
                    
                    let draftBody = "";
                    if (tone === "formal") {
                        draftBody = `Hi ${sale.customerName}, this is a formal notice regarding your outstanding balance of ₦${bal.toLocaleString()} for *${sale.description}*. Please finalize payment to avoid service disruption.`;
                    } else {
                        draftBody = `Hi ${sale.customerName}, just a friendly nudge regarding your balance of ₦${bal.toLocaleString()} for *${sale.description}* with ${profile.displayName}. Hope you're having a great day!`;
                    }

                    const draftHeader = isPidgin
                        ? `📝 *Draft message ready* \n\nCopy this one send to your customer:`
                        : `📝 *Reminder Draft Ready* \n\nCopy and forward the message below to your customer:`;
                    
                    const copyableDraft = `${draftBody}\n\n🔗 *VIEW DETAILS:*\n${APP_URL}/i/${sale.invoiceNumber}`;
                    
                    setTimeout(async () => {
                        // Re-query reminder state to verify it hasn't been snoozed/updated during the delay
                        const currentRem = await Reminder.findById(acquired._id);
                        if (!currentRem || currentRem.status !== "delivered") {
                            return;
                        }

                        if (isInsideWindow) {
                            await sendWhatsAppMessage(acquired.whatsappNumber, draftHeader).catch(e => {});
                            await sendWhatsAppMessage(acquired.whatsappNumber, copyableDraft).catch(e => {});
                        } else {
                            await sendWhatsAppAlert(acquired.whatsappNumber, title, draftHeader).catch(e => {});
                            await sendWhatsAppAlert(acquired.whatsappNumber, title, copyableDraft).catch(e => {});
                        }
                    }, 3000);
                }

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
            // Catch accounts within 3 days of expiry on EITHER the trial OR billing date.
            // This covers: (1) trialing merchants, (2) paid subscribers approaching renewal.
            const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

            const query = await BusinessProfile.find({
                planStatus: { $in: ["trialing", "active", "past_due"] },
                $or: [
                    { trialExpiresAt: { $lte: threeDaysFromNow } },
                    { nextBillingDate: { $lte: threeDaysFromNow } }
                ]
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
 * 8.5 DAILY NOMBA BATCH SETTLEMENTS (11:30 PM Lagos)
 * Sweeps all accumulated merchant balances to save on transfer fees.
 */
const scheduleDailySettlements = () => {
    cron.schedule("30 23 * * *", async () => {
        try {
            const { processDailyNombaSettlements } = require("../controllers/common/nombaController");
            await processDailyNombaSettlements();
        } catch (error) { console.error("Cron Error (Daily Settlements):", error); }
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

                // 🛡️ DEDUPLICATION: Skip if merchant already got a morning summary today
                const alreadyGotSummary = await BackgroundJob.findOne({
                    businessId: bId,
                    type: "MORNING_SUMMARY",
                    status: "completed",
                    createdAt: { $gte: todayStart }
                });

                // Also skip if a task reminder was already delivered today for any of these sales
                const saleIds = sales.map(s => s._id);
                const alreadyGotReminder = await Reminder.findOne({
                    businessId: bId,
                    saleId: { $in: saleIds },
                    status: { $in: ["delivered", "pending"] },
                    triggerDate: { $gte: todayStart }
                });

                if (alreadyGotSummary && alreadyGotReminder) {
                    console.log(`⏩ [DEDUP] Skipping 10AM collection nudge for ${business.displayName} — already notified today.`);
                    continue;
                }

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
                const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || planTitle;
                const msg = `🔓 *Security Update: Lock Lifted!*\n\n${bossTitle}, your bank detail security lock has expired. \n\n⚡ *Instant Settlements* have been resumed for your account. Every payment will now go directly to your bank account again.\n\n_Kreddy is keeping your money moving safely!_ 🛡️`;
                
                await sendWhatsAppAlert(profile.whatsappNumber, bossTitle, msg).catch(e => {});
            }
        } catch (error) { console.error("Cron Error (Bank Lock Checker):", error); }
    });
};

/**
 * 11. BACKGROUND JOB RUNNER (The "Core Motor") - Runs every minute
 * Processes the queue created by both Admin (Manual) and Chron (Auto)
 */
const startBackgroundJobRunner = () => {
    console.log("⏰ Background Job Runner Initialized (Processing every 60s)");
    cron.schedule("* * * * *", async () => {
        try {
            // Find jobs scheduled for now or in the past that are pending
            const pendingJobs = await BackgroundJob.find({
                status: "pending",
                scheduledFor: { $lte: new Date() }
            }).limit(25).sort({ scheduledFor: 1 });

            if (pendingJobs.length === 0) return;

            console.log(`📡 [WORKER] Picking up ${pendingJobs.length} jobs from the queue...`);

            for (const job of pendingJobs) {
                // 1. Lock the job so other workers don't grab it
                const acquired = await BackgroundJob.findOneAndUpdate(
                    { _id: job._id, status: "pending" },
                    { status: "processing", attempts: (job.attempts || 0) + 1 }
                );
                
                if (!acquired) continue;

                try {
                    // 2. Dispatch based on type
                    console.log(`🚀 Processing ${job.type} for ${job.businessId}...`);
                    let result = { status: "failed", error: "Unknown type" };
                    switch (job.type) {
                        case "MORNING_SUMMARY":
                            result = await sendIndividualMorningSummary(job.businessId);
                            break;
                        case "TRIAL_EXPIRY":
                            const { sendIndividualPlanAlert } = require('../utils/planAlertService');
                            const profile = await BusinessProfile.findById(job.businessId);
                            result = profile
                                ? await sendIndividualPlanAlert({
                                    type: null, // Let planAlertService calculate based on expiry date
                                    profileId: job.businessId,
                                    whatsappNumber: profile.whatsappNumber
                                })
                                : { status: 'skipped', reason: 'Profile not found' };
                            break;
                        case "DEBT_NUDGE":
                            result = await sendIndividualDebtNudge(job.data);
                            break;
                        case "ESCROW_PAYOUT":
                            result = await processIndividualEscrowPayout(job.data?.escrowId);
                            break;
                        // Add more types here as we grow
                    }

                    // 3. Finalize Job
                    if (result.status === "completed" || result.status === "skipped" || result.status === "sent") {
                        job.status = "completed";
                        job.completedAt = new Date();
                        job.error = null;
                    } else {
                        job.status = job.attempts >= 3 ? "failed" : "pending"; // Simple retry logic
                        job.error = result.error || "Execution failed";
                    }
                    await job.save();

                } catch (execErr) {
                    console.error(`❌ Worker Execution Error (Job ${job._id}):`, execErr.message);
                    job.status = job.attempts >= 3 ? "failed" : "pending";
                    job.error = execErr.message;
                    await job.save();
                }
            }
        } catch (err) {
            console.error("❌ Critical Background Worker Failure:", err.message);
        }
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
    scheduleBankLockChecker,
    scheduleDailySettlements,
    startBackgroundJobRunner
};
