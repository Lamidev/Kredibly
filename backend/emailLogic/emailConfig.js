require("dotenv").config();
const { Resend } = require("resend");

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
}

const resendClient = new Resend(RESEND_API_KEY);

const sender = {
    email: "onboarding@resend.dev", // Default for testing
    name: "Kredibly"
};

module.exports = {
    resendClient,
    sender
};
