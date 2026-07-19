require('dotenv').config();
const axios = require('axios');

/**
 * Sends a transactional email using direct Resend API call 
 * (Bypassing the SDK for maximum stability)
 */
const sendEmail = async ({ to, subject, html }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("⚠️ Resend API Key missing. Skipping email to:", to);
        return;
    }

    try {
        const fromEmail = process.env.SENDER_EMAIL || 'hello@usekredibly.com';
        
        const response = await axios.post('https://api.resend.com/emails', {
            from: `Oluwatosin from Kredibly <${fromEmail}>`,
            to: Array.isArray(to) ? to : [to],
            reply_to: fromEmail,
            subject: subject,
            html: html,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.id) {
            console.log("✅ Email successfully queued with Resend:", response.data.id);
            return response.data;
        }
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        console.error("🔥 Direct Email Service Error:", errorMsg);
        // We log but don't crash the background worker
    }
};

module.exports = { sendEmail };
