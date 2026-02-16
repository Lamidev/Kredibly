const cron = require("node-cron");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

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

module.exports = { scheduleMorningSummary };
