/**
 * 🧪 NOMBA INTEGRATION TEST SCRIPT
 * Run with: node scripts/testNomba.js
 * Tests: 1) Auth token  2) DVA creation  3) Webhook simulation
 */

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'http://localhost:7050/api';
const NOMBA_BASE_URL = 'https://api.nomba.com/v1';
const {
    NOMBA_CLIENT_ID,
    NOMBA_PRIVATE_KEY,
    NOMBA_ACCOUNT_ID
} = process.env;

const log = (emoji, label, data) => {
    console.log(`\n${emoji}  ${label}`);
    if (data !== undefined) console.log(JSON.stringify(data, null, 2));
};

const divider = () => console.log('\n' + '─'.repeat(60));

// ─── TEST 1: AUTHENTICATE WITH NOMBA ──────────────────────────
async function testAuth() {
    divider();
    console.log('🔐  TEST 1: Nomba Authentication (OAuth2 Token)');
    divider();

    try {
        const res = await axios.post(
            `${NOMBA_BASE_URL}/auth/token/issue/`,
            {
                grant_type: 'client_credentials',
                client_id: NOMBA_CLIENT_ID,
                client_secret: NOMBA_PRIVATE_KEY
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID // Required even for token issuance
                }
            }
        );

        // Nomba wraps the token inside res.data.data, success = code '00'
        const isSuccess = res.data?.code === '00';
        const tokenData = res.data?.data;
        const access_token = tokenData?.access_token;
        const expiresAt = tokenData?.expiresAt;

        if (!isSuccess || !access_token) {
            log('❌', 'AUTH RETURNED NON-SUCCESS', res.data);
            return null;
        }

        log('✅', 'AUTH SUCCESS — Token received!', {
            token_preview: access_token.substring(0, 40) + '...',
            businessId: tokenData.businessId,
            expiresAt
        });

        return access_token;
    } catch (err) {
        log('❌', 'AUTH FAILED', {
            status: err.response?.status,
            error: err.response?.data || err.message
        });

        if (err.response?.status === 401 || err.response?.status === 400) {
            console.log('\n💡 TIP: Check NOMBA_CLIENT_ID and NOMBA_PRIVATE_KEY in your .env file.');
            console.log('     Make sure they match your Nomba sandbox dashboard credentials.');
        }

        return null;
    }
};

// ─── TEST 2: CREATE DYNAMIC VIRTUAL ACCOUNT ───────────────────
async function testCreateDVA(token) {
    divider();
    console.log('⚡  TEST 2: Create Dynamic Virtual Account (DVA)');
    divider();

    if (!token) {
        log('⏭️', 'SKIPPED — No auth token available');
        return null;
    }

    const reference = `NOMBAINVTEST9999${Date.now()}`;
    const expiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const payload = {
        accountRef: reference,
        accountName: 'KREDIBLYPAY',
        expiryDate,
        callbackUrl: `${BACKEND_URL}/payments/webhook/nomba`,
        customerEmail: 'test@usekredibly.com',
        amount: Math.round(100 * 100) // ₦100 in kobo
    };

    log('📤', 'DVA Payload being sent:', payload);

    try {
        const res = await axios.post(
            `${NOMBA_BASE_URL}/accounts/virtual`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID
                }
            }
        );

        const data = res.data?.data || res.data;
        log('✅', 'DVA CREATED SUCCESSFULLY!', data);

        if (data?.accountNumber) {
            console.log(`\n   📋 Account Number : ${data.accountNumber}`);
            console.log(`   🏦 Bank Name      : ${data.bankName}`);
            console.log(`   👤 Account Name   : ${data.accountName}`);
        }

        return { reference, data };
    } catch (err) {
        log('❌', 'DVA CREATION FAILED', {
            status: err.response?.status,
            error: err.response?.data || err.message
        });

        if (err.response?.status === 422 || err.response?.status === 400) {
            console.log('\n💡 TIP: The payload may have invalid fields.');
            console.log('     Check: amount should be in Kobo. accountName max length.');
        }
        return null;
    }
}

