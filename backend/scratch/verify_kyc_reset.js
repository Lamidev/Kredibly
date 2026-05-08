require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('../models/BusinessProfile');

const verify = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        await mongoose.connect(mongoUri);
        
        const count = await BusinessProfile.countDocuments({ 'kyc.tier': { $ne: 1 } });
        console.log(`Profiles with tier != 1: ${count}`);
        
        const statusCount = await BusinessProfile.countDocuments({ 'kyc.status': { $ne: 'pending' } });
        console.log(`Profiles with status != pending: ${statusCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
