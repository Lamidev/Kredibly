const mongoose = require('mongoose');
const User = require('./models/User');
const BusinessProfile = require('./models/BusinessProfile');
require('dotenv').config();

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const user = await User.findOne({ email: "test_chairman@usekredibly.com" });
        const profile = await BusinessProfile.findOne({ ownerId: user._id });
        
        console.log("--- TEST USER STATUS ---");
        console.log("Plan:", profile.plan);
        console.log("Status:", profile.planStatus);
        console.log("Trial Claimed:", profile.hasUsedTrial);
        console.log("Wallet Balance:", profile.walletBalance);
        console.log("Launch Promo:", profile.isLaunchPromo);
        console.log("Trial Expires:", profile.trialExpiresAt);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
