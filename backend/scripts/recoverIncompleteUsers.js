/**
 * 🔄 RECOVERY SCRIPT FOR INCOMPLETE USERS
 * Finds users where isVerified = true but onboardingCompleted = false or BusinessProfile is missing.
 * Sends a single-use 1-click magic setup email directly to /onboarding.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");
const { resendClient, sender } = require("../emailLogic/emailConfig");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

const recoverIncompleteUsers = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for User Recovery Job...");

        const verifiedUsers = await User.find({ isVerified: true });
        console.log(`Found ${verifiedUsers.length} verified users total.`);

        let recoveredCount = 0;

        for (const user of verifiedUsers) {
            const profile = await BusinessProfile.findOne({ ownerId: user._id });
            const isIncomplete = !user.onboardingCompleted || !profile || !profile.displayName;

            if (isIncomplete) {
                // Ensure user has a valid verification/recovery token
                const token = user.verificationToken || Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationToken = token;
                user.verificationTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
                await user.save();

                const recoveryUrl = `${FRONTEND_URL}/auth/verify-email?code=${token}&email=${encodeURIComponent(user.email)}`;

                console.log(`📩 Sending recovery email to: ${user.email}`);

                try {
                    await resendClient.emails.send({
                        from: `${sender.name} <${sender.email}>`,
                        to: user.email,
                        subject: "Your Kredibly account is ready for setup",
                        text: `Hi ${user.name},\n\nYour Kredibly account is ready. Complete your workspace setup in less than a minute:\n\n${recoveryUrl}\n\n— Oluwatosin, Founder of Kredibly`,
                        html: `
                        <!DOCTYPE html>
                        <html>
                        <body style="font-family: sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 24px;">
                          <div style="margin-bottom: 24px;">
                            <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto;">
                          </div>
                          <p>Hi ${user.name},</p>
                          <p>Your Kredibly account is verified and ready. Complete your workspace setup in less than a minute to start recording sales and sending instant invoices.</p>
                          <div style="margin: 32px 0;">
                            <a href="${recoveryUrl}" target="_blank" style="background-color: #6D28D9; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block;">Continue Setup</a>
                          </div>
                          <p style="font-size: 13px; color: #94A3B8;">If you've already completed setup, you can safely ignore this note.</p>
                          <p style="margin-top: 32px; font-weight: 700; color: #0F172A;">— Oluwatosin<br><span style="font-weight: 400; color: #64748B;">Founder, Kredibly</span></p>
                        </body>
                        </html>
                        `
                    });
                    recoveredCount++;
                } catch (emailErr) {
                    console.error(`Failed to send email to ${user.email}:`, emailErr.message);
                }
            }
        }

        console.log(`✅ Recovery Campaign Finished. Emails sent to ${recoveredCount} incomplete users.`);
        process.exit(0);
    } catch (err) {
        console.error("Recovery Job Failed:", err.message);
        process.exit(1);
    }
};

recoverIncompleteUsers();
