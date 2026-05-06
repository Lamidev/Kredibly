const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SaleSchema = new mongoose.Schema({
    invoiceNumber: String,
    payments: [
        {
            amount: Number,
            date: Date,
            method: String,
            reference: String
        }
    ],
    status: String
});

const Sale = mongoose.model('Sale', SaleSchema);

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const sales = await Sale.find({ 'payments.1': { $exists: true } }); // Find sales with at least 2 payments
        console.log(`Found ${sales.length} sales with multiple payments.`);

        const duplicates = [];

        for (const sale of sales) {
            const seenReferences = new Set();
            const seenAmounts = new Map(); // amount -> count
            
            let hasDuplicate = false;
            for (const payment of sale.payments) {
                if (payment.reference && seenReferences.has(payment.reference)) {
                    hasDuplicate = true;
                    break;
                }
                if (payment.reference) seenReferences.add(payment.reference);
                
                // Also check for same amount on same day if reference is missing or different but looks suspicious
                const dateKey = payment.date ? payment.date.toISOString().split('T')[0] : 'no-date';
                const key = `${payment.amount}-${dateKey}`;
                if (seenAmounts.has(key)) {
                    hasDuplicate = true;
                    // break; // Let's keep looking to see all duplicates
                }
                seenAmounts.set(key, (seenAmounts.get(key) || 0) + 1);
            }

            if (hasDuplicate) {
                duplicates.push({
                    id: sale._id,
                    invoiceNumber: sale.invoiceNumber,
                    payments: sale.payments
                });
            }
        }

        console.log(`Identified ${duplicates.length} sales with duplicate payments.`);
        console.log(JSON.stringify(duplicates, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDuplicates();
