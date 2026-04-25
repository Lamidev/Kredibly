const axios = require('axios');

/**
 * 🟢 KREDIBLY NOMBA INTEGRATION ENGINE
 * Powers instant settlements via Nomba dynamic virtual accounts.
 * Docs: https://developers.nomba.com
 */

const NOMBA_CLIENT_ID = process.env.NOMBA_CLIENT_ID;
const NOMBA_PRIVATE_KEY = process.env.NOMBA_PRIVATE_KEY;
const NOMBA_ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID;
const NOMBA_BASE_URL = process.env.NOMBA_ENV === 'production'
    ? 'https://api.nomba.com/v1'
    : 'https://api.nomba.com/v1'; // Nomba uses same base, sandbox toggled via keys

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * 🔐 GET ACCESS TOKEN
 * Nomba uses OAuth2 client credentials — token is short-lived (~1hr), so we cache it.
 */
const getAccessToken = async () => {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60000) {
        return cachedToken;
    }

    try {
        const response = await axios.post(
            `${NOMBA_BASE_URL}/auth/token/issue/`,
            {
                grant_type: 'client_credentials',
                client_id: NOMBA_CLIENT_ID,
                client_secret: NOMBA_PRIVATE_KEY
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID // ← Required by Nomba even for token issuance
                },
                timeout: 15000
            }
        );

        // Nomba wraps token in response.data.data; success indicated by code === '00'
        const tokenData = response.data?.data;
        const access_token = tokenData?.access_token;
        const expiresAt = tokenData?.expiresAt; // ISO date string e.g. "2026-04-18T05:44:06.290Z"

        if (!access_token) {
            throw new Error('Nomba auth returned no access_token. Response: ' + JSON.stringify(response.data));
        }

        cachedToken = access_token;
        tokenExpiresAt = expiresAt ? new Date(expiresAt).getTime() : now + (3600 * 1000);

        console.log('🟢 Nomba: Access token refreshed successfully');
        return cachedToken;
    } catch (err) {
        console.error('❌ Nomba Token Error:', err.response?.data || err.message);
        throw new Error('Failed to authenticate with Nomba. Check NOMBA_CLIENT_ID and NOMBA_PRIVATE_KEY.');
    }
};

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT (DVA)
 * Generates a unique bank account tied to a specific invoice amount.
 * Customer transfers exactly this amount → webhook fires → invoice marked paid.
 * 
 * @param {Object} params
 * @param {number} params.amount - Amount in Naira (not kobo)
 * @param {string} params.invoiceNumber - KR-XXXX-XXXX reference
 * @param {string} params.customerName - Customer's name for account label
 * @param {string} params.customerEmail - Customer email for reference
 * @returns {Object} { accountNumber, bankName, accountName, reference, expiresAt }
 */
