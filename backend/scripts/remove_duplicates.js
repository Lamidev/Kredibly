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
    status: String,
    totalAmount: Number
});

const Sale = mongoose.model('Sale', SaleSchema);

async function removeDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const sales = await Sale.find({ 'payments.1': { $exists: true } });
        console.log(`Checking ${sales.length} sales with multiple payments...`);

        let totalRemoved = 0;

        for (const sale of sales) {
            const seenReferences = new Set();
            const seenAmountsOnDate = new Set();
            const newPayments = [];
            let changed = false;

            for (const payment of sale.payments) {
                const dateStr = payment.date ? payment.date.toISOString().split('T')[0] : 'no-date';
                const amountKey = `${payment.amount}-${dateStr}`;

                let isDuplicate = false;
                
                // Check by reference
                if (payment.reference && seenReferences.has(payment.reference)) {
                    isDuplicate = true;
                }
                
                // Check by amount and date (very likely a duplicate if same amount on same day for same sale)
                if (!isDuplicate && seenAmountsOnDate.has(amountKey)) {
                    isDuplicate = true;
                }

                if (isDuplicate) {
                    console.log(`Removing duplicate payment from sale ${sale.invoiceNumber}: Amount ${payment.amount}, Ref ${payment.reference}`);
                    changed = true;
                    totalRemoved++;
                } else {
                    newPayments.push(payment);
                    if (payment.reference) seenReferences.add(payment.reference);
                    seenAmountsOnDate.add(amountKey);
                }
            }

            if (changed) {
                sale.payments = newPayments;
                
                // Re-calculate status
                const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                if (paid >= sale.totalAmount) {
                    sale.status = "paid";
                } else if (paid > 0) {
                    sale.status = "partial";
                } else {
                    sale.status = "unpaid";
                }

                await sale.save();
                console.log(`Updated sale ${sale.invoiceNumber}`);
            }
        }

        console.log(`Cleanup complete. Total duplicate payments removed: ${totalRemoved}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

removeDuplicates();
