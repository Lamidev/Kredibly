require("dotenv").config();
const axios = require("axios");
const {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  ONBOARDING_SUCCESS_TEMPLATE,
  NEW_TICKET_ALERT_TEMPLATE,
  SUPPORT_REPLY_TEMPLATE,
  SUBSCRIPTION_CONFIRM_TEMPLATE,
  BANK_CHANGE_ALERT_TEMPLATE,
  GROWTH_MASTERCLASS_TEMPLATE,
  ACTIVATION_NUDGE_TEMPLATE,
  FINISH_SETUP_TEMPLATE,
  INACTIVITY_DAY2_TEMPLATE,
  INACTIVITY_DAY7_TEMPLATE,
  WEEKLY_MONDAY_DIGEST_TEMPLATE,
  ADMIN_NEW_BUSINESS_TEMPLATE
} = require("./emailTemplates.js");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

/**
 * 🛡️ Core Robust Email Sender
 * Uses direct REST API call with multipart (HTML + Text fallback) for 100% Primary Inbox placement.
 */
const sendDirectEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY missing in .env. Skipping email dispatch to:", to);
    return { success: false, error: "Missing API Key" };
  }

  const fromEmail = process.env.SENDER_EMAIL || "hello@usekredibly.com";
  const fromName = "Oluwatosin from Kredibly";

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        reply_to: fromEmail,
        subject: subject,
        text: text || "Please view this email in an HTML-capable email client.",
        html: html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ [EMAIL-SENT] Delivered to ${Array.isArray(to) ? to.join(", ") : to} | ID: ${response.data?.id}`);
    return { success: true, id: response.data?.id };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    console.error(`❌ [EMAIL-ERROR] Failed sending to ${to}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};

// 1. VERIFICATION EMAIL
exports.sendVerificationEmail = async (email, verificationToken) => {
  return await sendDirectEmail({
    to: email,
    subject: "Your Kredibly verification code",
    text: `Hello,\n\nThank you for joining Kredibly. Your 6-digit verification code is: ${verificationToken}\n\nEnter this code to complete your setup. (Expires in 24 hours)\n\n— The Kredibly Team`,
    html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
  });
};

// 2. WELCOME EMAIL
exports.sendWelcomeEmail = async (email, userName) => {
  const actionUrl = `${FRONTEND_URL}/activate`;
  return await sendDirectEmail({
    to: email,
    subject: "Welcome to Kredibly — your financial engine is ready",
    text: `Hi ${userName || "there"},\n\nWelcome to Kredibly. Your email has been verified, and your account is officially active.\n\nWe built Kredibly to remove the daily friction from running your business. No paperwork, no spreadsheets, and no awkward back-and-forth chasing customers who promise "I will transfer tonight."\n\nWhat Kredibly handles for you:\n1. WhatsApp-Native Invoicing: Generate professional invoices with dedicated bank accounts via text or voice note.\n2. Automated Payment Reconciliation: Real-time ledger updates the moment a customer pays.\n3. Automated Debt Tracking: Polite, automated reminders to protect your cashflow.\n4. Your Second Brain & Productivity Partner: Drop notes, supplier commitments, and to-dos directly into WhatsApp to get reminded right on schedule.\n\nNext Step: Finish your 60-second business setup:\n${actionUrl}\n\nIf you ever have questions or want guidance on setting up your workflow, reply directly to this email.\n\nWarm regards,\nOluwatosin\nFounder, Kredibly`,
    html: WELCOME_EMAIL_TEMPLATE
      .replace(/{name}/g, userName || "there")
      .replace(/{actionUrl}/g, actionUrl),
  });
};

// 3. ONBOARDING SUCCESS (Merchant)
exports.sendOnboardingSuccessEmail = async (email, userName, businessName, planTitle = "Chairman") => {
  return await sendDirectEmail({
    to: email,
    subject: "Your business is now live on Kredibly",
    text: `Hi ${userName || "there"},\n\nCongratulations! ${businessName || "Your business"} is officially set up on Kredibly. Your bank details have been verified, and you can now issue invoices and receive payments directly.\n\nEnter your dashboard: ${FRONTEND_URL}/dashboard\n\n— The Kredibly Team`,
    html: ONBOARDING_SUCCESS_TEMPLATE
      .replace(/{name}/g, userName || "there")
      .replace(/{businessName}/g, businessName || "Your Business")
      .replace(/{planTitle}/g, planTitle),
  });
};