// ─── TEST 3: SIMULATE NOMBA WEBHOOK ───────────────────────────
async function testWebhook(reference) {
    divider();
    console.log('🔔  TEST 3: Simulate Nomba Webhook to Local Backend');
    divider();

    // Use either the real reference from DVA creation, or a fake one for isolated testing
    const testRef = reference || `NOMBA_INV_TEST-FAKE_${Date.now()}`;

    const fakeWebhookPayload = {
        type: 'payment_success',
        data: {
            accountReference: testRef,
            transactionReference: `TXN_${Date.now()}`,
            amount: 10000, // ₦100 in kobo
            currency: 'NGN',
            status: 'SUCCESSFUL',
            payer: {
                name: 'Test Customer',
                bank: 'GTBank',
                accountNumber: '0123456789'
            },
            createdAt: new Date().toISOString()
        }
    };

    log('📤', 'Webhook payload being sent to your backend:', fakeWebhookPayload);

    try {
        const res = await axios.post(
            `${BACKEND_URL}/payments/webhook/nomba`,
            fakeWebhookPayload,
            { headers: { 'Content-Type': 'application/json' } }
        );

        log('✅', 'WEBHOOK ENDPOINT RESPONDED!', res.data);
        console.log('\n   ✅ Your webhook endpoint is reachable and returned 200.');
        console.log('   📌 Check your backend logs to see if it processed the event.');
        
        if (reference) {
            console.log('\n   ⚠️  NOTE: Since the reference was from a real DVA,');
            console.log('       check if the matching VirtualAccount record exists in MongoDB.');
        } else {
            console.log('\n   ℹ️  INFO: The webhook used a fake reference so it likely');
            console.log('       logged "No VA record found" — that\'s expected for this test.');
        }
    } catch (err) {
        log('❌', 'WEBHOOK SIMULATION FAILED', {
            status: err.response?.status,
            error: err.response?.data || err.message
        });

        if (err.code === 'ECONNREFUSED') {
            console.log('\n💡 TIP: Your backend doesn\'t appear to be running on port 7050.');
            console.log('     Start it with: npm run dev');
        }
    }
}

// ─── TEST 4: TEST VIA YOUR OWN BACKEND ROUTE ──────────────────
async function testInitializeViaBackend() {
    divider();
    console.log('🌐  TEST 4: Initialize Nomba Account via Backend Route (/initialize-nomba-account)');
    divider();

    // You need a real invoice ID from your DB for this test
    const TEST_INVOICE_ID = process.argv[2] || null;

    if (!TEST_INVOICE_ID) {
        console.log('   ⏭️  SKIPPED — Pass an invoice ID as argument to test this:');
        console.log('   node scripts/testNomba.js <invoiceId_or_slug>');
        return;
    }

    try {
        const res = await axios.post(`${BACKEND_URL}/payments/initialize-nomba-account`, {
            invoiceId: TEST_INVOICE_ID,
            amount: 100
        });

        log('✅', 'BACKEND ROUTE SUCCESS!', res.data);
    } catch (err) {
        log('❌', 'BACKEND ROUTE FAILED', {
            status: err.response?.status,
            error: err.response?.data || err.message
        });
    }
}

// ─── MAIN RUNNER ──────────────────────────────────────────────
async function main() {
    console.log('\n🚀  KREDIBLY — NOMBA INTEGRATION TEST SUITE');
    console.log(`    Environment : ${process.env.NOMBA_ENV || 'not set'}`);
    console.log(`    Client ID   : ${NOMBA_CLIENT_ID || '❌ NOT SET'}`);
    console.log(`    Account ID  : ${NOMBA_ACCOUNT_ID || '❌ NOT SET'}`);
    console.log(`    Private Key : ${NOMBA_PRIVATE_KEY ? NOMBA_PRIVATE_KEY.substring(0, 15) + '...' : '❌ NOT SET'}`);

    const token = await testAuth();
    const dvaResult = await testCreateDVA(token);
    await testWebhook(dvaResult?.reference || null);
    await testInitializeViaBackend();

    divider();
    console.log('\n📊  TEST COMPLETE');
    console.log('    Check backend terminal logs for full webhook processing details.\n');
}

main().catch(console.error);
