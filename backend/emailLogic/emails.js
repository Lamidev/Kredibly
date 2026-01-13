const {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE
} = require("./emailTemplates.js");
const { resendClient, sender } = require("./emailConfig.js");

// Common function for handling email sending errors
const handleEmailError = (error, message) => {
  console.error(`${message}:`, error.response ? error.response.data : error.message);
  throw new Error(`${message}: ${error.message}`);
};

// Send Verification Email
exports.sendVerificationEmail = async (email, verificationToken) => {
  try {
    const response = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
    });
  } catch (error) {
    handleEmailError(error, "Error sending verification email");
  }
};

exports.sendWelcomeEmail = async (email, userName) => {
  try {
    const response = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Kredibly",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", userName),
    });

  } catch (error) {
    handleEmailError(error, "Error sending welcome email");
  }
};

// Send Password Reset Email
exports.sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const response = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });

  } catch (error) {
    handleEmailError(error, "Error sending password reset email");
  }
};

// Send Password Reset Success Email
exports.sendResetSuccessEmail = async (email) => {
  try {
    const response = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });

  } catch (error) {
    handleEmailError(error, "Error sending password reset success email");
  }
};


