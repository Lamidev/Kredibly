/**
 * redeliverInvoice.js — Regenerate PDF with fixed Cloudinary settings and redeliver
 * Run from: backend/
 *   node scratch/redeliverInvoice.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const axios = require('axios');

const INVOICE = process.env.TEST_INVOICE || 'KR-FPZX-TCDU';
const MONGO_URL = process.env.MONGODB_URL;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN;

async function run() {
    console.log(`\n=== REDELIVER WITH PDF FIX: ${INVOICE} ===\n`);

    // Step 1: Read data with native driver
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db();

    const sale = await db.collection('sales').findOne({ invoiceNumber: INVOICE });
    const business = await db.collection('businessprofiles').findOne({ _id: sale.businessId });

    console.log(`Sale: ${sale.invoiceNumber} | Customer: ${sale.customerName} (${sale.customerPhone})`);
    console.log(`Business: ${business.displayName} | Merchant: ${business.whatsappNumber}`);
    await client.close();

    // Step 2: Connect Mongoose
    console.log('\n🔌 Connecting Mongoose...');
    await new Promise((resolve, reject) => {
        mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 15000 });
        mongoose.connection.once('open', resolve);
        mongoose.connection.once('error', reject);
    });
    console.log('✅ Mongoose connected!');

    // Step 3: Regenerate PDF with fixed Cloudinary settings
    const BASE = 'C:/Users/user/Desktop/My-Projects/Non-active-projects/Kredibly/backend';
    const { generateAndUploadInvoicePDF } = require(`${BASE}/utils/pdfGenerator`);
    const Sale = require(`${BASE}/models/Sale`);
    const BusinessProfile = require(`${BASE}/models/BusinessProfile`);

    const saleFull = await Sale.findOne({ invoiceNumber: INVOICE });
    const bizFull = await BusinessProfile.findById(saleFull.businessId);

    console.log('\n📄 Regenerating PDF with fixed Cloudinary upload settings...');
    const newPdfUrl = await generateAndUploadInvoicePDF(saleFull, bizFull);

    if (!newPdfUrl) {
        console.error('❌ PDF generation/upload failed! Check Cloudinary credentials.');
        await mongoose.disconnect();
        return;
    }

    console.log(`✅ New PDF URL: ${newPdfUrl}`);

    // Step 4: Verify the new URL is publicly accessible
    console.log('\n🔍 Verifying URL is publicly accessible...');
    try {
        const headResp = await axios.head(newPdfUrl, { timeout: 10000 });
        console.log(`✅ URL is public! HTTP ${headResp.status} | Content-Type: ${headResp.headers['content-type']}`);
    } catch (err) {
        console.error(`❌ URL still returning error: ${err.response?.status} ${err.message}`);
        console.error('Cloudinary account may have restricted access mode. Check Cloudinary dashboard settings.');
    }

    // Step 5: Update pdfUrl in DB
    await Sale.findByIdAndUpdate(saleFull._id, { pdfUrl: newPdfUrl });
    console.log('✅ pdfUrl updated in DB');

    // Step 6: Send PDF to customer
    const customerPhone = saleFull.customerPhone || saleFull.deliveredToPhone;
    console.log(`\n📤 Sending PDF to customer ${customerPhone}...`);
    try {
        const r1 = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'document',
                document: {
                    link: newPdfUrl,
                    filename: `Invoice-${sale.invoiceNumber}.pdf`,
                    caption: `Invoice from ${business.displayName} — ₦${saleFull.totalAmount.toLocaleString()}`
                }
            },
            { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 20000 }
        );
        console.log(`✅ PDF sent to customer! wamid: ${r1.data?.messages?.[0]?.id}`);
    } catch (err) {
        console.error(`❌ PDF to customer FAILED:`, JSON.stringify(err.response?.data || err.message, null, 2));
    }

    // Step 7: Send interactive buttons to customer
    console.log(`\n📤 Sending interactive buttons to customer ${customerPhone}...`);
    const bal = saleFull.totalAmount - (saleFull.payments || []).reduce((s, p) => s + p.amount, 0);
    try {
        const r2 = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: { type: 'text', text: `Invoice #${sale.invoiceNumber}` },
                    body: {
                        text: `Hello ${saleFull.customerName}!\n\nYou have an outstanding balance from *${business.displayName}*.\n\nInvoice Total: ₦${saleFull.totalAmount.toLocaleString()}\nAlready Paid: ₦${(saleFull.totalAmount - bal).toLocaleString()}\nAmount Due: *₦${bal.toLocaleString()}*\nPayment Due: ${saleFull.dueDate ? new Date(saleFull.dueDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'On receipt'}\n\nTap a button below to take action:`
                    },
                    action: {
                        buttons: [
                            { type: 'reply', reply: { id: `pay_now:${saleFull._id}`, title: 'Pay Now' } },
                            { type: 'reply', reply: { id: `req_ext:${saleFull._id}`, title: 'Request Extension' } }
                        ]
                    }
                }
            },
            { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 15000 }
        );
        console.log(`✅ Buttons sent to customer! wamid: ${r2.data?.messages?.[0]?.id}`);
    } catch (err) {
        console.error(`❌ Buttons to customer FAILED:`, JSON.stringify(err.response?.data || err.message, null, 2));
    }

    // Step 8: Send PDF to merchant
    console.log(`\n📤 Sending PDF to merchant ${business.whatsappNumber}...`);
    try {
        const r3 = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: business.whatsappNumber,
                type: 'document',
                document: {
                    link: newPdfUrl,
                    filename: `Invoice-${sale.invoiceNumber}.pdf`,
                    caption: `Your copy of Invoice #${sale.invoiceNumber} for ${saleFull.customerName}`
                }
            },
            { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 20000 }
        );
        console.log(`✅ PDF sent to merchant! wamid: ${r3.data?.messages?.[0]?.id}`);
    } catch (err) {
        console.error(`❌ PDF to merchant FAILED:`, JSON.stringify(err.response?.data || err.message, null, 2));
    }

    await mongoose.disconnect();
    console.log('\n=== REDELIVERY COMPLETE ===');
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
