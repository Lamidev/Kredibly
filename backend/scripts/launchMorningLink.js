require("dotenv").config({ path: "c:/Users/AKINYEMI/Desktop/Lamidev/Project/Kredibly/backend/.env" });
const mongoose = require("mongoose");
const axios = require("axios");

// 🛡️ Load the Waitlist Model 
const Waitlist = require("../models/Waitlist");

const API_KEY = process.env.RESEND_API_KEY;
const EXCLUDED_EMAILS = [
    "akinyemivictoria2006@gmail.com",
    "akinyemidamilola98@gmail.com"
];

// 🛡️ THE LAUNCH MORNING NARRATIVE (Sign-up Link focus)
const MORNING_LINK_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>

  <p style="font-size: 16px;">Hi {name},</p>
  
  <p style="font-size: 16px;">I’m incredibly excited to tell you that the doors are officially open. As of 8:00 AM this morning, Kredibly is live for our Founding Members.</p>
  
  <p style="font-size: 16px;"><strong>You can create your account right now using the official link below:</strong></p>

  <p style="margin: 32px 0;">
    <a href="https://usekredibly.com/register" style="background-color: #111827; color: white; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block;">Create My Kredibly Account</a>
  </p>
  
  <p style="font-size: 16px;"><strong>A quick reminder of your "Oga Status":</strong><br>
  As a Founding Member, your account is automatically upgraded to the <strong>Oga Plan</strong> for the first 30 days. Just sign up, and you’re ready to start recording sales, sending professional receipts, and collecting payments with Kreddy's help.</p>

  <p style="font-size: 16px;">I’m already in the dashboard watching the first few merchants join this morning. I can’t wait to see you in there. Let’s change the standard for business in Nigeria, together.</p>
  
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 18px;">Akinyemi Oluwatosin</p>
    <p style="color: #6B7280; font-size: 15px; margin: 4px 0 0; font-weight: 600;">Founder & CEO, Kredibly</p>
  </div>

  <div style="margin-top: 60px; border-top: 1px solid #F1F5F9; padding-top: 24px; text-align: center;">
    <p style="font-size: 11px; color: #9CA3AF; margin: 0;">© 2026 Kredibly Inc. Lagos, Nigeria.</p>
  </div>
</body>
</html>
`;

async function broadcast() {
    console.log("🛡️ MISSION: Tomorrow Morning Launch Broadcast...");
    
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Database Connected.");

        const waitlist = await Waitlist.find({ email: { $nin: EXCLUDED_EMAILS } });
        console.log(`📊 Found ${waitlist.length} subscribers ready for sign-up link.`);

        let successCount = 0;
        let failCount = 0;

        for (const user of waitlist) {
            const firstName = (user.name || "Pioneer").split(' ')[0];
            
            try {
                process.stdout.write(`📤 Sending link to ${user.email}... `);
                
                await axios.post("https://api.resend.com/emails", {
                    from: "Oluwatosin from Kredibly <hello@usekredibly.com>",
                    to: user.email,
                    subject: "🛡️ The doors are open (Your sign-up link inside)",
                    html: MORNING_LINK_TEMPLATE.replace("{name}", firstName)
                }, {
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    }
                });

                console.log("✅");
                successCount++;
                await new Promise(r => setTimeout(r, 500)); 

            } catch (err) {
                console.log("❌ FAILED!");
                console.error("  Error Details:", err.response ? JSON.stringify(err.response.data) : err.message);
                failCount++;
            }
        }

        console.log("\n🎬 MORNING LAUNCH BROADCAST COMPLETE!");
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log("🛡️ The doors are officially open.");

        process.exit(0);

    } catch (err) {
        console.error("💥 SYSTEM CRASH:", err.message);
        process.exit(1);
    }
}

broadcast();
