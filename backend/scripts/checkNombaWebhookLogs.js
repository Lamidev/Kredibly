/**
 * 🔍 NOMBA WEBHOOK AUDIT SCRIPT
 * Checks if any DVA payment webhooks actually reached the Kredibly server.
 * Run with: node scripts/checkNombaWebhookLogs.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({ 
    type: String, 
    data: Object, 
    createdAt: { type: Date, default: Date.now } 
});

async function run() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    const SystemLog = mongoose.model('SystemLog', SystemLogSchema);

    // Get last 20 Nomba webhook hits
    const logs = await SystemLog.find({ type: 'NOMBA_WEBHOOK' })
        .sort({ createdAt: -1 })
        .limit(20);

    if (logs.length === 0) {
        console.log('❌ NO NOMBA WEBHOOK LOGS FOUND');
        console.log('   This means Nomba has NOT called your webhook endpoint yet.');
        console.log('   Check that BACKEND_URL=https://api.usekredibly.com is correct.');
        console.log('   Also verify the DVA callbackUrl is reaching the live server.\n');
    } else {
        console.log(`✅ Found ${logs.length} Nomba webhook call(s):\n`);
        logs.forEach((log, i) => {
            const body = log.data?.body || {};
            console.log(`--- Webhook #${i + 1} (${new Date(log.createdAt).toLocaleString()}) ---`);
            console.log(`  Event type:     ${body?.type || body?.event || body?.status || '(none)'}`);
            console.log(`  accountRef:     ${body?.data?.accountRef || body?.accountRef || '(missing)'}`);
            console.log(`  accountReference: ${body?.data?.accountReference || body?.accountReference || '(missing)'}`);
            console.log(`  transactionRef: ${body?.data?.transactionReference || body?.transactionReference || '(missing)'}`);
            console.log(`  amount:         ${body?.data?.amount || body?.amount || '(missing)'}`);
            console.log(`  Top-level keys: [${Object.keys(body).join(', ')}]`);
            if (body?.data) {
                console.log(`  data keys:      [${Object.keys(body.data).join(', ')}]`);
            }
            console.log('');
        });
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌ Script error:', err.message);
    process.exit(1);
});
