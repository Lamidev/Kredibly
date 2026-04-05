const axios = require('axios');

/**
 * 🛡️ KREDDY SQUAD INTEGRATION ENGINE
 * Powers instant settlements, dynamic virtual accounts, and real-time disbursements.
 * Version: 1.0.0 (Beta)
 */

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;
const SQUAD_BASE_URL = process.env.SQUAD_ENV === 'production' 
    ? 'https://api-service.squadco.com' 
    : 'https://sandbox-api-service.squadco.com';

const squad = axios.create({
    baseURL: SQUAD_BASE_URL,
    headers: {
        Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT
 * Generates a unique GTBank account number for a specific invoice.
 */
const generateVirtualAccount = async ({ amount, customerName, email, invoiceNumber, merchantBusinessName }) => {
    try {
        const response = await squad.post('/virtual-account/business', {
            amount: Math.round(amount * 100), // Squad usually works in kobo/minor units like Paystack
            email: email || 'payments@usekredibly.com',
            first_name: 'Kredibly',
            last_name: merchantBusinessName.substring(0, 15), // Combined name: Kredibly - Merchant
            metadata: {
                invoiceNumber,
                type: 'direct_invoice_payment'
            }
        });

        if (response.data.status !== 200) {
            throw new Error(response.data.message || 'Squad Virtual Account creation failed');
        }

        return {
            accountNumber: response.data.data.account_number,
            accountName: response.data.data.account_name,
            bankName: 'Guaranty Trust Bank (GTBank)',
            transactionReference: response.data.data.transaction_reference
        };
    } catch (error) {
        console.error('❌ Squad Virtual Account Error:', error.response?.data || error.message);
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
