const mongoose = require('mongoose');
const Sale = require('./models/Sale');
require('dotenv').config();

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URL);
    const businessId = "6630f9d9f583e766e6c27806"; // I'll find this from the owner ID if needed, but let's try to find unique methods first
    
    const methods = await Sale.distinct("payments.method");
    console.log("Unique Payment Methods in DB:", methods);

    const recentPayments = await Sale.find({}, { payments: 1 }).sort({ createdAt: -1 }).limit(10);
    console.log("Recent Payments Structure:", JSON.stringify(recentPayments, null, 2));

    process.exit();
}

diagnose();