// 4. NEW BUSINESS ALERT (Admin)
exports.sendAdminNewBusinessAlert = async (data) => {
  const adminEmail = process.env.ADMIN_EMAIL || "hello@usekredibly.com";
  const { name, email, businessName, phone, plan, sellMode, entityType } = data || {};
  return await sendDirectEmail({
    to: adminEmail,
    subject: `New Merchant Onboarded: ${businessName || name || "Business"}`,
    text: `A new merchant just completed onboarding.\n\nBusiness: ${businessName || "N/A"}\nOwner: ${name || "N/A"} (${email || "N/A"})\nWhatsApp: ${phone || "N/A"}\nPlan: ${plan || "chairman"}\nSell Mode: ${sellMode || "N/A"}\nEntity: ${entityType || "N/A"}\n\nAdmin Panel: ${FRONTEND_URL}/admin`,
    html: ADMIN_NEW_BUSINESS_TEMPLATE
      .replace(/{name}/g, name || "Merchant")
      .replace(/{email}/g, email || "N/A")
      .replace(/{businessName}/g, businessName || "New Business")
      .replace(/{phone}/g, phone || "N/A")
      .replace(/{plan}/g, plan || "chairman")
      .replace(/{sellMode}/g, sellMode || "N/A")
      .replace(/{entityType}/g, entityType || "N/A")
      .replace(/{adminUrl}/g, `${FRONTEND_URL}/admin`),
  });
};

// 5. PASSWORD RESET REQUEST
exports.sendPasswordResetEmail = async (email, resetURL) => {
  return await sendDirectEmail({
    to: email,
    subject: "Reset your Kredibly password",
    text: `Hello,\n\nWe received a request to reset your password. Please use this link to proceed:\n\n${resetURL}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.\n\n— The Kredibly Team`,
    html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
  });
};

// 5. PASSWORD RESET SUCCESS
exports.sendResetSuccessEmail = async (email) => {
  return await sendDirectEmail({
    to: email,
    subject: "Password Reset Successful",
    text: `Hello,\n\nYour password was successfully reset. You can now log back into your dashboard with your new credentials.\n\nIf this change was not made by you, please reply immediately.\n\n— The Kredibly Team`,
    html: PASSWORD_RESET_SUCCESS_TEMPLATE,
  });
};

// 6. NEW SUPPORT TICKET (Admin Alert)
exports.sendNewTicketEmail = async (adminEmail, userName, message, ticketId) => {
  return await sendDirectEmail({
    to: adminEmail,
    subject: `New Support Ticket from ${userName}`,
    text: `New Support Ticket\n\nUser: ${userName}\nTicket ID: ${ticketId}\nMessage: ${message}\n\nAdmin Panel: ${FRONTEND_URL}/admin`,
    html: NEW_TICKET_ALERT_TEMPLATE
      .replace("{userName}", userName)
      .replace("{message}", message)
      .replace("{ticketId}", ticketId),
  });
};

// 7. SUPPORT REPLY
exports.sendSupportReplyEmail = async (userEmail, userName, message, ticketSubject) => {
  return await sendDirectEmail({
    to: userEmail,
    subject: `Update on your support ticket: ${ticketSubject}`,
    text: `Hello ${userName},\n\nThe Kredibly team replied to your support ticket regarding "${ticketSubject}":\n\n"${message}"\n\nVisit dashboard: ${FRONTEND_URL}/dashboard`,
    html: SUPPORT_REPLY_TEMPLATE
      .replace("{name}", userName)
      .replace("{ticketSubject}", ticketSubject)
      .replace("{message}", message),
  });
};

// 8. SECURITY ALERT (Bank Details Modified)
exports.sendSecurityAlertEmail = async (email, userName, details) => {
  const [accountName, bankName] = (details || "").split(" (");
  const displayBank = (bankName || "").replace(")", "");
  const accountNum = "Validating...";

  return await sendDirectEmail({
    to: email,
    subject: "Security Alert: Payout Details Changed",
    text: `Hello ${userName},\n\nThis is an automated notification that the bank account details for your Kredibly business were recently updated:\n\nBank: ${displayBank}\nHolder: ${accountName}\n\nIf you did NOT make this change, reply to this email immediately.\n\n— The Kredibly Team`,
    html: BANK_CHANGE_ALERT_TEMPLATE
      .replace("{name}", userName)
      .replace("{bankName}", displayBank || "Updated Bank")
      .replace("{accountNumber}", accountNum)
      .replace("{accountName}", accountName || "Updated Account"),
  });
};

// 9. SUBSCRIPTION CONFIRMATION
exports.sendSubscriptionConfirmEmail = async (email, userName, planName, amount, expiryDate, isPioneer = false) => {
  const pioneerText = isPioneer ? "Early Access Pioneer Benefits Applied." : "Standard Subscription Verified.";
  return await sendDirectEmail({
    to: email,
    subject: `Subscription Confirmed: ${planName} Plan`,
    text: `Hi ${userName},\n\nPayment verified for your ${planName} Plan (Amount: ${amount}). Next renewal: ${expiryDate}.\n\n${pioneerText}\n\n— The Kredibly Team`,
    html: SUBSCRIPTION_CONFIRM_TEMPLATE
      .replace(/{name}/g, userName)
      .replace(/{planName}/g, planName)
      .replace(/{amount}/g, amount)
      .replace(/{expiryDate}/g, expiryDate)
      .replace(/{pioneerStatus}/g, pioneerText),
  });
};

