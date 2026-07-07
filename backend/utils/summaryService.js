const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const Reminder = require("../models/Reminder");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { GROWTH_MASTERCLASS_TEMPLATE } = require("../emailLogic/emailTemplates");
const { sendEmail } = require("./emailService");
const { getDailyAdvice } = require("./adviceService");

/**
 * NEW KREDY GROWTH ENGINE LOGIC:
 * 1. Active Users (<24h window): Full Accountant Summary on WhatsApp (FREE)
 * 2. Inactive Users (>24h window): Growth Masterclass on Email (DRIVES ENGAGEMENT)
 */
/**
 * Heuristic helper to calculate engagement score in the last 7 days.
 */
const checkEngagement = async (businessId, now) => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
        // Count invoices created
        const invoices = await Sale.countDocuments({
            businessId,
            createdAt: { $gte: sevenDaysAgo }
        });
        
        // Count payments received
        const payments = await Sale.countDocuments({
            businessId,
            "payments.date": { $gte: sevenDaysAgo }
        });
        
        // Count reminders/tasks created
        const tasks = await Reminder.countDocuments({
            businessId,
            createdAt: { $gte: sevenDaysAgo }
        });
        
        return invoices + payments + tasks;
    } catch (err) {
        console.error("Engagement check error:", err.message);
        return 0;
    }
};

/**
 * NEW KREDY GROWTH ENGINE LOGIC:
 * 1. Active Users (<24h window): Full Accountant Summary on WhatsApp (FREE)
 * 2. Active Users (>24h window / Closed): Briefing delivered via Email
 * 3. Inactive Users (No recent engagement): Skipped entirely (Prevents notification fatigue)
 */
