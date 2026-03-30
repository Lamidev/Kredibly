const https = require('https');

/**
 * Common Paystack Verification Utility
 * @param {string} reference - The Paystack transaction reference
 * @returns {Promise<object>} - The Paystack transaction data
 */
const VERIFY_URL = 'https://api.paystack.co/transaction/verify/';

// Helper for requests
const paystackRequest = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        // Ensure path starts with /
        if (!path.startsWith('/')) path = '/' + path;

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path,
            method,
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status) {
                        resolve(parsed.data);
                    } else {
                        // More descriptive error for debugging
                        console.error(`Paystack Error [${path}]:`, parsed.message);
                        reject(new Error(parsed.message || "Paystack Operation Failed"));
                    }
                } catch (e) {
                    console.error("Paystack Parse Error:", data);
                    reject(new Error("Failed to parse Paystack response"));
                }
            });
        });

        req.on('error', e => {
            console.error("Paystack Network Error:", e);
            reject(e);
        });
        
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const verifyPaystackReference = async (reference) => {
    return paystackRequest(`/transaction/verify/${reference}`);
};

/**
 * 1. Get List of Banks (for dropdown)
 */
const getBanks = async () => {
    return paystackRequest('/bank?currency=NGN');
};

/**
 * 2. Resolve Account Number (Verify Name)
 */
const resolveAccount = async (accountNumber, bankCode) => {
    try {
        return await paystackRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
    } catch (err) {
        throw err;
    }
};

/**
 * 3. Create Subaccount (For Split Payments)
 */
const createSubaccount = async (businessName, bankCode, accountNumber, successFee = 5) => {
    // successFee is our platform cut (e.g. 5 means we take 5%)
    const payload = {
        business_name: businessName, 
        bank_code: bankCode, 
        account_number: accountNumber, 
        percentage_charge: successFee, 
        primary_contact_at: 'paystack', // 🛡️ Kredibly covers the gateway fees
        primary_contact_email: "support@usekredibly.com", 
    };
    return paystackRequest('/subaccount', 'POST', payload);
};

/**
 * 4. Initialize Payment (Generate Checkout Link)
 */
const initializePayment = async (email, amount, reference, metadata = {}, subaccount = null, bearer = 'subaccount', channels = []) => {
    const payload = {
        email,
        amount: Math.round(amount * 100), // Convert to Kobo
        reference,
        metadata,
        callback_url: `${process.env.FRONTEND_URL || 'https://usekredibly.com'}/dashboard/payment/success`,
        ...(subaccount ? { subaccount, ...(bearer ? { bearer } : {}) } : {}), // 💰 Relies on Dashboard setting if bearer is empty
        ...(channels.length > 0 ? { channels } : {}) // 🛡️ Restrict payment channels if specified
    };
    return paystackRequest('/transaction/initialize', 'POST', payload);
};

/**
 * 5. Create Transfer Recipient
 */
const createTransferRecipient = async (name, accountNumber, bankCode) => {
    const payload = {
        type: "nuban",
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
    };
    return paystackRequest('/transferrecipient', 'POST', payload);
};

/**
 * 6. Initiate Transfer (Payout from Main Balance)
 */
const initiateTransfer = async (amount, recipientCode, reason = "") => {
    const payload = {
        source: "balance",
        amount: Math.round(amount * 100),
        recipient: recipientCode,
        reason: reason || "Kredibly Automatic Escrow Release"
    };
    return paystackRequest('/transfer', 'POST', payload);
};

module.exports = {
    verifyPaystackReference,
    getBanks,
    resolveAccount,
    createSubaccount,
    initializePayment,
    createTransferRecipient,
    initiateTransfer
};
