require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('../models/BusinessProfile');
const { LAUNCH_DATE } = require('../config/pricing');

const MONGODB_URL = process.env.MONGODB_URL;

async function fixPlans() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected to MongoDB for Migration");

        const result = await BusinessProfile.updateMany(
            { 
                $or: [
                    { plan: 'hustler' },
                    { plan: { $exists: false } }
                ]
            },
            { 
                $set: { 
                    plan: 'oga',
                    planStatus: 'trialing',
                    trialExpiresAt: LAUNCH_DATE,
                    isLaunchPromo: true,
                    hasUsedTrial: true
                } 
            }
        );

        console.log(`✅ Migration Complete: Updated ${result.modifiedCount} users to Oga status.`);
        
        // Also ensure connected users have a sensible preferredName if missing
        const connectedProfiles = await BusinessProfile.find({ isKreddyConnected: true, "assistantSettings.preferredName": { $exists: false } }).populate('ownerId');
        for (const profile of connectedProfiles) {
            if (profile.ownerId && profile.ownerId.name) {
                const firstName = profile.ownerId.name.split(' ')[0];
                profile.assistantSettings = { ...profile.assistantSettings, preferredName: firstName };
                await profile.save();
                console.log(`👉 Set preferred name for ${profile.ownerId.name}: ${firstName}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err);
        process.exit(1);
    }
}

fixPlans();
