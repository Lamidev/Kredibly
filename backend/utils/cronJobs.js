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
            // TASK REMINDERS (Triggered at scheduled triggerDate)
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

                const title = acquired.businessId.assistantSettings?.preferredName || acquired.businessId.displayName || "Partner";

                // ─── CUSTOMER REMINDER (Kreddy AI Invoice Delivery) ────────────
                if (acquired.recipientType === "customer" && acquired.recipientPhone) {
                    const { sendInteractiveButtons, sendCustomerMessageWithFallback, sendCustomerReminderTemplate } = require("../utils/customerInvoiceService");
                    let customerSuccess = false;

                    if (acquired.saleId) {
                        const sale = acquired.saleId; // already populated
                        const bal = sale.totalAmount - (sale.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                        
                        // Skip if already paid
                        if (bal <= 0) {
                            acquired.status = "delivered";
                            acquired.deliveredAt = new Date();
                            await acquired.save();
                            continue;
                        }

                        const businessName = acquired.businessId?.displayName || "Your Merchant";
                        const seqLabel = acquired.reminderSequence === 1 ? "Friendly Reminder"
                            : acquired.reminderSequence === 2 ? "Second Reminder"
                            : "Final Reminder";

                        try {
                            const canRequestExt = (sale.extensionsCount || 0) < 2
                                && sale.lifecycleStatus !== "EXTENSION_REQUESTED";

                            if (acquired.reminderSequence === 1) {
                                // ── Sequence 1: Try interactive buttons first ──
                                const dueText = sale.dueDate
                                    ? new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                                    : "On Receipt";
                                const reminderButtons = [
                                    { id: `pay_now:${sale._id}`, title: "Pay with Transfer" }
                                ];
                                if (canRequestExt) {
                                    reminderButtons.push({ id: `req_ext:${sale._id}`, title: "Request Extension" });
                                }

                                const interactiveSent = await sendInteractiveButtons(
                                    acquired.recipientPhone,
                                    `Invoice Reminder #${sale.invoiceNumber}`,
                                    `Hi ${sale.customerName}, this is a reminder from ${businessName} about Invoice #${sale.invoiceNumber}.\n\nAmount outstanding: ₦${bal.toLocaleString()}\nDue: ${dueText}\n\nWhat would you like to do?`,
                                    "",
                                    reminderButtons
                                );

                                if (!interactiveSent) {
                                    // Window closed — fall back to template WITH action buttons
                                    console.log(`⚠️ [${seqLabel}] Interactive buttons failed. Sending full template with action buttons...`);
                                    customerSuccess = await sendCustomerReminderTemplate(
                                        acquired.recipientPhone,
                                        sale,
                                        acquired.businessId,
                                        seqLabel
                                    );
                                } else {
                                    customerSuccess = true;
                                }

                            } else if (acquired.reminderSequence === 2) {
                                // ── Sequence 2: Try interactive first ──
                                const followUpButtons = [
                                    { id: `pay_now:${sale._id}`, title: "Pay with Transfer" }
                                ];
                                if (canRequestExt) {
                                    followUpButtons.push({ id: `req_ext:${sale._id}`, title: "Request Extension" });
                                }

                                const interactiveSent = await sendInteractiveButtons(
                                    acquired.recipientPhone,
                                    `Follow-up: Invoice #${sale.invoiceNumber}`,
                                    `Hi ${sale.customerName}, ${businessName} is following up on Invoice #${sale.invoiceNumber} for ₦${bal.toLocaleString()}.\n\nIf you need more time, tap "Request Extension" below.`,
                                    "",
                                    followUpButtons
                                );

                                if (!interactiveSent) {
                                    console.log(`⚠️ [${seqLabel}] Interactive buttons failed. Sending template with action buttons...`);
                                    customerSuccess = await sendCustomerReminderTemplate(
                                        acquired.recipientPhone,
                                        sale,
                                        acquired.businessId,
                                        seqLabel
                                    );
                                } else {
                                    customerSuccess = true;
                                }

                            } else {
                                // ── Sequence 3 (Final / Due Date): Template always ──
                                const dueLabel = (sale.dueDate && new Date(sale.dueDate).toDateString() === new Date().toDateString())
                                    ? "is due today"
                                    : "is outstanding";

                                const interactiveSent = await sendInteractiveButtons(
                                    acquired.recipientPhone,
                                    `Final Notice: Invoice #${sale.invoiceNumber}`,
                                    `Hi ${sale.customerName}, Invoice #${sale.invoiceNumber} from ${businessName} ${dueLabel}.\n\nBalance: ₦${bal.toLocaleString()}\n\nPlease settle this now.`,
                                    "",
                                    [{ id: `pay_now:${sale._id}`, title: "Pay with Transfer" }]
                                );

                                if (!interactiveSent) {
                                    console.log(`⚠️ [${seqLabel}] Interactive buttons failed. Sending template...`);
                                    customerSuccess = await sendCustomerReminderTemplate(
                                        acquired.recipientPhone,
                                        sale,
                                        acquired.businessId,
                                        seqLabel
                                    );
                                } else {
                                    customerSuccess = true;
                                }
                            }

                        } catch (custErr) {
                            console.error("Customer reminder send error:", custErr.message);
                        }

                        // Update customer reminder count on sale
                        const Sale = require("../models/Sale");
                        await Sale.findByIdAndUpdate(sale._id, {
                            $inc: { customerRemindersSent: 1 },
                            lastCustomerReminderAt: new Date()
                        });
                    }

                    acquired.status = customerSuccess ? "delivered" : "failed";
                    acquired.deliveredAt = customerSuccess ? new Date() : undefined;
                    acquired.error = customerSuccess ? null : "Customer reminder delivery failed";
                    await acquired.save();
                    continue; // Skip merchant notification logic below
                }
                // ─── END CUSTOMER REMINDER ─────────────────────────────────────


                const eventTimeStr = acquired.triggerDate.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                let msg = `You asked me to remind you:\n"${acquired.description}"\n\nTime: ${eventTimeStr}`;

                if (acquired.saleId) {
                    const sale = acquired.saleId;
                    const bal = sale.totalAmount - (sale.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    
                    if (bal <= 0) {
                        acquired.status = "delivered";
                        await acquired.save();
                        continue;
                    }

                    msg = `You asked me to remind you to collect from *${sale.customerName}*:\n"${acquired.description}"\n\nBalance: ₦${bal.toLocaleString()}\nLink: ${APP_URL}/i/${sale.invoiceNumber}`;
                }

                console.log(`⏰ Processing Reminder [${acquired._id}] for ${title} (${acquired.whatsappNumber})...`);

                const profile = acquired.businessId;
                const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);
                const isProUser = profile.plan === "oga" || profile.plan === "chairman";

                // 🏷️ Is this a standalone task reminder (no linked invoice/sale)?
                const isTaskReminder = !acquired.saleId && acquired.recipientType !== "customer";

                let success = false;
                
                if (isInsideWindow) {
                    if (isTaskReminder) {
                        // ⚡ Task Reminder: Send interactive quick-action buttons at trigger time
                        const { sendInteractiveButtons } = require("../utils/customerInvoiceService");
                        const remId = acquired._id.toString();
                        success = await sendInteractiveButtons(
                            acquired.whatsappNumber,
                            acquired.description,
                            msg,
                            "",
                            [
                                { id: `t_done:${remId}`, title: "Mark Done" },
                                { id: `t_snooze30m:${remId}`, title: "Snooze 30 mins" },
                                { id: `t_snooze1h:${remId}`, title: "Snooze 1 hour" }
                            ]
                        ).catch(e => false);

                        // If interactive buttons fail, fallback to plain message
                        if (!success) {
                            success = await sendWhatsAppMessage(acquired.whatsappNumber, msg).catch(e => false);
                        }
                    } else {
                        // 🟢 Debt/Invoice Reminder — Plain text (inside 24h window)
                        success = await sendWhatsAppMessage(acquired.whatsappNumber, msg).catch(e => false);
                    }
                } else {
                    // 🟠 WhatsApp Template (Window Closed) — Deliver paid template alert for all users
                    success = await sendWhatsAppAlert(acquired.whatsappNumber, title, msg).catch(e => false);
                }

                if (success) {
                    console.log(`✅ Reminder [${acquired._id}] delivered to ${acquired.whatsappNumber}`);
                    // ⚡ Task reminders: keep status "pending" so buttons (Mark Done / Snooze) stay actionable.
                    // They will be marked "delivered" once the merchant taps a button.
                    if (!isTaskReminder || !isInsideWindow) {
                        acquired.status = "delivered";
                        acquired.deliveredAt = new Date();
                        acquired.error = null;
                    }
                } else {
                    console.error(`❌ Reminder [${acquired._id}] FAILED to deliver (check Template/Meta logs)`);
                    acquired.status = "failed";
                    acquired.error = "WhatsApp Template Delivery Failed";
                }

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

                const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";
                const msg = `*Security Update: Lock Lifted, ${bossTitle}.*\n\nYour bank detail security lock has expired. Instant Settlements have been resumed for your account. Every payment will now go directly to your bank account again.`;
                
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
                                    type: null,
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
                        case "INVOICE_DELIVERY":
                            // Kreddy AI: Async invoice delivery to customer
                            try {
                                const { deliverInvoiceToCustomer } = require('../utils/customerInvoiceService');
                                const deliveryResult = await deliverInvoiceToCustomer(
                                    job.data?.saleId,
                                    job.businessId,
                                    { customerPhone: job.data?.customerPhone }
                                );
                                result = deliveryResult.success
                                    ? { status: 'completed' }
                                    : { status: 'failed', error: deliveryResult.error };
                            } catch (e) {
                                result = { status: 'failed', error: e.message };
                            }
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
