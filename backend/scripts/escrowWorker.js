/**
 * 🕒 KREDIBLY ESCROW WORKER
 * Periodically checks for escrow payments that are ready for release.
 * Handles the 24h security lock for bank detail changes.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const EscrowPayment = require('../models/EscrowPayment');
const { releaseMerchantEscrow } = require('../utils/payouts');

const runWorker = async () => {
    try {
        console.log('🕒 Escrow Worker: Starting check...');
        
        // Connect to DB if not already (for standalone script usage)
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        }

        // Find all unique business IDs with pending escrow ready for release
        const readyEscrows = await EscrowPayment.find({
            status: 'pending',
            releaseDate: { $lte: new Date() }
        }).distinct('businessId');

        console.log(`🔍 Found ${readyEscrows.length} merchants with ready escrow funds.`);

        for (const businessId of readyEscrows) {
            console.log(`💸 Processing release for Merchant ${businessId}...`);
            await releaseMerchantEscrow(businessId);
        }

        console.log('✅ Escrow Worker: Finished successfully.');
        if (require.main === module) process.exit(0);
    } catch (err) {
        console.error('❌ Escrow Worker Error:', err.message);
        if (require.main === module) process.exit(1);
    }
};

if (require.main === module) {
    runWorker();
}

module.exports = runWorker;
