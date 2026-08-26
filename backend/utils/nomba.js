const axios = require('axios');
const https = require('https');
const http = require('http');

// 🌐 NETWORK AGENTS: Force IPv4 to match Nomba Whitelisting (prevents 403 Unknown Source on IPv6 servers)
const ipv4HttpsAgent = new https.Agent({ family: 4 });
const ipv4HttpAgent = new http.Agent({ family: 4 });


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

// 🛡️ Nomba Integration: Production ready with static IP whitelisting.

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * 🔐 GET ACCESS TOKEN
 * Nomba uses OAuth2 client credentials — token is short-lived (~1hr), so we cache it.
 */
const getAccessToken = async (retryCount = 0) => {
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
                    accountId: NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );

        const tokenData = response.data?.data;
        const access_token = tokenData?.access_token;
        const expiresAt = tokenData?.expiresAt;

        if (!access_token) {
            throw new Error('Nomba auth returned no access_token');
        }

        cachedToken = access_token;
        tokenExpiresAt = expiresAt ? new Date(expiresAt).getTime() : now + (3600 * 1000);

        console.log('🟢 Nomba: Access token refreshed successfully');
        return cachedToken;
    } catch (err) {
        console.error(`❌ Nomba Token Error (Attempt ${retryCount + 1}):`, err.response?.data || err.message);
        
        if (retryCount < 1) {
            console.log('🔄 Retrying Nomba authentication...');
            return await getAccessToken(retryCount + 1);
        }
        
        throw new Error('Failed to authenticate with Nomba after retries. Check credentials and account status.');
    }
};

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT (DVA)
 * Generates a unique bank account tied to a specific invoice amount.
 * Customer transfers exactly this amount → webhook fires → invoice marked paid.
 */
const createDynamicVirtualAccount = async ({ amount, invoiceNumber, merchantName, customerEmail }) => {
    try {
        const token = await getAccessToken();

        const cleanInvoice = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '');
        const reference = `KREDINV-${cleanInvoice}-${Date.now().toString().slice(-6)}`;
        // Expire in 24 hours to give the customer enough time to pay
        const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
            callbackUrl: process.env.BACKEND_URL.includes('localhost') 
                ? `https://api.usekredibly.com/api/payments/webhook/nomba` 
                : `${process.env.BACKEND_URL}/api/payments/webhook/nomba`,
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
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
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
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );

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
 */
const verifyWebhookSignature = (signature, rawBody) => {
    if (!signature) return false;
    try {
        const crypto = require('crypto');
        const cleanSig = String(signature).replace(/^sha(256|512)=/i, '').trim();
        const payload = Buffer.isBuffer(rawBody) ? rawBody : String(rawBody);
        const secrets = [process.env.NOMBA_WEBHOOK_SECRET, process.env.NOMBA_PRIVATE_KEY].filter(Boolean);
        
        if (secrets.length === 0) return true; // No secret configured

        for (const secret of secrets) {
            // HMAC SHA256 (Nomba standard)
            const hmac256 = crypto.createHmac('sha256', secret).update(payload);
            const hex256 = hmac256.digest('hex');
            const b64256 = crypto.createHmac('sha256', secret).update(payload).digest('base64');

            if (cleanSig.toLowerCase() === hex256.toLowerCase() || cleanSig === b64256) return true;

            // HMAC SHA512 fallback
            const hmac512 = crypto.createHmac('sha512', secret).update(payload);
            const hex512 = hmac512.digest('hex');
            const b64512 = crypto.createHmac('sha512', secret).update(payload).digest('base64');

            if (cleanSig.toLowerCase() === hex512.toLowerCase() || cleanSig === b64512) return true;
        }
        return false;
    } catch (err) {
        console.error('❌ Signature verification error:', err.message);
        return false;
    }
};

/**
 * 🏦 GET LIST OF BANKS
 */
const getBanks = async () => {
    try {
        const token = await getAccessToken();
        const response = await axios.get(
            `${NOMBA_BASE_URL}/transfers/banks`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );
        return response.data?.data || [];
    } catch (err) {
        return [];
    }
};

/**
 * 🔍 RESOLVE BANK ACCOUNT
 */
