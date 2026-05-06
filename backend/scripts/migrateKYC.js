/**
 * 🚀 KREDIBLY MIGRATION: KYC INITIALIZATION
 * Sets kyc.status to 'pending' for all existing merchants who don't have a status yet.
 * This ensures they see the dashboard banner and are subject to the payout guard.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('../models/BusinessProfile');

const migrate = async () => {
    try {
        console.log('🚀 Starting KYC Migration...');
        
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URL);
            console.log('✅ Connected to MongoDB');
        }

        const result = await BusinessProfile.updateMany(
            { $or: [{ 'kyc.status': { $exists: false } }, { kyc: { $exists: false } }] },
            { $set: { kyc: { status: 'pending', method: 'none' } } }
        );

        console.log(`✅ Migration Complete: Updated ${result.modifiedCount} merchants.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
};

migrate();
