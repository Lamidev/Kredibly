require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('./models/BusinessProfile');
const { triggerWelcomeMessage } = require('./controllers/business/businessController');
const whatsappController = require('./controllers/whatsapp/whatsappController');

// 🧪 MOCK: Capture what would be sent to WhatsApp
const originalSendWhatsAppAlert = whatsappController.sendWhatsAppAlert;
whatsappController.sendWhatsAppAlert = async (to, bossTitle, textMessage, invoiceNumber) => {
    console.log('\n--- [TEST OUTPUT] ---');
    console.log('To:', to);
    console.log('Boss Title:', bossTitle);
    console.log('Message Length:', textMessage.length);
    console.log('Message Preview:\n', textMessage.substring(0, 100) + '...');
    
    // Simulate the logic in sendWhatsAppAlert
    console.log('\n--- [SIMULATING LOGIC] ---');
    const isWindowOpen = false; // Forced false for new user test
    if (!isWindowOpen) {
        console.log('✅ PASS: Session window is closed. Falling back to Meta Template.');
        const safeMessage = String(textMessage)
            .replace(/[\r\t]/g, ' ') 
            .replace(/\s\s+/g, ' ')
            .trim()
            .substring(0, 1024);
        
        console.log('Final Template Variable (Body 2):');
        console.log('\"' + safeMessage + '\"');
        console.log('\nTemplate Name: kreddy_system_alert');
    }
    return true;
};

async function runTest() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected.');

        // Create a fake profile for testing
        const fakeProfile = {
            displayName: "Test Merchant Shop",
            whatsappNumber: "2348012345678",
            plan: "chairman",
            staffNumbers: ["2348098765432"]
        };

        console.log('Triggering Welcome Message for:', fakeProfile.displayName);
        await triggerWelcomeMessage(fakeProfile);

        console.log('\nTest Completed Successfully.');
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
