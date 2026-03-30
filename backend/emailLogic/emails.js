const {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  NEW_TICKET_ALERT_TEMPLATE,
  WAITLIST_NOTIFICATION_TEMPLATE,
  WAITLIST_CONFIRMATION_TEMPLATE,
  SUPPORT_REPLY_TEMPLATE,
  SUBSCRIPTION_CONFIRM_TEMPLATE,
  BANK_CHANGE_ALERT_TEMPLATE
} = require("./emailTemplates.js");
const { resendClient, sender } = require("./emailConfig.js");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

// ... (existing functions)

exports.sendWaitlistEmail = async (adminEmail, userData) => {
  try {
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: adminEmail,
      reply_to: userData.email,
      subject: `Waitlist Signup: ${userData.name}`,
      html: WAITLIST_NOTIFICATION_TEMPLATE
        .replace("{name}", userData.name)
        .replace("{email}", userData.email)
        .replace("{whatsappNumber}", userData.whatsappNumber)
        .replace("{industry}", userData.industry || "Not specified"),
    });
  } catch (error) {
    console.error("Error sending waitlist notification email:", error);
  }
};

exports.sendWaitlistConfirmationEmail = async (userEmail, userData) => {
  try {
    const referralLink = `${FRONTEND_URL}/waitlist?ref=${userData.referralCode}`;
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: userEmail,
      subject: "You're in! Welcome to Kredibly",
      html: WAITLIST_CONFIRMATION_TEMPLATE
        .replace("{name}", userData.name.split(' ')[0])
        .replace(/{referralLink}/g, referralLink),
    });
  } catch (error) {
    console.error("Error sending waitlist confirmation email:", error);
  }
};

// Common function for handling email sending errors
const handleEmailError = (error, message) => {
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

exports.sendNewTicketEmail = async (adminEmail, userName, message, ticketId) => {
  try {
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: adminEmail,
      subject: `New Support Ticket from ${userName}`,
      html: NEW_TICKET_ALERT_TEMPLATE
        .replace("{userName}", userName)
        .replace("{message}", message)
        .replace("{ticketId}", ticketId),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn("Dev mode: Email simulation for support ticket.");
    // Do not throw, just log, so we don't block the ticket creation
    // handleEmailError(error, "Error sending new ticket alert");
  }
};

exports.sendSupportReplyEmail = async (userEmail, userName, message, ticketSubject) => {
  try {
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: userEmail,
      subject: `Update on your support ticket: ${ticketSubject}`,
      html: SUPPORT_REPLY_TEMPLATE
        .replace("{name}", userName)
        .replace("{ticketSubject}", ticketSubject)
        .replace("{message}", message)
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn("Dev mode: Email simulation for support reply.");
    // handleEmailError(error, "Error sending support reply email");
  }
};

exports.sendSecurityAlertEmail = async (email, userName, details) => {
  try {
    const [accountName, bankName] = details.split(' (');
    const displayBank = bankName.replace(')', '');
    const accountNum = "Validating..."; // Details should ideally be split or passed better

    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "🚨 Security Alert: Payout Details Changed",
      html: BANK_CHANGE_ALERT_TEMPLATE
        .replace("{name}", userName)
        .replace("{bankName}", displayBank)
        .replace("{accountNumber}", "Updated")
        .replace("{accountName}", accountName)
    });
  } catch (error) {
    console.error("Error sending security alert email:", error);
  }
};

exports.sendSubscriptionConfirmEmail = async (email, userData) => {
    try {
        await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: userData.subject || "Welcome to the Kredibly Vanguard 🛡️",
            html: SUBSCRIPTION_CONFIRM_TEMPLATE
                .replace(/{name}/g, userData.name)
                .replace(/{planName}/g, userData.planName)
                .replace(/{amount}/g, userData.amount)
                .replace(/{expiryDate}/g, userData.expiryDate)
                .replace(/{launchDate}/g, userData.launchDate)
                .replace(/{pioneerStatus}/g, userData.pioneerStatus)
        });
    } catch (error) {
        console.error("Error sending subscription confirmation email:", error);
    }
};