// 10. ACTIVATION NUDGE
exports.sendActivationNudgeEmail = async (email, userName) => {
  return await sendDirectEmail({
    to: email,
    subject: "Finish activating Kreddy for your business",
    text: `Hi ${userName || "there"},\n\nI noticed you registered your business on Kredibly, but Kreddy is still waiting to start working on WhatsApp.\n\nFinish setup here: ${FRONTEND_URL}/dashboard\n\n— Oluwatosin, Founder, Kredibly`,
    html: ACTIVATION_NUDGE_TEMPLATE.replace(/{name}/g, userName || "there"),
  });
};

// 11. FINISH SETUP
exports.sendFinishSetupEmail = async (email, userName) => {
  return await sendDirectEmail({
    to: email,
    subject: "Complete your setup on Kredibly",
    text: `Hi ${userName || "there"},\n\nTo start recording sales, sending professional invoices, and tracking your receivables automatically, complete your setup here: ${FRONTEND_URL}/onboarding\n\n— Oluwatosin, Founder, Kredibly`,
    html: FINISH_SETUP_TEMPLATE.replace(/{name}/g, userName || "there"),
  });
};

// 12. 2-STEP INACTIVITY DRIP: DAY 2
exports.sendInactivityDay2Email = async (email, userName) => {
  return await sendDirectEmail({
    to: email,
    subject: "Create your first invoice in 15 seconds",
    text: `Hi ${userName || "there"},\n\nI noticed you haven't created your first invoice with Kreddy yet.\n\nYou can talk to Kreddy on WhatsApp the exact same way you talk to a business partner:\n"Kreddy, Rebecca bought shoes for ₦25,000, due next Friday"\n\nMessage Kreddy on WhatsApp: https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20I'd%20like%20to%20create%20my%20first%20invoice\n\n— Oluwatosin, Founder, Kredibly`,
    html: INACTIVITY_DAY2_TEMPLATE.replace(/{name}/g, userName || "there"),
  });
};

// 13. 2-STEP INACTIVITY DRIP: DAY 7
exports.sendInactivityDay7Email = async (email, userName) => {
  return await sendDirectEmail({
    to: email,
    subject: "Are customers owing you money? Let Kreddy handle it",
    text: `Hi ${userName || "there"},\n\nOne of the biggest profit killers for business owners is chasing customers for payment.\n\nWhenever a customer buys on credit, Kreddy schedules polite reminders and issues virtual accounts for direct bank settlement.\n\nOpen Kreddy on WhatsApp: https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20show%20me%20how%20debt%20tracking%20works\n\n— Oluwatosin, Founder, Kredibly`,
    html: INACTIVITY_DAY7_TEMPLATE.replace(/{name}/g, userName || "there"),
  });
};

// 14. WEEKLY MONDAY MORNING KICKOFF
exports.sendWeeklyMondayDigestEmail = async (email, data) => {
  const { userName, businessName, cashCollected, invoicesCount, pendingDebt, weeklyAdvice } = data;
  return await sendDirectEmail({
    to: email,
    subject: `Monday Kickoff: ${businessName || "Your Business"}`,
    text: `Good morning ${userName || "Partner"},\n\nLast Week's Performance for ${businessName || "Your Business"}:\n• Cash Collected: ₦${(cashCollected || 0).toLocaleString()}\n• Invoices Issued: ${invoicesCount || 0}\n• Total Outstanding Debts: ₦${(pendingDebt || 0).toLocaleString()}\n\nThis Week's Growth Play:\n${weeklyAdvice || "Focus on cashflow and debt collection this week."}\n\nOpen Kreddy on WhatsApp: https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20let's%20start%20the%20week!\n\n— Oluwatosin, Founder, Kredibly`,
    html: WEEKLY_MONDAY_DIGEST_TEMPLATE
      .replace(/{name}/g, userName || "Partner")
      .replace(/{businessName}/g, businessName || "Your Business")
      .replace(/{cashCollected}/g, (cashCollected || 0).toLocaleString())
      .replace(/{invoicesCount}/g, invoicesCount || 0)
      .replace(/{pendingDebt}/g, (pendingDebt || 0).toLocaleString())
      .replace(/{weeklyAdvice}/g, weeklyAdvice || "Focus on cashflow and debt collection this week. Let's make it a winning week!"),
  });
};
