const axios = require('axios');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function checkBanks() {
    try {
        const response = await axios.get('https://api.paystack.co/bank?country=nigeria', {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });
        
        const banks = response.data.data;
        const opay = banks.find(b => b.name.toLowerCase().includes('opay'));
        const kuda = banks.find(b => b.name.toLowerCase().includes('kuda'));
        const palmpay = banks.find(b => b.name.toLowerCase().includes('palmpay'));
        const moniepoint = banks.find(b => b.name.toLowerCase().includes('moniepoint'));
        
        console.log('🏦 Paystack Bank List Audit:');
        console.log('---------------------------');
        [opay, kuda, palmpay, moniepoint].forEach(b => {
            if (b) {
                console.log(`Name: ${b.name}`);
                console.log(`Code: ${b.code}`);
                console.log(`Slug: ${b.slug}`);
                console.log(`Active: ${b.active}`);
                console.log('---');
            }
        });

        // Filter for banks that support identity (if that field exists)
        // Some response objects have a "verification" or "identity" flag
        const sample = banks[0];
        console.log('Available Fields:', Object.keys(sample));

    } catch (err) {
        console.error('Error fetching banks:', err.response?.data || err.message);
    }
}

checkBanks();
