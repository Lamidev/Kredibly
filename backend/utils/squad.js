const axios = require('axios');

/**
 * 🛡️ KREDDY SQUAD INTEGRATION ENGINE
 * Powers instant settlements, dynamic virtual accounts, and real-time disbursements.
 * Version: 1.0.0 (Beta)
 */

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;
const SQUAD_BASE_URL = process.env.SQUAD_ENV === 'production' 
    ? 'https://api-d.squadco.com' 
    : 'https://sandbox-api-d.squadco.com';

const squad = axios.create({
    baseURL: SQUAD_BASE_URL,
    timeout: 10000,
    headers: {
        Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
        'Content-Type': 'application/json'
    },
    // 🛡️ SECURITY: Don't throw for 4xx/5xx so we can handle fallback logic within the function
    validateStatus: (status) => status < 500 
});

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT
 * Generates a unique GTBank account number for a specific invoice.
 */
const generateVirtualAccount = async ({ amount, customerName, email, invoiceNumber, merchantBusinessName }) => {
    try {
        const response = await squad.post('/virtual-account/initiate-dynamic-v-a', {
            amount: Math.round(amount * 100), // Kobo
            email: email || 'payments@usekredibly.com',
            transaction_ref: `INV-${invoiceNumber}-${Date.now()}`,
            duration: 3600 // 1 hour expiry
        });

        if (response.data.status !== 200) {
            // Fallback to /virtual-account/business if DVA fails (might not be profiled yet)
            console.warn(`⚠️ Squad DVA failed (${response.data.message}), attempting Variable Business VA fallback...`);
            
            const fallbackResponse = await squad.post('/virtual-account/business', {
                amount: Math.round(amount * 100),
                email: email || 'payments@usekredibly.com',
                first_name: 'Kredibly',
                last_name: (merchantBusinessName || 'Merchant').substring(0, 15),
                customer_identifier: invoiceNumber
            });

            if (fallbackResponse.data.status !== 200) {
                console.error('❌ Squad Fallback Error:', fallbackResponse.data);
                throw new Error(fallbackResponse.data.message || 'Squad Virtual Account creation failed');
            }

            return {
                accountNumber: fallbackResponse.data.data.account_number,
                accountName: fallbackResponse.data.data.account_name,
                bankName: 'Guaranty Trust Bank (GTBank)',
                transactionReference: fallbackResponse.data.data.transaction_reference
            };
        }

        return {
            accountNumber: response.data.data.account_number,
            accountName: response.data.data.account_name,
            bankName: response.data.data.bank_name || 'Guaranty Trust Bank (GTBank)',
            transactionReference: response.data.data.transaction_reference
        };
    } catch (error) {
        console.error('❌ Squad Virtual Account Error Debug:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data
            }
        });
        throw error;
    }
};

/**
 * 💸 INITIATE INSTANT DISBURSEMENT
 * Pushes funds from Squad wallet directly to Merchant's bank account.
 */
const initiateInstantDisbursement = async ({ amount, bankCode, accountNumber, accountName, remarks }) => {
    try {
        const response = await squad.post('/payout/transfer', {
            amount: Math.round(amount * 100),
            bank_code: bankCode,
            account_number: accountNumber,
            account_name: accountName,
            remarks: remarks || 'Kredibly Instant Settlement',
        });

        return response.data;
    } catch (error) {
        console.error('❌ Squad Disbursement Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 🏦 VERIFY ACCOUNT DETAILS
 * Helper to ensure the merchant's settlement bank is valid before we send money.
 */
const verifyBankDetails = async (accountNumber, bankCode) => {
    try {
        const response = await squad.post('/payout/account/verify', {
            account_number: accountNumber,
            bank_code: bankCode
        });
        return response.data.data;
    } catch (error) {
        console.error('❌ Squad Bank Verification Error:', error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    generateVirtualAccount,
    initiateInstantDisbursement,
    verifyBankDetails
};
