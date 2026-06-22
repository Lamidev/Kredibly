require("dotenv").config();
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const { deliverInvoiceToCustomer } = require("../utils/customerInvoiceService");

async function run() {
    console.log("Connecting to MongoDB at:", process.env.MONGODB_URL);
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    const sale = await Sale.findOne({ invoiceNumber: "KR-DSFV-AV4K" });
    if (!sale) {
        console.error("❌ Sale KR-DSFV-AV4K not found!");
        const anySale = await Sale.findOne().sort({ createdAt: -1 });
        if (anySale) {
            console.log(`Found another sale: ${anySale.invoiceNumber}`);
            await runWithSale(anySale);
        } else {
            process.exit(1);
        }
    } else {
        await runWithSale(sale);
    }
}

async function runWithSale(sale) {
    const business = await BusinessProfile.findById(sale.businessId);
    if (!business) {
        console.error("❌ Business not found!");
        process.exit(1);
    }

    console.log(`📨 Attempting to deliver Invoice ${sale.invoiceNumber} to ${sale.customerPhone}...`);
    try {
        await deliverInvoiceToCustomer(sale._id, business._id);
        console.log("✅ Delivery function completed successfully!");
    } catch (err) {
        console.error("❌ Delivery function threw error:", err);
    }
    process.exit(0);
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
