require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('../models/BusinessProfile');
const WhatsAppSession = require('../models/WhatsAppSession');
const { sendIndividualMorningSummary } = require('../utils/summaryService');

const MONGODB_URL = process.env.MONGODB_URL;

async function runTest() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected.");

        // Find an active profile
        const profile = await BusinessProfile.findOne({ isKreddyConnected: true, whatsappNumber: { $exists: true, $ne: "" } });
        if (!profile) {
            console.error("❌ No active, connected profile found in database to run integration test.");
            process.exit(1);
        }

        console.log(`👤 Found active merchant profile: ${profile.displayName} (${profile.whatsappNumber})`);

        // Set lastInboundAt to 48 hours ago to force closed window behavior
        profile.lastInboundAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
        // Force oga plan to enable summary sending even when window is closed
        const originalPlan = profile.plan;
        profile.plan = 'oga';
        // Clear lastSummaryAt to bypass skipped check
        profile.lastSummaryAt = null;
        await profile.save();

        console.log("⏳ Triggering sendIndividualMorningSummary (forced closed-window flow)...");
        const result = await sendIndividualMorningSummary(profile._id);
        console.log("🎁 Service execution result:", result);

        // Clean number formatting for query
        const cleanNumber = String(profile.whatsappNumber).replace(/\D/g, '');
        let finalNum = cleanNumber;
        if (finalNum.startsWith('0') && finalNum.length === 11) {
            finalNum = '234' + finalNum.slice(1);
        }

        // Verify if a WhatsAppSession of type pending_summary was successfully created
        const session = await WhatsAppSession.findOne({ whatsappNumber: finalNum });
        if (session && session.type === 'pending_summary') {
            console.log("✅ WhatsAppSession successfully created!");
            console.log(`👉 Session type: "${session.type}"`);
            console.log(`👉 Session expires in: ${Math.round((session.expiresAt - Date.now()) / (1000 * 60 * 60))} hours`);
            console.log("👉 Summary Text Snippet:\n----------------------\n" + session.data.summaryText.substring(0, 200) + "\n----------------------");
            
            // Clean up test session
            await WhatsAppSession.deleteOne({ _id: session._id });
            console.log("🧹 Cleaned up test session.");
        } else {
            console.error("❌ WhatsAppSession of type pending_summary was not found.");
        }

        // Restore original profile states
        profile.plan = originalPlan;
        await profile.save();
        console.log("🛡️ Profile states restored.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Test Script failed:", err);
        process.exit(1);
    }
}

runTest();
