const axios = require('axios');
const crypto = require('crypto');

/**
 * 🛡️ KREDDY SQUAD INTEGRATION ENGINE
 * Powers instant settlements, dynamic virtual accounts, and real-time disbursements.
 * Version: 2.1.2 — Squad Dynamic Virtual Account (DVA) + Secure Webhooks
 */

const getSquadBaseUrl = () => {
    return process.env.SQUAD_ENV === 'production'
        ? 'https://api.squadco.com'
        : 'https://sandbox-api-service.squadco.com';
};

/**
 * ⚡ CREATE DYNAMIC VIRTUAL ACCOUNT (DVA)
 */
const generateVirtualAccount = async ({ amount, customerName, email, invoiceId, invoiceNumber, merchantBusinessName }) => {
    try {
        const nameParts = (customerName || 'Payment Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Payment';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

        const payload = {
            amount: Math.round(amount),
            email: email || 'payments@usekredibly.com',
            first_name: firstName.substring(0, 50),
            last_name: lastName.substring(0, 50),
            customer_identifier: invoiceId || String(invoiceNumber),
            metadata: {
                invoiceNumber,
                invoiceId,
                merchantName: merchantBusinessName,
                isKreddy: true
            }
        };

        console.log(`🛡️ Calling Squad DVA API (Env: ${process.env.SQUAD_ENV})`);
        
        const response = await axios({
            method: 'POST',
            url: `${getSquadBaseUrl()}/virtual-account/merchant/business`,
            data: payload,
            headers: {
                Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 25000
        });

        const resData = response.data;
        if (resData.status !== 200 && !resData.success) {
            throw new Error(resData.message || 'Squad VA creation failed');
        }

        const accountData = resData.data;
        return {
            accountNumber: accountData.virtual_account_number,
            accountName: accountData.beneficiary_account_name || `${merchantBusinessName} / ${customerName}`,
            bankName: 'Zenith Bank',
            transactionReference: accountData.transaction_reference,
            expiresAt: accountData.expiry_date
        };
    } catch (error) {
        console.error('❌ Squad API Error Details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
            const msg = error.response.data.message || error.response.data.error || 'Unknown Squad error';
            throw new Error(`Squad Error (${error.response.status}): ${msg}`);
        } else if (error.request) {
            console.error('No response received from Squad. Server might be unreachable or timed out.');
            throw new Error('Could not connect to Squad. Please check your internet connection or Squad server status.');
        } else {
            console.error('Local Error:', error.message);
            throw new Error(error.message);
        }
    }
};

/**
 * ✅ VERIFY SQUAD WEBHOOK SIGNATURE
 */
const verifySquadWebhookSignature = (signature, rawBody) => {
    try {
        if (!signature || !rawBody) return false;
        const secret = process.env.SQUAD_SECRET_KEY;
        if (!secret) return false;

        const computedHash = crypto
            .createHmac('sha512', secret)
            .update(rawBody)
            .digest('hex')
            .toUpperCase();

        return computedHash === signature.toUpperCase();
    } catch (err) {
        return false;
    }
};

/**
 * 💸 INITIATE INSTANT DISBURSEMENT
 */
const initiateInstantDisbursement = async ({ amount, bankCode, accountNumber, accountName, remarks }) => {
    try {
        const response = await axios({
            method: 'POST',
            url: `${getSquadBaseUrl()}/payout/transfer`,
            data: {
                amount: Math.round(amount * 100),
                bank_code: bankCode,
                account_number: accountNumber,
                account_name: accountName,
                remarks: remarks || 'Kredibly Instant Settlement',
                currency_id: 'NGN'
            },
            headers: {
                Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 25000
        });

        if (!response.data || response.data.status !== 200) {
            throw new Error(response.data?.message || 'Squad Disbursement Error');
        }
        return response.data;
    } catch (error) {
        console.error('❌ Squad Payout Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 🏦 VERIFY ACCOUNT DETAILS
 */
const verifyBankDetails = async (accountNumber, bankCode) => {
    try {
        const response = await axios({
            method: 'POST',
            url: `${getSquadBaseUrl()}/payout/account/verify`,
            data: { account_number: accountNumber, bank_code: bankCode },
            headers: {
                Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.data;
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateVirtualAccount,
    verifySquadWebhookSignature,
    initiateInstantDisbursement,
    verifyBankDetails
};
