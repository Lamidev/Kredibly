const mongoose = require('mongoose');
require('dotenv').config();

const BusinessProfile = require('../models/BusinessProfile');

async function resetKYC() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        // Target: Lamide Creatives (Based on your logs)
        const result = await BusinessProfile.findOneAndUpdate(
            { displayName: /Lamide Creatives/i },
            { 
                $set: { 
                    'kyc.status': 'pending', 
                    'kyc.tier': 1,
                    'kyc.method': 'none',
                    'bankDetails.bankDetailsLockUntil': null
                } 
            },
            { new: true }
        );

        if (result) {
            console.log(`🛡️ KYC Reset SUCCESS for: ${result.displayName}`);
            console.log('Current Status:', result.kyc.status);
        } else {
            console.log('❌ Could not find business profile for Lamide Creatives');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error resetting KYC:', err);
    }
}

resetKYC();
