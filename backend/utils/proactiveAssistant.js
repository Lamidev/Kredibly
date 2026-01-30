const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const WhatsAppSession = require("../models/WhatsAppSession");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");
const { sendEmail } = require("./emailService");

/**
 * 🚀 High-Efficiency Proactive Assistant
 * Optimized for lean performance without Redis.
 * - Intelligent grouping to reduce API calls
 * - Morning Briefing feature for high engagement
 * - Individual business failure isolation
 */

const checkAndNotify = async () => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Define Day Boundaries
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(now);
        tomorrowEnd.setDate(now.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        /**
         * 1. MORNING BRIEFING (8 AM - 9 AM)
         * Only happens once per day per business.
         */
        const isMorningWindow = currentHour >= 8 && currentHour < 9;
        
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
                if (!business || !business.whatsappNumber || business.assistantSettings?.enableReminders === false) continue;

                let message = "";
                let subject = "";

                if (isMorningWindow) {
                    // 🌞 MORNING BRIEFING LOGIC
                    const todaySales = sales.filter(s => new Date(s.dueDate).toDateString() === now.toDateString());
                    if (todaySales.length > 0) {
                        const totalDebt = todaySales.reduce((sum, s) => sum + (s.totalAmount - (s.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0)), 0);
                        message = `🌞 *Good Morning Chief!* \n\nYou have *${todaySales.length}* payments due today totaling *₦${totalDebt.toLocaleString()}*. \n\nShall I draft the reminder messages for you? Replying "Yes" or "Draft All" gets them ready! 🛡️`;
                        subject = "Kreddy Morning Briefing: Payments Due Today!";
                    }
                } 
                
                // If it's not morning or no morning briefing was prepared, handle standard nudges
                if (!message) {
                    if (sales.length === 1) {
                        const sale = sales[0];
                        const balance = sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                        const isDueToday = new Date(sale.dueDate).toDateString() === now.toDateString();

                        message = isDueToday
                            ? `👀 *Friendly Nudge: ${sale.customerName} is due today!* \n💰 Balance: *₦${balance.toLocaleString()}* \n\nShall we send them a reminder link? 📲 \n\n_Type "D ${sale.customerName}" to get the link!_`
                            : `👋 *Heads up!* \n\n*${sale.customerName}* is expected to pay *₦${balance.toLocaleString()}* tomorrow. I'll stay on watch! 🛡️`;
                        subject = `Kreddy Nudge: ${sale.customerName} is due!`;
                    } else {
                        const totalBal = sales.reduce((sum, s) => sum + (s.totalAmount - (s.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0)), 0);
                        message = `📑 *Quick Summary for ${business.displayName}* \n\nYou have *${sales.length}* people to collect money from today/tomorrow (Total: *₦${totalBal.toLocaleString()}*). \n\nType "Summary" to see the full list or "Draft All" to notify them. 🛡️`;
                        subject = `Kreddy Summary: ${sales.length} Debts Due`;
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

                const balance = sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
                const invoiceLink = `${process.env.FRONTEND_URL}/i/${sale.invoiceNumber}`;
                const debtorMsg = `Hi ${sale.customerName}, this is a friendly reminder for your balance of ₦${balance.toLocaleString()} with ${business.displayName}. You can view and pay here: ${invoiceLink}`;
                const alarmMsg = `⏰ *Kreddy Alarm: Time is up for ${sale.customerName}!* \n\nYou asked for a reminder for this *₦${balance.toLocaleString()}* payment now.\n\n🔗 *Invoice:* ${invoiceLink}\n\nShall I send the link to them for you? (Reply "Yes")`;
                
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
