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
                // Atomic check-and-set to avoid duplicates if workers run concurrently
                const acquired = await Reminder.findOneAndUpdate(
                    { _id: reminder._id, status: "pending" },
                    { status: "processing" }
                ).populate("businessId").populate("saleId");
                
                if (!acquired) continue; // Already processed by another tick

                if (!acquired.businessId) {
                    acquired.status = "delivered";
                    acquired.deliveredAt = new Date();
                    await acquired.save();
                    continue;
                }

                const plan = acquired.businessId.plan || "hustler";
                const planTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");
                const title = acquired.businessId.assistantSettings?.preferredName || planTitle;

                const typeIcons = {
                    debt: "⏳",
                    task: "📝",
                    meeting: "🤝",
                    personal: "💡"
                };
                const icon = typeIcons[reminder.type] || "🔔";

                let msg = `${icon} *Kreddy Reminder!* \n\n${title}, you asked me to remind you to:\n*"${acquired.description}"*\n\n`;

                if (acquired.saleId) {
                    const sale = acquired.saleId;
                    const bal = sale.totalAmount - (sale.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    
                    if (bal <= 0) {
                        console.log(`✅ Skipping reminder for ${sale.invoiceNumber} as it is already paid.`);
                        acquired.status = "delivered";
                        await acquired.save();
                        continue;
                    }

                    msg += `💰 *Debt Details:* \n- Customer: ${sale.customerName}\n- Balance: ₦${bal.toLocaleString()}\n- Link: ${APP_URL}/i/${sale.invoiceNumber}\n\n`;
                    msg += `*Forward this link to them to collect payment!* 💸\n\n`;
                }

                msg += `Let's get it done! 🚀\n\n_Reply "snooze 10 mins" if you are running late, or type a new time (e.g. "Tomorrow at 2pm")._`;

                await sendWhatsAppMessage(acquired.whatsappNumber, msg).catch(e => {
                    console.error(`Failed to send reminder to ${acquired.whatsappNumber}:`, e.message);
                });

                // 2. SEPARATE DRAFT MESSAGE: If it's a debt, send a forwardable message
                if (acquired.saleId) {
                    const sale = acquired.saleId;
                    const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                    const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";
                    const link = `${APP_URL}/i/${sale.invoiceNumber}`;
                    
                    const draftMsg = `Hi ${sale.customerName}, this is a friendly reminder regarding your balance of ₦${bal.toLocaleString()} with ${acquired.businessId.displayName}. You can view and pay here: ${link}`;
                    
                    // Small delay to ensure it arrives second
                    setTimeout(async () => {
                        await sendWhatsAppMessage(acquired.whatsappNumber, draftMsg).catch(e => {});
                    }, 1000);
                }

                acquired.status = "delivered";
                acquired.deliveredAt = new Date();
                await acquired.save();

                // --- RECURRENCE LOGIC ---
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
 * MORNING CHIEF SUMMARY (8:00 AM Daily)
 * Sends a summary of yesterday's performance to the Business Owner.
 */
const scheduleMorningSummary = () => {
    // Helper function for the core logic so we can call it on cron AND on startup check
    const runSummaryLogic = async (isManual = false) => {
        const type = isManual ? "Catch-up" : "Scheduled";
        console.log(`🌞 Running Morning Chief Summary (${type} - 8AM WAT)...`);
        
        try {
            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const startOfYesterday = new Date(yesterday);
            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            // ✅ GUARD: Ensure we only message active merchants
            const profiles = await BusinessProfile.find({ 
                whatsappNumber: { $exists: true, $ne: "" },
                createdAt: { $lt: startOfToday }
            });

            for (const profile of profiles) {
                try {
                    // Skip if already sent today (to prevent duplicates on server restarts)
                    if (profile.lastSummaryAt && profile.lastSummaryAt >= startOfToday) {
                        continue;
                    }

                    // Fetch sales made yesterday
                    const salesYesterday = await Sale.find({
                        businessId: profile._id,
                        createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
                    });

                    // Fetch total cash received yesterday
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
                        const planTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                        const bossTitle = profile.assistantSettings?.preferredName || planTitle;
                        const isHustler = profile.plan === 'hustler';
                        
                        let msg = "";

                        if (isHustler) {
                            // 🎭 THE HUSTLER TEASE: Give them the count, hide the kobo.
                            msg = `🌞 *Rise and Grind, ${bossTitle}!* \n\nYou recorded *${salesYesterday.length || 0} sales* yesterday! 🚀 \n\nTo see your total *Cash Collected*, *Outstanding Credit*, and *Today's Agenda*, upgrade to the *Oga Plan* now. Don't leave your money hanging! 🛡️\n\n`;
                        } else {
                            // 💎 THE PREMIUM SUMMARY: Full Intelligence.
                            msg = `🌞 *Rise and Grind, ${bossTitle}!* \n\nHere is your *Kredibly Intelligence Summary* for yesterday:\n\n`;
                            msg += `💰 *Cash Collected:* ₦${totalCashIn.toLocaleString()}\n`;
                            msg += `📑 *New Sales:* ${salesYesterday.length}\n`;
                            msg += `⏳ *New Credit:* ₦${pendingFromYesterday.toLocaleString()}\n\n`;

                            if (totalCashIn > 50000) {
                                msg += `🔥 *Yesterday was a strong day! Keep that energy up today.* 🚀\n\n`;
                            } else if (salesYesterday.length === 0) {
                                msg += `💡 *No new sales recorded yesterday. Remember to track every kobo today!* 🛡️\n\n`;
                            }

                            // ADD OUTSTANDING DEBTS (Top 3)
                            const topDebtors = await Sale.find({
                                businessId: profile._id,
                                status: { $ne: "paid" }
                            }).sort({ totalAmount: -1 }).limit(3);

                            if (topDebtors.length > 0) {
                                msg += `🔴 *Top Outstanding Balances:*\n`;
                                topDebtors.forEach(d => {
                                    const bal = d.totalAmount - d.payments.reduce((sum, p) => sum + p.amount, 0);
                                    const dueStr = d.dueDate ? ` (Due: ${new Date(d.dueDate).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })})` : "";
                                    msg += `• ${d.customerName}: ₦${bal.toLocaleString()}${dueStr}\n`;
                                });
                                msg += `\n`;
                            }

                            // ADD AGENDA
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
                                    const timeStr = new Date(r.triggerDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
                                    msg += `• ${timeStr}: ${r.description}\n`;
                                });
                                msg += `\n`;
                            }
                        }

                        msg += `Check full details on your dashboard: ${process.env.FRONTEND_URL || 'https://usekredibly.com'}`;

                        await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => {
                            console.error(`Failed to send summary to ${profile.displayName}:`, e.message);
                        });

                        profile.lastSummaryAt = new Date();
                        await profile.save();
                        console.log(`✅ Summary sent to ${profile.displayName}`);
                    }
                } catch (userErr) {
                    console.error(`❌ Failed summary for ${profile.displayName}:`, userErr.message);
                }
            }
        } catch (err) {
            console.error("Cron Job Error (Morning Summary Global):", err);
        }
    };

    // 1. Schedule the daily task (8:00 AM WAT)
    cron.schedule("0 8 * * *", () => runSummaryLogic(false), { timezone: "Africa/Lagos" });

    // 2. CATCH-UP LOGIC: If server starts after 8 AM and hasn't run today, run it now
    const now = new Date();
    const lagosHour = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }).format(now);
    
    if (parseInt(lagosHour) >= 8) {
        // Delay slightly on startup to let DB stabilize
        setTimeout(() => runSummaryLogic(true), 15000); 
    }
};