const createDynamicVirtualAccount = async ({ amount, invoiceNumber, merchantName, customerEmail }) => {
    try {
        const token = await getAccessToken();

        const cleanInvoice = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '');
        const reference = `KREDINV-${cleanInvoice}-${Date.now().toString().slice(-6)}`;
        // Expire in 45 minutes to satisfy Nomba API minimum requirements (30 mins is often rejected)
        const expiryDate = new Date(Date.now() + 45 * 60 * 1000).toISOString();

        // 🛡️ SECURITY: Sanitize Name strictly for Banking App compatibility
        let finalAccountName = (merchantName || 'KREDY')
            .toUpperCase()
            .replace(/[^A-Z0-9 ]/g, '') // Keep alphanumeric + spaces for now
            .replace(/^AKINBYTE\s*/i, ''); // Strip AKINBYTE if the merchant already included it, since Nomba will add it

        const payload = {
            accountRef: reference,
            accountName: finalAccountName.substring(0, 30), // Nomba allows up to 30 chars
            bvn: '', // Not required for dynamic accounts in most cases
            expiryDate,
            callbackUrl: `${process.env.BACKEND_URL}/api/payments/webhook/nomba`,
            customerEmail: customerEmail || 'payments@usekredibly.com',
            amount: Math.round(amount * 100) // Nomba expects amount in kobo
        };

        const response = await axios.post(
            `${NOMBA_BASE_URL}/accounts/virtual`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID
                },
                timeout: 15000
            }
        );

        const data = response.data?.data;
        const bankAccNo = data?.bankAccountNumber || data?.accountNumber;
        const bankAccName = data?.bankAccountName || data?.accountName;

        if (!data || !bankAccNo) {
            console.error('❌ Nomba DVA response invalid:', response.data);
            throw new Error(response.data?.message || 'Nomba did not return a valid virtual account');
        }

        console.log(`✅ Nomba DVA created: ${bankAccNo} for Invoice ${invoiceNumber}`);

        return {
            accountNumber: bankAccNo,
            bankName: data.bankName || 'Nombank MFB',
            accountName: bankAccName || `Pay ${invoiceNumber}`,
            reference: reference,
            expiresAt: expiryDate,
            expiresIn: '45 minutes'
        };

    } catch (err) {
        // 🔴 DEEP LOGGING FOR LIVE DEBUGGING
        console.error('❌ NOMBA API ERROR DETAILS:', {
            status: err.response?.status,
            data: err.response?.data,
            errorMessage: err.message
        });
        throw new Error(err.response?.data?.message || err.response?.data?.description || 'Failed to create Nomba virtual account');
    }
};

/**
 * 💳 CREATE NOMBA CHECKOUT ORDER
 * Generates a hosted checkout page URL for SaaS subscriptions.
 * Customers can pay with Card, Transfer, USSD, etc.
 */
const createNombaCheckoutOrder = async ({ amount, orderReference, customerEmail, customerName }) => {
    try {
        const token = await getAccessToken();

        const payload = {
            order: {
                orderReference: orderReference,
                currency: "NGN",
                amount: amount.toFixed(2), // strictly "3000.00" format 
                customerEmail: customerEmail,
                customerName: customerName || 'Kredibly Merchant',
                callbackUrl: `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/merchant/settings?checkout=success`
            }
        };

        const response = await axios.post(
            `${NOMBA_BASE_URL}/checkout/order`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID
                },
                timeout: 15000
            }
        );

        // API returns { code: "00", description: "Success", data: { checkoutLink: "..." } }
        const data = response.data?.data;
        if (!data || !data.checkoutLink) {
            throw new Error('Nomba did not return a valid checkout link');
        }

        console.log(`✅ Nomba Checkout created: ${data.checkoutLink} for Order ${orderReference}`);
        return data.checkoutLink;

    } catch (err) {
        console.error('❌ NOMBA CHECKOUT ERROR DETAILS:', err.response?.data || err.message);
        throw new Error(err.response?.data?.description || err.response?.data?.message || 'Failed to initialize Kredibly checkout');
    }
};

/**
 * 🔐 VERIFY NOMBA WEBHOOK SIGNATURE
 * Nomba signs webhooks with a signature header. Always verify before processing.
 * 
 * @param {string} signature - Value of 'nomba-signature' header
 * @param {string|Buffer} rawBody - The raw request body (unparsed)
 * @returns {boolean}
 */
const verifyWebhookSignature = (signature, rawBody) => {
    try {
        const crypto = require('crypto');
        const secret = process.env.NOMBA_WEBHOOK_SECRET || NOMBA_PRIVATE_KEY;
        
        const payload = Buffer.isBuffer(rawBody) ? rawBody : String(rawBody);
        const expected512 = crypto.createHmac('sha512', secret).update(payload).digest('hex');
        if (signature === expected512) return true;

        // Try SHA256 fallback (Some newer Nomba accounts)
        const expected256 = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        if (signature === expected256) return true;

        console.warn(`🛡️ Signature Mismatch! [Payload Length: ${payload.length}]`);
        return false;
    } catch (err) {
        console.error('❌ Nomba Webhook Verification Error:', err.message);
        return false;
    }
};

