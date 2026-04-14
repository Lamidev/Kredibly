const axios = require('axios');
require('dotenv').config();

const diagnoseTemplates = async () => {
    const { WHATSAPP_BUSINESS_ID, WHATSAPP_TOKEN } = process.env;

    if (!WHATSAPP_BUSINESS_ID || !WHATSAPP_TOKEN) {
        console.error("❌ Missing WHATSAPP_BUSINESS_ID or WHATSAPP_TOKEN in .env");
        return;
    }

    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_BUSINESS_ID}/message_templates`;

    try {
        console.log(`🔍 Fetching templates for WABA ID: ${WHATSAPP_BUSINESS_ID}...`);
        const response = await axios.get(url, {
            params: {
                access_token: WHATSAPP_TOKEN,
                limit: 100
            }
        });

        const templates = response.data.data;

        if (!templates || templates.length === 0) {
            console.log("🛑 No templates found for this account.");
        } else {
            console.log(`✅ Found ${templates.length} templates:`);
            templates.forEach((t, i) => {
                console.log(`${i + 1}. [${t.status}] Name: ${t.name} | Category: ${t.category} | Language: ${t.language}`);
            });
        }
    } catch (error) {
        console.error("❌ Error fetching templates:");
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

diagnoseTemplates();
