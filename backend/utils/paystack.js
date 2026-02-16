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
        // Handle Test Mode Limit: "Test mode daily limit of 3 live bank resolves exceeded"
        if (err.message.includes("limit") && process.env.PAYSTACK_SECRET_KEY.startsWith("sk_test_")) {
            console.warn("⚠️ Paystack Limit Hit - Returning Mock Name for Testing");
            return {
                account_number: accountNumber,
                account_name: "KREDIBLY TEST USER (LIMIT EXCEEDED)",
                bank_id: 999
            };
        }
        throw err;
    }
};

/**
 * 3. Create Subaccount (For Split Payments)
 */
const createSubaccount = async (businessName, bankCode, accountNumber, percentage = 95) => {
    // We default to giving them 95%, keeping 5% as platform fee (adjustable)
    const payload = {
        business_name: businessName, 
        bank_code: bankCode, 
        account_number: accountNumber, 
        percentage_charge: 5, // 5% Platform Fee
        primary_contact_email: "support@usekredibly.com", // Fallback contact
        primary_contact_name: "Kredibly Platform",
        primary_contact_phone: "08000000000"
    };
    return paystackRequest('/subaccount', 'POST', payload);
};

module.exports = {
    verifyPaystackReference,
    getBanks,
    resolveAccount,
    createSubaccount
};
