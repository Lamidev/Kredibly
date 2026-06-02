const mongoose = require('mongoose');
require('dotenv').config();
const BusinessProfile = require('../models/BusinessProfile');
const Notification = require('../models/Notification');

/**
 * THE LAUNCH DAY RESET (July 1st Automation)
 * This script reverts all businesses on the "Pre-Launch Free Oga" plan 
 * back to the "Hustler" plan, unless they have made a payment.
 */
const runLaunchReset = async () => {
    try {
        console.log("🚀 Starting Kredibly Launch Day Reset...");
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to Database.");

        // 1. Reset Logic: Find and Revert
        // Target: Oga/Chairman plans that are still in "Trialing" status (Free Beta)
        // Exempt: Anyone whose planStatus is 'active' (meaning they paid)
        const result = await BusinessProfile.updateMany(
            { 
                plan: { $in: ['oga', 'chairman'] },
                planStatus: 'trialing',
                $or: [
                    { lastPaidAt: { $exists: false } },
                    { lastPaidAt: null }
                ]
            },
            { 
                plan: 'hustler',
                planStatus: 'active',
                nextBillingDate: null,
                isLaunchPromo: false
            }
        );

        console.log(`📉 Success: Reverted ${result.modifiedCount} accounts to Hustler Plan.`);

        // 2. Notify the affected users (Optional but recommended)
        // We can create a notification they'll see when they log in
        if (result.modifiedCount > 0) {
            // Since we can't easily find specifically who was updated without a find() first,
            // the safest way is to do this during the update if we wanted to notify.
            // For now, we'll assume they see the "Plan Ended" state in the dashboard.
            console.log("💡 Tip: Consider sending a bulk WhatsApp broadcast to these users to re-engage them.");
        }

        console.log("🏁 Launch Reset Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset Error:", error);
        process.exit(1);
    }
};

runLaunchReset();
