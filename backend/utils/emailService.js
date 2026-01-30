const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

/**
 * Sends a transactional email
 */
const sendEmail = async ({ to, subject, html }) => {
    if (!resend) {
        console.warn("⚠️ Resend API Key missing. Skipping email to:", to);
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kredibly <no-reply@usekredibly.com>',
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("📧 Email Error:", error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error("📧 Email Service Exception:", err);
    }
};

module.exports = { sendEmail };
