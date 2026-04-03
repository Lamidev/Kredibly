const axios = require('axios');
const crypto = require('crypto');

/**
 * 🛡️ KREDDY SQUAD INTEGRATION ENGINE
 * Powers instant settlements, dynamic virtual accounts, and real-time disbursements.
 * Version: 2.1.0 — Squad Dynamic Virtual Account (DVA) + Secure Webhooks
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
    },
    timeout: 15000
});

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT (DVA)
 * Generates a unique Zenith Bank account number for a specific amount.
 * 
 * Squad DVA endpoint: POST /virtual-account/merchant/business
 * Reference: https://squadco.com/documentation/virtual-account/#dynamic-virtual-account
 */
const generateVirtualAccount = async ({ amount, customerName, email, invoiceNumber, merchantBusinessName }) => {
    try {
        const nameParts = (customerName || 'Payment Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Payment';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

        const response = await squad.post('/virtual-account/merchant/business', {
            // DVA initialization expects amount in NAIRA (not kobo)
            amount: Math.round(amount),
            email: email || 'payments@usekredibly.com',
            first_name: firstName.substring(0, 50),
            last_name: lastName.substring(0, 50),
            // customer_identifier uniquely links this VA to this invoice
            customer_identifier: invoiceNumber,
            metadata: {
                invoiceNumber,
                merchantName: merchantBusinessName,
                isKreddy: true
            }
        });

        const resData = response.data;

        // Squad returns status: 200 in the response body for success
        if (resData.status !== 200 && !resData.success) {
            throw new Error(resData.message || 'Squad VA creation failed');
        }

        const accountData = resData.data;

        return {
            accountNumber: accountData.virtual_account_number,
            accountName: accountData.beneficiary_account_name || `${merchantBusinessName} / ${customerName}`,
            bankName: 'Zenith Bank', // Squad DVA typically uses Zenith
            transactionReference: accountData.transaction_reference,
            expiresAt: accountData.expiry_date
        };
    } catch (error) {
        const squadError = error.response?.data?.message || error.message;
        console.error('❌ Squad Dynamic VA Error:', squadError);
        
        // Informative mapping for common errors
        if (squadError.includes('profiled')) {
            throw new Error('This merchant is currently not profiled for Squad Instant Transfers. Please use Paystack Transfer for now.');
        }
        throw error;
    }
};

/**
 * ✅ VERIFY SQUAD WEBHOOK SIGNATURE
 * Verifies that the payment notification actually came from Squad.
 * 
 * Logic: Computing HMAC SHA512 of the RAW request body provided by middleware.
 */
const verifySquadWebhookSignature = (signature, rawBody) => {
    try {
        if (!signature || !rawBody) return false;
        
        const computedHash = crypto
            .createHmac('sha512', SQUAD_SECRET_KEY)
            .update(rawBody)
            .digest('hex')
            .toUpperCase();

        const match = computedHash === signature.toUpperCase();
        if (!match) {
            console.warn('🛡️ Squad Signature Mismatch detected.');
        }
        return match;
    } catch (err) {
        console.error('❌ Squad Signature verification failed:', err.message);
        return false;
    }
};

/**
 * 💸 INITIATE INSTANT DISBURSEMENT
 * Pushes funds from Squad wallet to Merchant's bank account via the Payout API.
 */
const initiateInstantDisbursement = async ({ amount, bankCode, accountNumber, accountName, remarks }) => {
    try {
        const response = await squad.post('/payout/transfer', {
            // Payout amount must be in KOBO
            amount: Math.round(amount * 100),
            bank_code: bankCode,
            account_number: accountNumber,
            account_name: accountName,
            remarks: remarks || 'Kredibly Instant Settlement',
            currency_id: 'NGN'
        });

        if (!response.data || response.data.status !== 200) {
            throw new Error(response.data?.message || 'Squad Disbursement Error');
        }

        return response.data;
    } catch (error) {
        console.error('❌ Squad Disbursement Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 🏦 VERIFY ACCOUNT DETAILS
 * Verifies NIP details via Squad API.
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
    verifySquadWebhookSignature,
    initiateInstantDisbursement,
    verifyBankDetails
};