const resolveAccount = async (accountNumber, bankCode) => {
    try {
        const token = await getAccessToken();
        const response = await axios.post(
            `${NOMBA_BASE_URL}/transfers/bank/lookup`,
            {
                accountNumber,
                bankCode: getNombaBankCode(bankCode)
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );
        const data = response.data?.data;
        if (!data || !data.accountName) throw new Error('Could not resolve account');
        return { account_number: accountNumber, account_name: data.accountName };
    } catch (err) {
        throw new Error(err.response?.data?.description || 'Failed to verify account');
    }
};

/**
 * 🔍 CHECK PAYMENT STATUS
 */
const checkPaymentStatusByReference = async (accountReference, accountNumber) => {
    try {
        const token = await getAccessToken();
        const response = await axios.get(
            `https://api.nomba.com/v1/transactions/virtual`,
            {
                params: { virtual_account: accountNumber },
                headers: {
                    Authorization: `Bearer ${token}`,
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );

        const transactions = response.data?.data?.results || response.data?.data?.content || [];
        const successTx = transactions.find(tx => 
            (tx.status === 'SUCCESS' || tx.status === 'SUCCESSFUL') && 
            (tx.virtualAccountReference === accountReference || tx.accountReference === accountReference)
        );
        
        if (successTx) {
            return {
                paid: true,
                amount: parseFloat(successTx.amount || 0),
                transactionReference: successTx.id || accountReference,
                payer: successTx.senderName || 'Bank Transfer',
                walletBalance: parseFloat(successTx.walletBalance || 0)
            };
        }
        return { paid: false };
    } catch (err) {
        return { paid: false };
    }
};

const getNombaBankCode = (code) => {
    const mapping = {
        '999992': '305', '999991': '302', '50515': '090405', '50211': '090267', '100004': '305'
    };
    return mapping[code] || code;
};

/**
 * 💸 INITIATE BANK TRANSFER (Auto-Sweep)
 * Moves funds from Kredibly's Nomba wallet to merchant's registered bank.
 */
const initiateTransfer = async ({ amount, bankCode, accountNumber, accountName, narration }) => {
    try {
        const token = await getAccessToken();
        const nombaBankCode = getNombaBankCode(bankCode);

        const response = await axios.post(
            `https://api.nomba.com/v2/transfers/bank`,
            {
                amount: Number(amount).toFixed(2), // 🛡️ Nomba V2 expects string with 2 decimal places
                bankCode: nombaBankCode,
                accountNumber,
                accountName,
                narration: String(narration || 'Kredibly Settlement').substring(0, 25).toUpperCase(),
                senderName: 'AKINBYTE',
                feeBearer: 'ACCOUNT', // 🛡️ KREDIBLY COVERS THE TRANSFER FEE
                merchantTxRef: `KREDSWEEP_${Date.now()}_${Math.floor(Math.random() * 9999)}`
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );

        console.log(`✅ Nomba Transfer initiated: ₦${amount} → ${accountNumber}`);
        return response.data;
    } catch (err) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.message || errorData?.description || err.message;
        const errorCode = errorData?.code || 'UNKNOWN';
        
        console.error(`❌ Nomba Transfer Error [${errorCode}]:`, errorMessage);
        
        // Throw structured error to allow Controller to handle specific bank issues
        const customError = new Error(errorMessage);
        customError.code = errorCode;
        customError.data = errorData;
        throw customError;
    }
};

/**
 * 💰 GET MERCHANT WALLET BALANCE
 */
const getMerchantBalance = async () => {
    try {
        const token = await getAccessToken();
        const response = await axios.get(
            `${NOMBA_BASE_URL}/accounts/${process.env.NOMBA_ACCOUNT_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    accountId: process.env.NOMBA_ACCOUNT_ID
                },
                timeout: 15000,
                proxy: false,
                httpsAgent: ipv4HttpsAgent,
                httpAgent: ipv4HttpAgent
            }
        );
        return parseFloat(response.data?.data?.walletBalance || 0);
    } catch (err) {
        return null;
    }
};

module.exports = {
    getAccessToken,
    createDynamicVirtualAccount,
    createNombaCheckoutOrder,
    verifyWebhookSignature,
    initiateTransfer,
    checkPaymentStatusByReference,
    getBanks,
    resolveAccount,
    getMerchantBalance
};
