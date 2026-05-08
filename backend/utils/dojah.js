const axios = require('axios');

const DOJAH_BASE_URL = 'https://api.dojah.io/api/v1';
const DOJAH_PRIVATE_KEY = process.env.DOJAH_PRIVATE_KEY;
const DOJAH_APP_ID = process.env.DOJAH_APP_ID;

/**
 * 🕵️‍♂️ DOJAH IDENTITY LOOKUP
 * Fetches full BVN data including legal names.
 */
const lookupBVN = async (bvn) => {
    if (!DOJAH_PRIVATE_KEY || !DOJAH_APP_ID) {
        throw new Error("Dojah credentials missing in .env");
    }

    try {
        console.log(`🕵️‍♂️ Dojah: Looking up BVN details...`);
        const response = await axios.get(`${DOJAH_BASE_URL}/kyc/bvn/full`, {
            params: { bvn },
            headers: {
                'Authorization': DOJAH_PRIVATE_KEY,
                'AppId': DOJAH_APP_ID
            },
            timeout: 15000
        });

        // Dojah returns { entity: { first_name: "...", last_name: "...", dob: "..." } }
        const data = response.data?.entity || response.data?.data;
        if (!data) throw new Error("No identity data returned from Dojah");
        
        return data;
    } catch (err) {
        console.error("❌ Dojah BVN Lookup Fail:", err.response?.data || err.message);
        throw new Error(err.response?.data?.error || err.message || "Dojah verification failed");
    }
};

module.exports = { lookupBVN };
