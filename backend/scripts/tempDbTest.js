const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");
const Sale = require("../models/Sale");

async function run() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const users = await User.find();
        console.log(`Total Users: ${users.length}`);

        const profiles = await BusinessProfile.find();
        console.log(`Total Business Profiles: ${profiles.length}`);

        const sales = await Sale.find();
        console.log(`Total Sales/Invoices: ${sales.length}`);

        console.log("\n--- Users and their Profiles ---");
        for (const user of users) {
            const profile = await BusinessProfile.findOne({ ownerId: user._id });
            const userSales = profile ? await Sale.find({ businessId: profile._id }) : [];
            console.log(`User ID: ${user._id} | Name: ${user.name} (${user.email}) | Role: ${user.role}`);
            console.log(`  Profile Found: ${profile ? "Yes (" + profile.displayName + ", ID: " + profile._id + ", onboardingStep: " + profile.onboardingStep + ")" : "No"}`);
            if (profile) {
                console.log(`  Sales count: ${userSales.length}`);
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