/**
 * 🔍 CHECK PAYMENT STATUS
 * Manually queries Nomba for transactions associated with an account reference.
 */
/**
 * Manually queries Nomba for transactions associated with a specific virtual account.
 * This is the official reliable way to check DVA status.
 */
const checkPaymentStatusByReference = async (accountReference, accountNumber) => {
    try {
        const token = await getAccessToken();
        
        // 🔎 OFFICIAL WAY: Query transactions for the specific Account Number
        const response = await axios.get(
            `https://api.nomba.com/v1/transactions/virtual`,
            {
                params: { virtual_account: accountNumber },
                headers: {
                    Authorization: `Bearer ${token}`,
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000
            }
        );

        console.log(`🔍 Nomba Transaction Audit [${accountNumber}]:`, JSON.stringify(response.data));

        const transactions = response.data?.data?.results || response.data?.data?.content || [];
        
        // Find any transaction that is SUCCESSFUL and matches our reference
        const successTx = transactions.find(tx => 
            (tx.status === 'SUCCESS' || tx.status === 'SUCCESSFUL') && 
            (tx.virtualAccountReference === accountReference || tx.accountReference === accountReference || tx.orderReference === accountReference)
        );
        
        if (successTx) {
            // Note: Transactions from /transactions/virtual are often already in Naira (e.g. "100.0")
            const rawAmount = parseFloat(successTx.amount || 0);
            const creditedAmount = rawAmount > 5 ? rawAmount : rawAmount * 100; // Fail-safe for kobo vs naira

            return {
                paid: true,
                amount: rawAmount, // Use raw amount as it is "100.0" in the verified response
                transactionReference: successTx.transactionReference || successTx.paymentVendorReference || accountReference,
                payer: successTx.senderName || 'Bank Transfer'
            };
        }

        return { paid: false };
    } catch (err) {
        console.error('❌ Nomba Transaction Audit Failed:', err.response?.data || err.message);
        return { paid: false };
    }
};

/**
 * 💸 INITIATE BANK TRANSFER (Auto-Sweep)
 * Moves funds from Kredibly's Nomba wallet to merchant's registered bank.
 * Called automatically after a successful customer payment webhook.
 * 
 * @param {Object} params
 * @param {number} params.amount - Amount in Naira
 * @param {string} params.bankCode - Merchant's bank code (e.g. "058" for GTBank)
 * @param {string} params.accountNumber - Merchant's account number
 * @param {string} params.accountName - Merchant's account name
 * @param {string} params.narration - Payment description
 * @returns {Object} Transfer response
 */
const initiateTransfer = async ({ amount, bankCode, accountNumber, accountName, narration }) => {
    try {
        const token = await getAccessToken();

        // 🚀 NOMBA V2: Transfers use the v2 API with slightly different fields
        const response = await axios.post(
            `https://api.nomba.com/v2/transfers/bank`,
            {
                amount: Math.round(amount * 100), // Nomba v2 still expects kobo
                bankCode,
                accountNumber,
                accountName,
                narration: narration || 'Kredibly Invoice Settlement',
                senderName: 'Kredibly',
                merchantTxRef: `KREDSWEEP_${Date.now()}_${Math.floor(Math.random() * 9999)}`
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: NOMBA_ACCOUNT_ID
                },
                timeout: 15000
            }
        );

        console.log(`✅ Nomba Transfer initiated: ₦${amount} → ${accountNumber}`);
        return response.data;

    } catch (err) {
        console.error('❌ Nomba Transfer Error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.response?.data?.description || 'Failed to initiate Nomba transfer');
    }
};

module.exports = {
    getAccessToken,
    createDynamicVirtualAccount,
    createNombaCheckoutOrder,
    verifyWebhookSignature,
    initiateTransfer,
    checkPaymentStatusByReference
};
