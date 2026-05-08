/**
 * 🚀 KREDIBLY MAINTENANCE: RESET ALL KYC TO TIER 1
 * Sets all merchants back to Tier 1 KYC status.
 * This will reset their verification status, tier level, and clear BVN/NIN data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('../models/BusinessProfile');

const resetKYC = async () => {
    try {
        console.log('🚀 Starting KYC Reset to Tier 1...');
        
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!mongoUri) {
            console.error('❌ MONGODB_URL or MONGODB_URI is missing in .env');
            process.exit(1);
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
            console.log('✅ Connected to MongoDB');
        }

        const result = await BusinessProfile.updateMany(
            {}, // Update all profiles
            { 
                $set: { 
                    'kyc.status': 'pending', 
                    'kyc.tier': 1,
                    'kyc.method': 'none',
                    'kyc.verifiedAt': null,
                    'kyc.bvn': '',
                    'kyc.nin': '',
                    'kyc.rejectionReason': ''
                } 
            }
        );

        console.log(`✅ KYC Reset Complete: Updated ${result.modifiedCount} merchants back to Tier 1.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ KYC Reset Failed:', err.message);
        process.exit(1);
    }
};

resetKYC();
