const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const WhatsAppSession = require("../models/WhatsAppSession");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { sendEmail } = require("./emailService");

const checkAndNotify = async () => {
    try {
        const now = new Date();
        // Fix: Use Africa/Lagos Timezone for current hour check
        const lagosTime = new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Africa/Lagos'
        }).format(now);
        const currentHour = parseInt(lagosTime);
        
        // Define Day Boundaries
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(now);
        tomorrowEnd.setDate(now.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        /**
         * 1. MORNING BRIEFING (8:30 AM - 9:30 AM)
         * Slightly delayed to allow the Cron Summary (8:00 AM) to fire first.
         * Only happens once per day per business.
         */
        const isMorningWindow = currentHour === 8 && now.getMinutes() >= 30;
        
        /**
         * 2. BATCH FETCH ALL RELEVANT SALES
         * We query for anything due today or tomorrow that hasn't been nudged today.
         */
        const salesToProcess = await Sale.find({
            status: { $ne: "paid" },
            dueDate: { $gte: todayStart, $lte: tomorrowEnd },
            $or: [
                { lastAutoReminderSent: { $lt: todayStart } },
                { lastAutoReminderSent: { $exists: false } }
            ]
        }).populate({
            path: "businessId",
            populate: { path: "ownerId", select: "email" }
        }).lean();

        // Group by Business for efficient processing
        const groupedByBusiness = salesToProcess.reduce((acc, sale) => {
            const bId = sale.businessId?._id?.toString();
            if (!bId) return acc;
            if (!acc[bId]) acc[bId] = { business: sale.businessId, sales: [] };
            acc[bId].sales.push(sale);
            return acc;
        }, {});

        // Process each business individually to isolate failures
        for (const bId in groupedByBusiness) {
            try {
                const { business, sales } = groupedByBusiness[bId];
                if (!business || !business.whatsappNumber || !business.isKreddyConnected || business.assistantSettings?.enableReminders === false) continue;

                let message = "";
                let subject = "";

                if (isMorningWindow) {
                    // 🌞 MORNING BRIEFING LOGIC
                    const todaySales = sales.filter(s => new Date(s.dueDate).toDateString() === now.toDateString());
                    if (todaySales.length > 0) {
                        const totalDebt = todaySales.reduce((sum, s) => sum + (s.totalAmount - (s.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0)), 0);
                        
                        const tone = business.assistantSettings?.reminderTemplate || "friendly";
                        const plan = business.plan || "hustler";
                        const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

                        if (tone === "friendly") {
                            message = `🌞 *Good Morning ${bossTitle}!* \n\nYou have *${todaySales.length}* outstanding receivables due today totaling *₦${totalDebt.toLocaleString()}*. \n\nI have the automated recovery links ready for your collection. Shall I initiate? 🛡️`;
                        } else {
                            message = `📋 *Executive Briefing: Receivables Report* \n\nGreetings, ${bossTitle}. We have *${todaySales.length}* outstanding receivables scheduled for collection today, totaling *₦${totalDebt.toLocaleString()}*. \n\nInfrastructure is ready for automated recovery. Should I initiate the process? 🛡️`;
                        }
                        subject = "Executive Briefing: Receivables Due Today!";
                    }
                } 
                
                // If it's not morning or no morning briefing was prepared, handle standard nudges
                if (!message) {
                    const tone = business.assistantSettings?.reminderTemplate || "friendly";
                    const plan = business.plan || "hustler";
                    const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

                    if (sales.length === 1) {
                        const sale = sales[0];
                        const balance = sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                        const isDueToday = new Date(sale.dueDate).toDateString() === now.toDateString();

                        if (isDueToday) {
                            message = tone === "friendly" 
                                ? `👀 *Recovery Alert: ${sale.customerName} is due today!* \n💰 Balance: *₦${balance.toLocaleString()}* \n\nShall we initiate the automated recovery link? 📲 \n\n_Type "D ${sale.customerName}" to generate link!_`
                                : `🛡️ *Infrastructure Alert: Collection Due* \n\n${sale.customerName} has an outstanding balance of *₦${balance.toLocaleString()}* due today. \n\nShall I initiate the automated recovery link for processing? \n\n_System Command: Type "D ${sale.customerName}"_`;
                        } else {
                            message = tone === "friendly"
                                ? `👋 *Receivables Watch:* \n\n*${sale.customerName}* is expected to clear their *₦${balance.toLocaleString()}* balance tomorrow. I'm keeping the recovery link optimized! 🛡️`
                                : `📡 *Receivables Monitoring:* \n\nReceivable from *${sale.customerName}* (*₦${balance.toLocaleString()}*) is reaching maturity tomorrow. Monitoring link for optimal recovery. 🛡️`;
                        }
                        subject = `Receivables Alert: ${sale.customerName} is due!`;
                    } else if (sales.length > 1) {
                        const totalBal = sales.reduce((sum, s) => sum + (s.totalAmount - (s.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0)), 0);
                        message = tone === "friendly"
                            ? `📑 *Quick Summary for ${business.displayName}* \n\nYou have *${sales.length}* receivables to recover today/tomorrow (Total: *₦${totalBal.toLocaleString()}*). \n\nType "Summary" to see the full list or "Draft All" to initiate recovery. 🛡️`
                            : `🏢 *Operational Summary: ${business.displayName}* \n\nThere are *${sales.length}* active receivables in the collection pipeline for this period, totaling *₦${totalBal.toLocaleString()}*. \n\nInstruction required: Type "Summary" for audit or "Draft All" for batch recovery. 🛡️`;
                        subject = `Receivables Summary: ${sales.length} Items Due`;
                    }
                }

                // ROUTING: Email for Hustlers, WhatsApp for Oga/Chairman
                if (business.plan === "hustler" && business.ownerId?.email) {
                    await sendEmail({
                        to: business.ownerId.email,
                        subject: subject,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                            <h2 style="color: #6d28d9;">Kreddy Insight</h2>
                            <p style="font-size: 16px; line-height: 1.6;">${message.replace(/\*/g, '<b>').replace(/\*/g, '</b>').replace(/\n/g, '<br>')}</p>
                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #6d28d9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Open Dashboard</a>
                        </div>`,
                    });
                } else {
                    await sendWhatsAppMessage(business.whatsappNumber, message);
                }

                // Update sales status in one go (or individually if needed for precision)
                const saleIds = sales.map(s => s._id);
                await Sale.updateMany(
                    { _id: { $in: saleIds } },
                    { 
                        $set: { 
                            lastAutoReminderSent: new Date(),
                            lastMessageSentAt: new Date()
                        } 
                    }
                );

                // --- 4. OVERDUE FOLLOW-UP (Recovery Nudge) ---
                // If a reminder was sent yesterday (18-36h ago) but it's still unpaid, ask if they paid outside.
                const yesterdayStart = new Date(now);
                yesterdayStart.setHours(yesterdayStart.getHours() - 36);
                const yesterdayEnd = new Date(now);
                yesterdayEnd.setHours(yesterdayEnd.getHours() - 18);

                const followups = await Sale.find({
                    businessId: business._id,
                    status: { $ne: "paid" },
                    lastAutoReminderSent: { $gte: yesterdayStart, $lte: yesterdayEnd },
                    // Ensure we haven't asked about this one today already
                    lastMessageSentAt: { $lt: todayStart }
                }).lean();

                for (const f of followups) {
                    const bal = f.totalAmount - (f.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                    const nudgeMsg = `Hey ${bossTitle}, I noticed *${f.customerName}* haven't settled their *₦${bal.toLocaleString()}* balance since yesterday's reminder. \n\nDid they pay you outside yet? (Reply *"Yes"* or *"No"*) 🛡️`;
                    
                    await sendWhatsAppMessage(business.whatsappNumber, nudgeMsg);
                    
                    await WhatsAppSession.findOneAndUpdate(
                        { whatsappNumber: business.whatsappNumber },
                        {
                            type: 'recovery_followup',
                            data: { saleId: f._id, customerName: f.customerName, balance: bal },
                            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
                        },
                        { upsert: true }
                    );

                    await Sale.updateOne({ _id: f._id }, { $set: { lastMessageSentAt: new Date() } });
                }

            } catch (err) {
                console.error(`Error processing business ${bId}:`, err);
                // Continue to next business even if one fails
            }
        }

        /**
         * 3. GRANULAR REMINDERS (ALARM CLOCKS)
         * Optimized for near-real-time precision.
         */
        const granularReminders = await Sale.find({
            status: { $ne: "paid" },
            dueDate: { $lte: now },
            $or: [
                { lastAutoReminderSent: { $exists: false } },
                { $expr: { $lt: ["$lastAutoReminderSent", "$dueDate"] } }
            ]
        }).populate("businessId").lean();

        for (const sale of granularReminders) {
            try {
                const business = sale.businessId;
                if (!business || !business.whatsappNumber) continue;

                const tone = business.assistantSettings?.reminderTemplate || "friendly";
                const plan = business.plan || "hustler";
                const bossTitle = plan === "chairman" ? "Chairman" : (plan === "oga" ? "Oga" : "Boss");

                const balance = sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                const invoiceLink = `${process.env.FRONTEND_URL}/i/${sale.invoiceNumber}`;
                
                const debtorMsg = tone === "friendly"
                    ? `Hi ${sale.customerName}, this is a friendly reminder for your balance of ₦${balance.toLocaleString()} with ${business.displayName}. You can view and pay here: ${invoiceLink}`
                    : `Official Notice: Your outstanding balance of ₦${balance.toLocaleString()} with ${business.displayName} is now due. Please review your invoice and settle via: ${invoiceLink}`;

                const alarmMsg = tone === "friendly"
                    ? `⏰ *Kreddy Alarm: Time is up for ${sale.customerName}!* \n\n${bossTitle}, you asked for a reminder for this *₦${balance.toLocaleString()}* payment now.\n\n🔗 *Invoice:* ${invoiceLink}\n\nShall I send it to them for you? (Reply "Yes")`
                    : `🚨 *Operational Alert: Recovery Due* \n\n${bossTitle}, the reminder for ${sale.customerName} (*₦${balance.toLocaleString()}*) is now due for dispatch. \n\n🔗 *Invoice Details:* ${invoiceLink}\n\nInitiate automated delivery to customer? (Reply "Yes")`;
                
                await sendWhatsAppMessage(business.whatsappNumber, alarmMsg);

                // PERSIST context in WhatsApp Session
                await WhatsAppSession.findOneAndUpdate(
                    { whatsappNumber: business.whatsappNumber },
                    {
                        type: 'alarm_confirmation',
                        data: { saleId: sale._id, customerName: sale.customerName, balance, debtorMsg },
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min expiry
                    },
                    { upsert: true }
                );

                await Sale.updateOne({ _id: sale._id }, { $set: { lastAutoReminderSent: new Date() } });
            } catch (err) {
                console.error(`Error processing granular reminder for sale ${sale._id}:`, err);
            }
        }

    } catch (error) {
        console.error("Proactive Assistant Global Error:", error);
    }
};

const startProactiveAssistant = () => {
    console.log("⏰ Kreddy Lean-Efficient Assistant Active (Checking every 1 min)");
    checkAndNotify();
    setInterval(checkAndNotify, 60 * 1000); 
};

module.exports = { startProactiveAssistant };