const sendIndividualMorningSummary = async (profileInput, now = new Date()) => {
    try {
        console.log(`🔍 [SUMMARY] Resolving merchant record for input: ${profileInput}...`);
        let profile = profileInput;
        // ⚡ FIX: If we received an ID instead of a full object (from Job Runner), fetch it.
        if (typeof profile === "string" || mongoose.Types.ObjectId.isValid(profile)) {
            profile = await BusinessProfile.findById(profileInput);
        }

        if (!profile) return { status: "failed", error: "Profile not found" };

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // 1. Skip if already handled today (WhatsApp or Email)
        if (profile.lastSummaryAt && profile.lastSummaryAt >= startOfToday) {
            return { status: "skipped", reason: "Merchant already handled today" };
        }

        // 2. Resolve merchant's preferred name strictly
        const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";

        // 3. Determine if merchant is ACTIVE (interacted < 24h OR engagement score > 0)
        const isInsideWindow = profile.isKreddyConnected && 
                             profile.lastInboundAt && 
                             (now - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

        const engagementScore = await checkEngagement(profile._id, now);
        const isMerchantActive = isInsideWindow || (engagementScore > 0);

        if (!isMerchantActive) {
            console.log(`🔇 [INACTIVE] Skipping morning summary for inactive merchant ${profile.displayName} (engagement: ${engagementScore})`);
            return { status: "skipped", reason: "Merchant is inactive" };
        }

        // 4. Fetch Daily Advice Segment (Masterclass)
        const dailyTip = await getDailyAdvice();

        // 5. Gather metrics & report data
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const salesYesterday = await Sale.find({
            businessId: profile._id,
            createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        const allSalesWithPaymentsYesterday = await Sale.find({
            businessId: profile._id,
            "payments.date": { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        let totalCashIn = 0;
        allSalesWithPaymentsYesterday.forEach(s => {
            s.payments.forEach(p => {
                if (new Date(p.date) >= startOfYesterday && new Date(p.date) <= endOfYesterday) totalCashIn += p.amount;
            });
        });

        let pendingDebt = 0;
        salesYesterday.forEach(s => {
            const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
            pendingDebt += Math.max(0, s.totalAmount - paid);
        });

        const topDebtors = await Sale.find({
            businessId: profile._id,
            status: { $in: ["unpaid", "partial"] }
        })
        .sort({ totalAmount: -1, createdAt: 1 })
        .limit(3);

        const activeSessionCount = await require("../models/PaymentSession").countDocuments({
            businessId: profile._id,
            status: "pending",
            expiresAt: { $gt: now }
        });

        // ── While You Were Away ──────────────────────────────────────────────
        const offlineSince = profile.lastInboundAt ? new Date(profile.lastInboundAt) : new Date(now - 24 * 60 * 60 * 1000);
        
        // Payments received while merchant was offline
        const offlinePayments = await Sale.find({
            businessId: profile._id,
            "payments.date": { $gte: offlineSince }
        });
        
        let offlinePaymentsList = [];
        offlinePayments.forEach(s => {
            s.payments.forEach(p => {
                if (new Date(p.date) >= offlineSince) {
                    offlinePaymentsList.push(`• *${s.customerName}* paid ₦${p.amount.toLocaleString()}.`);
                }
            });
        });

        const invoicesMonitored = await Sale.countDocuments({
            businessId: profile._id,
            status: { $in: ["unpaid", "partial"] }
        });

        const offlineRemindersSent = await Reminder.countDocuments({
            businessId: profile._id,
            triggerDate: { $gte: offlineSince, $lte: now },
            status: "delivered",
            recipientType: "customer"
        });

        let whileAwaySection = "";
        if (offlinePaymentsList.length > 0) {
            whileAwaySection = [
                `*While you were away:*`,
                ...offlinePaymentsList,
                `• Receipts have already been delivered. 🧾`,
                ``
            ].join("\n");
        } else if (invoicesMonitored > 0) {
            const todayRemindersCount = await Reminder.countDocuments({
                businessId: profile._id,
                triggerDate: { $gte: startOfToday, $lte: new Date(startOfToday.getTime() + 86400000) },
                recipientType: "customer",
                status: "pending"
            });
            whileAwaySection = [
                `*While you were away:*`,
                `• I monitored ${invoicesMonitored} invoice${invoicesMonitored > 1 ? "s" : ""} overnight.`,
                `• No new payments were received.`,
                offlineRemindersSent > 0 ? `• Sent ${offlineRemindersSent} customer payment reminder${offlineRemindersSent > 1 ? "s" : ""}.` : null,
                todayRemindersCount > 0 ? `• ${todayRemindersCount} reminder${todayRemindersCount > 1 ? "s are" : " is"} scheduled for today.` : null,
                ``
            ].filter(Boolean).join("\n");
        }

        // ── Yesterday metrics (no unnecessary zeros) ─────────────────────────
        const yesterdayRevenue = salesYesterday.reduce((sum, s) => sum + s.totalAmount, 0);
        const yesterdayLines = [];
        if (totalCashIn > 0) {
            yesterdayLines.push(`• Cash Collected: *₦${totalCashIn.toLocaleString()}*`);
        } else {
            yesterdayLines.push(`• No payments were received yesterday.`);
        }
        if (salesYesterday.length > 0) {
            yesterdayLines.push(`• New Invoices: *${salesYesterday.length}* (₦${yesterdayRevenue.toLocaleString()} invoiced)`);
        } else {
            yesterdayLines.push(`• No new invoices were created yesterday.`);
        }
        if (pendingDebt > 0) {
            yesterdayLines.push(`• Debt Recorded: *₦${pendingDebt.toLocaleString()}*`);
        } else {
            yesterdayLines.push(`• No new debt was recorded yesterday.`);
        }
        const yesterdaySection = yesterdayLines.join("\n");

        // ── Determine "Today's Priority" via rule-based heuristics ──────────
        const priorityItems = [];
        
        // 1. Check for pending overpayments awaiting refund
        const overpaidPendingCount = await Sale.countDocuments({
            businessId: profile._id,
            overpaymentStatus: "pending_refund"
        });
        if (overpaidPendingCount > 0) {
            priorityItems.push(`• ${overpaidPendingCount} payment${overpaidPendingCount > 1 ? "s are" : " is"} awaiting refund/reconciliation`);
        }

        // 2. Check for pending customer extension requests
        const pendingExtCount = await Sale.countDocuments({
            businessId: profile._id,
            lifecycleStatus: "EXTENSION_REQUESTED"
        });
        if (pendingExtCount > 0) {
            priorityItems.push(`• ${pendingExtCount} extension request${pendingExtCount > 1 ? "s require" : " requires"} review`);
        }

        // 3. Check for due/overdue invoices needing follow-up
        const dueInvoicesCount = await Sale.countDocuments({
            businessId: profile._id,
            status: { $in: ["unpaid", "partial"] },
            dueDate: { $lte: now }
        });
        if (dueInvoicesCount > 0) {
            priorityItems.push(`• ${dueInvoicesCount} invoice${dueInvoicesCount > 1 ? "s require" : " requires"} follow-up`);
        }

        let prioritySection = "";
        if (priorityItems.length > 0) {
            prioritySection = `⚡ *TODAY'S PRIORITY*\n${priorityItems.slice(0, 3).join("\n")}`;
        } else {
            prioritySection = `⚡ *TODAY'S PRIORITY*\nEverything is on track — no urgent priority items. 🟢`;
        }

        // ── I'll Handle section ───────────────────────────────────────────
        const commitmentLines = [
            `🤝 *I'LL HANDLE*`,
            `✓ Monitor all invoice payments`,
            `✓ Send invoice reminders automatically`,
            `✓ Notify you immediately when payments arrive`,
            `✓ Keep your business records updated`
        ].join("\n");

        // ── Assemble the WhatsApp Daily Brief ────────────────────────────────
        const message = [
            `Good morning, ${bossTitle}.`,
            `Here's today's business briefing. 📋`,
            ``,
            whileAwaySection,
            `📊 *YESTERDAY*`,
            yesterdaySection,
            ``,
            prioritySection,
            ``,
            commitmentLines,
            ``,
            `💡 *TODAY'S GROWTH PLAY*`,
            dailyTip
        ].filter(v => v !== null).join("\n");

        if (isInsideWindow && profile.whatsappNumber) {
            // 🟢 GROUP 1: WHATSAPP BRIEFING (Session open)
            console.log(`📡 [ACTIVE] Delivering WhatsApp Daily Brief to ${profile.displayName}...`);
            const sent = await sendWhatsAppMessage(profile.whatsappNumber, message);

            if (sent) {
                console.log(`✅ [WHATSAPP] Summary delivered to ${profile.displayName}.`);
                profile.lastSummaryAt = new Date();
                await profile.save();
                return { status: "sent", channel: "whatsapp" };
            } else {
                console.error(`❌ [WHATSAPP] Delivery FAILED for ${profile.displayName}.`);
                return { status: "failed", error: "WhatsApp delivery failed" };
            }

        } else {
            // 🟠 GROUP 2: EMAIL BRIEFING (Session closed)
            console.log(`📪 [ACTIVE] Sending Daily Brief to ${profile.displayName} via Email...`);
            
            const user = await require("../models/User").findById(profile.ownerId);
            if (!user || !user.email) return { status: "failed", error: "No email found for active user" };

            const emailHtml = GROWTH_MASTERCLASS_TEMPLATE
                .replace(/{name}/g, profile.displayName)
                .replace(/{adviceText}/g, `<div style="font-family: sans-serif; white-space: pre-line; color: #333;">${message.replace(/\*/g, '')}</div>`);

            await sendEmail({
                to: user.email,
                subject: `🌅 Your Daily Briefing: ${profile.displayName}`,
                html: emailHtml
            });

            console.log(`✅ [EMAIL] Daily Brief sent to ${user.email}.`);
            profile.lastSummaryAt = new Date();
            await profile.save();
            return { status: "sent", channel: "email" };
        }

    } catch (error) {
        console.error("Critical Summary Engine Failure:", error);
        return { status: "failed", error: error.message };
    }
};

module.exports = { sendIndividualMorningSummary };

