/**
 * diagnoseLive.js — Check what happened with the latest invoice delivery
 * Run from: backend/
 *   node scratch/diagnoseLive.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const axios = require('axios');

const INVOICE = process.env.TEST_INVOICE || 'KR-FPZX-TCDU';
const MONGO_URL = process.env.MONGODB_URL;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

async function run() {
    console.log(`\n=== KREDDY LIVE DIAGNOSIS: ${INVOICE} ===\n`);

    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db();

    // 1. Inspect the Sale record
    const sale = await db.collection('sales').findOne({ invoiceNumber: INVOICE });
    if (!sale) {
        console.error('❌ Sale NOT FOUND in DB for:', INVOICE);
        await client.close();
        return;
    }

    console.log('--- SALE RECORD ---');
    console.log(`  invoiceNumber   : ${sale.invoiceNumber}`);
    console.log(`  customerName    : ${sale.customerName}`);
    console.log(`  customerPhone   : ${sale.customerPhone}`);
    console.log(`  deliveredToPhone: ${sale.deliveredToPhone || '(not set)'}`);
    console.log(`  lifecycleStatus : ${sale.lifecycleStatus}`);
    console.log(`  pdfUrl          : ${sale.pdfUrl || '❌ NOT SET — PDF generation failed'}`);
    console.log(`  totalAmount     : ₦${sale.totalAmount?.toLocaleString()}`);
    console.log(`  payments        : ${JSON.stringify(sale.payments)}`);
    console.log(`  dueDate         : ${sale.dueDate}`);
    console.log(`  createdAt       : ${sale.createdAt}`);

    // 2. Check reminders scheduled
    const reminders = await db.collection('reminders').find({ saleId: sale._id }).toArray();
    console.log(`\n--- REMINDERS (${reminders.length} found) ---`);
    reminders.forEach(r => {
        console.log(`  [${r.status}] seq:${r.reminderSequence} → ${r.triggerDate} (${r.recipientType} / ${r.recipientPhone})`);
    });

    // 3. Test direct WhatsApp API to customer
    const customerPhone = sale.customerPhone || sale.deliveredToPhone;
    console.log(`\n--- WHATSAPP API TEST ---`);
    console.log(`  PHONE_ID  : ${PHONE_ID || '❌ MISSING'}`);
    console.log(`  TOKEN     : ${TOKEN ? TOKEN.substring(0, 20) + '...' : '❌ MISSING'}`);
    console.log(`  Customer  : ${customerPhone}`);

    if (!customerPhone) {
        console.error('❌ No customer phone on record!');
        await client.close();
        return;
    }

    // Test 1: Try sending a plain text to customer
    console.log(`\n[Test] Sending text to customer ${customerPhone}...`);
    try {
        const resp = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'text',
                text: { body: `Hi ${sale.customerName}! This is a test message from Kreddy. Your invoice #${sale.invoiceNumber} is ready.`, preview_url: false }
            },
            { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 15000 }
        );
        console.log(`✅ Text to customer sent! wa_id: ${resp.data?.contacts?.[0]?.wa_id}`);
    } catch (err) {
        console.error(`❌ Text to customer FAILED:`);
        console.error(JSON.stringify(err.response?.data || err.message, null, 2));
        console.error('');
        console.error('>>> LIKELY CAUSE: Customer number is not registered on WhatsApp,');
        console.error('>>> or Meta API does not have permission to message this number.');
    }

    // Test 2: If pdfUrl exists, try sending to customer
    if (sale.pdfUrl) {
        console.log(`\n[Test] Sending PDF to customer ${customerPhone}...`);
        try {
            const resp2 = await axios.post(
                `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: customerPhone,
                    type: 'document',
                    document: {
                        link: sale.pdfUrl,
                        filename: `Invoice-${sale.invoiceNumber}.pdf`,
                        caption: `Invoice #${sale.invoiceNumber}`
                    }
                },
                { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 20000 }
            );
            console.log(`✅ PDF to customer sent!`);
        } catch (err) {
            console.error(`❌ PDF to customer FAILED:`, JSON.stringify(err.response?.data || err.message, null, 2));
        }
    } else {
        console.log(`\n⚠️  Skipping PDF test — pdfUrl not set on this sale. PDF generation failed earlier.`);
    }

    // 3. Get business and test merchant
    const business = await db.collection('businessprofiles').findOne({ _id: sale.businessId });
    if (business?.whatsappNumber && sale.pdfUrl) {
        console.log(`\n[Test] Sending PDF to merchant ${business.whatsappNumber}...`);
        try {
            const resp3 = await axios.post(
                `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: business.whatsappNumber,
                    type: 'document',
                    document: {
                        link: sale.pdfUrl,
                        filename: `Invoice-${sale.invoiceNumber}.pdf`,
                        caption: `Your copy of Invoice #${sale.invoiceNumber} for ${sale.customerName}`
                    }
                },
                { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 20000 }
            );
            console.log(`✅ PDF to merchant sent!`);
        } catch (err) {
            console.error(`❌ PDF to merchant FAILED:`, JSON.stringify(err.response?.data || err.message, null, 2));
        }
    }

    await client.close();
    console.log('\n=== DIAGNOSIS COMPLETE ===');
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
