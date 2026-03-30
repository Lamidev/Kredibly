require("dotenv").config();
const { Resend } = require("resend");

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing in .env");
}

const resendClient = new Resend(RESEND_API_KEY);

const sender = {
    email: process.env.SENDER_EMAIL || "onboarding@resend.dev",
    name: "Oluwatosin from Kredibly" // Human sender name = better inbox placement
};

module.exports = {
    resendClient,
    sender
};