/**
 * PLAN & TRIAL EXPIRY REMINDERS (10:00 AM WAT / 9:00 AM UTC Daily)
 */
const schedulePlanExpiryReminders = () => {
    cron.schedule("0 9 * * *", async () => {
        // console.log("💳 Checking for expiring plans and trials...");
        try {
            const now = new Date();
            const threeDaysLimit = new Date(); threeDaysLimit.setDate(threeDaysLimit.getDate() + 3);
            
            // 1. Check ACTIVE Plans expiring soon
            const expiringSoon = await BusinessProfile.find({
                plan: { $in: ["oga", "chairman"] },
                planStatus: "active",
                nextBillingDate: { $lte: threeDaysLimit, $gt: now }
            });

            for (const profile of expiringSoon) {
                const diffTime = new Date(profile.nextBillingDate).getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const bossTitle = profile.assistantSettings?.preferredName || (profile.plan === "chairman" ? "Chairman" : "Oga");
                
                let msg = "";
                if (diffDays === 3) msg = `💳 *Plan Update, ${bossTitle}!* \n\nYour *${profile.plan.toUpperCase()}* plan expires in 3 days. Renew now to keep your Kreddy AI powered up! 🚀\n\n🔗 *Quick Renew:* Just say _"I want to renew my plan"_!`;
                else if (diffDays === 1) msg = `⚠️ *Final Reminder, ${bossTitle}!* \n\nYour *${profile.plan.toUpperCase()}* plan expires tomorrow. Don't let your business automation pause! 🛡️\n\n🔗 *Quick Renew:* Just say _"Pay for my ${profile.plan}"_!`;

                if (msg && profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Expiry Alert Fail:", e));
            }

            // 2. Check Expiring TRIALS (7-Day Limit)
            const trialsExpiringSoon = await BusinessProfile.find({
                planStatus: "trialing",
                trialExpiresAt: { $lte: threeDaysLimit, $gt: now }
            });

            for (const profile of trialsExpiringSoon) {
                const diffTime = new Date(profile.trialExpiresAt).getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const bossTitle = profile.assistantSettings?.preferredName || "Chief";
                
                let msg = "";
                if (diffDays === 1) {
                    msg = `🚀 *Trial Ending Alert, ${bossTitle}!* \n\nYour 7-Day Chairman Trial ends tomorrow. You've seen what I can do! 🛡️\n\n🎁 *Launch Promo:* Pay tomorrow to get **50% OFF** for your first few months. \n\nJust say _"I want to stay Chairman"_ or _"Switch to Oga"_ to continue!`;
                }
                if (msg && profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Trial Expiry Alert Fail:", e));
            }

            // 3. Handle JUST EXPIRED Trials (Day 8 Hard Fallback)
            const justExpiredTrials = await BusinessProfile.find({
                planStatus: "trialing",
                trialExpiresAt: { $lte: now }
            });

            for (const profile of justExpiredTrials) {
                // Move to Hustler if no payment, but give 3-Day Grace for the "Conversion Choice"
                const graceExpiry = new Date(profile.trialExpiresAt); 
                graceExpiry.setDate(graceExpiry.getDate() + 3);

                if (now > graceExpiry) {
                    profile.planStatus = 'inactive';
                    profile.plan = 'hustler';
                    await profile.save();
                    const bossTitle = profile.assistantSettings?.preferredName || "Boss";
                    const msg = `🛑 *Trial Over, ${bossTitle}.* \n\nYour trial has ended and the grace period is over. I've moved you to the *Hustler Plan* (Basic Text Only). \n\nScan and Voice features are now locked. Upgrade anytime to get them back! 🛡️`;
                    if (profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Trial Lock Alert Fail:", e));
                } else {
                    // Still in Grace, send the Payment Choice Link
                    const bossTitle = profile.assistantSettings?.preferredName || "Chairman";
                    const msg = `📢 *Last Call, ${bossTitle}!* \n\nYour trial is over. Choose your plan now to keep your Scan and Voice powers at the **50% Launch Discount**: \n\n1️⃣ *Stay Chairman* (₦4,250/mo)\n2️⃣ *Switch to Oga* (₦2,500/mo)\n\nJust say _"Pay for Oga"_ or _"Pay for Chairman"_ right here! 🛡️`;
                    if (profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Grace Choice Alert Fail:", e));
                }
            }

            // 4. Handle EXPIRED Active Plans (Past Due / Downgrade)
            const justExpiredActive = await BusinessProfile.find({
                planStatus: "active",
                nextBillingDate: { $lte: now }
            });

            for (const profile of justExpiredActive) {
                profile.planStatus = 'past_due';
                await profile.save();
                const bossTitle = profile.assistantSettings?.preferredName || (profile.plan === "chairman" ? "Chairman" : "Oga");
                const msg = `🚨 *Plan Expired, ${bossTitle}!* \n\nYour premium features have paused. Renew now to continue tracking debt with AI without limits! 💰\n\n🔗 *Renew:* Just say _"Pay for ${profile.plan}"_`;
                if (profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Expired Alert Fail:", e));
            }

            // 5. Hard Revert Past Due to Hustler (After 1 Cycle of Past Due)
            const overdueForDays = await BusinessProfile.find({
                planStatus: "past_due",
                nextBillingDate: { $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // 3-Day Grace for active plans
            });

            for (const profile of overdueForDays) {
                profile.planStatus = 'inactive';
                profile.plan = 'hustler';
                await profile.save();
                const bossTitle = profile.assistantSettings?.preferredName || "Boss";
                const msg = `🛑 *Benefit Lock, ${bossTitle}.* \n\nYour premium features have been locked because your plan is overdue. I've moved you back to the *Hustler Plan*. \n\n_Upgrade anytime to restore your Scan & Voice powers!_ 🦁`;
                if (profile.whatsappNumber) await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Downgrade Alert Fail:", e));
            }
        } catch (error) {
            console.error("Cron Job Error (Plan/Trial Expiry):", error);
        }
    });
};

/**
 * PROACTIVE "DID THEY PAY?" CHECK (Runs Hourly)
 * Checks reminders from 24 hours ago. If the debt is still UNPAID, it prompts the merchant.
 */
const scheduleProactiveFollowUps = () => {
    cron.schedule("0 * * * *", async () => {
        // console.log("🕵️‍♀️ Running Proactive Follow-up Check...");
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
                const planFTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
                const bossTitle = profile.assistantSettings?.preferredName || planFTitle;
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

/**
 * DAILY PAST DUE ESCALATION (Runs Daily at Noon)
 * Catch debts that were due exactly 1 day ago.
 */
const schedulePastDueEscalations = () => {
    cron.schedule("0 12 * * *", async () => {
        // console.log("🚩 Running Daily Past-Due Escalation Check...");
        try {
            const yesterdayStart = new Date(); 
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            yesterdayStart.setHours(0,0,0,0);
            
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23,59,59,999);

            // Find unpaid sales that were due exactly 1 day ago
            const overdueSales = await Sale.find({
                status: "unpaid",
                dueDate: { $gte: yesterdayStart, $lte: yesterdayEnd }
            }).populate("businessId");

            for (const sale of overdueSales) {
                const profile = sale.businessId;
                if (!profile || profile.plan === "hustler" || !profile.whatsappNumber) continue;

                const planETitle = profile.plan === "chairman" ? "Chairman" : "Oga";
                const bossTitle = profile.assistantSettings?.preferredName || planETitle;
                const bal = sale.totalAmount - sale.payments.reduce((s, p) => s + p.amount, 0);
                
                const msg = `🚩 *Overdue Alert, ${bossTitle}!*\n\n*${sale.customerName}* was supposed to pay ₦${bal.toLocaleString()} yesterday, but the record is still unpaid.\n\nShould I draft a follow-up link for you to forward to them? \n\n_Type: "Send link to ${sale.customerName}"_`;
                
                await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Escalation Alert Fail:", e));
            }
        } catch (error) {
            console.error("Cron Job Error (Escalation):", error);
        }
    });
};

/**
 * AUTOMATIC ESCROW RELEASE (Runs Hourly)
 * Checks for escrowed payments whose security lock has expired.
 * Only releases if the account is NOT flagged as compromised.
 */
const scheduleEscrowPayouts = () => {
    cron.schedule("0 * * * *", async () => {
        // console.log("🔓 Running Automatic Escrow Release Check...");
        try {
            const EscrowPayment = require("../models/EscrowPayment");
            const { createTransferRecipient, initiateTransfer } = require("./paystack");

            // Find all pending escrow payments where releaseDate has passed
            const readyToRelease = await EscrowPayment.find({
                status: "pending",
                releaseDate: { $lte: new Date() }
            }).populate("businessId");

            for (const escrow of readyToRelease) {
                const profile = escrow.businessId;
                
                // 🛑 SAFETY VALVE: If the account was flagged, DO NOT release automatically!
                if (!profile || profile.isCompromised) {
                    console.warn(`🛑 Skipping Escrow Release for ${profile?.displayName || 'Unknown'}: Account Flagged or Missing.`);
                    escrow.status = "frozen";
                    await escrow.save();
                    continue;
                }

                try {
                    // 1. Ensure we have a bank to send to
                    if (!profile.bankDetails?.accountNumber || !profile.bankDetails?.bankCode) {
                        console.error(`❌ No bank details for ${profile.displayName} to release escrow ${escrow.reference}`);
                        continue;
                    }

                    // 2. Create Transfer Recipient
                    const recipient = await createTransferRecipient(
                        profile.bankDetails.accountName || profile.displayName,
                        profile.bankDetails.accountNumber,
                        profile.bankDetails.bankCode
                    );

                    // 3. Initiate Transfer
                    const transfer = await initiateTransfer(
                        escrow.amount,
                        recipient.recipient_code,
                        `Escrow Release: ${escrow.reference}`
                    );

                    // 4. Update Status
                    escrow.status = "released";
                    escrow.transferReference = transfer.reference;
                    await escrow.save();

                    // 5. Notify Merchant
                    const msg = `🔓 *Escrow Released, Chairman!*\n\nYour security lock has expired, and I've just pushed *₦${escrow.amount.toLocaleString()}* to your bank account (${profile.bankDetails.bankName}).\n\n_Ref: ${transfer.reference}_`;
                    await sendWhatsAppMessage(profile.whatsappNumber, msg).catch(e => console.error("Escrow Notify Fail:", e));

                    console.log(`✅ Released Escrow ${escrow.reference} to ${profile.displayName}`);

                } catch (transferErr) {
                    console.error(`❌ Transfer Failed for Escrow ${escrow.reference}:`, transferErr.message);
                    escrow.status = "failed";
                    await escrow.save();
                }
            }
        } catch (error) {
            console.error("Cron Job Error (Escrow Release):", error);
        }
    });
};

/**
 * MONTHLY USAGE RESET (Runs on the 1st of every month at midnight)
 * Resets AI message counters for all businesses.
 */
const scheduleMonthlyUsageReset = () => {
    cron.schedule("0 0 1 * *", async () => {
        try {
            console.log("🧹 Running Monthly Usage Reset...");
            await BusinessProfile.updateMany(
                {}, // All businesses
                { 
                    $set: { 
                        "monthlyUsage.messages": 0,
                        "monthlyUsage.images": 0,
                        "monthlyUsage.voiceNotes": 0,
                        "monthlyUsage.reminders": 0,
                        "monthlyUsage.lastReset": new Date()
                    }
                }
            );
            console.log("✅ All Monthly Quotas Reset Successfully.");
        } catch (error) {
            console.error("Cron Job Error (Usage Reset):", error);
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
    scheduleMonthlyUsageReset
};
