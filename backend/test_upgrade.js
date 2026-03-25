const axios = require('axios');

async function testUpgradeFlow() {
    const TEST_URL = "http://localhost:7050/api/whatsapp/webhook"; // Change if your port is different
    
    // Simulate a new user asking for trial
    const payload = {
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: "2348011223344",
                        text: { body: "Activate my chairman trial via transfer" },
                        type: "text"
                    }],
                    contacts: [{
                        profile: { name: "Ozedikus Nwanne" },
                        wa_id: "2348011223344"
                    }]
                }
            }]
        }]
    };

    try {
        console.log("🚀 Testing Kreddy Upgrade Intent...");
        const response = await axios.post(TEST_URL, payload);
        console.log("✅ Response Status:", response.status);
    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
}

testUpgradeFlow();
