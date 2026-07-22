const {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  ONBOARDING_SUCCESS_TEMPLATE,
  NEW_TICKET_ALERT_TEMPLATE,
  SUPPORT_REPLY_TEMPLATE,
  SUBSCRIPTION_CONFIRM_TEMPLATE,
  BANK_CHANGE_ALERT_TEMPLATE
} = require("./emailTemplates.js");
const { resendClient, sender } = require("./emailConfig.js");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

// ... (existing functions)


// Common function for handling email sending errors
const handleEmailError = (error, message) => {
  throw new Error(`${message}: ${error.message}`);
};

// Send Verification Email
exports.sendVerificationEmail = async (email, verificationToken) => {
  try {
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Your Kredibly verification code",
      text: `Hi,\n\nYour Kredibly verification code is: ${verificationToken}\n\nThis code expires in 15 minutes. If you didn't sign up, please ignore this email.\n\n— Oluwatosin, Founder of Kredibly`,
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
    });
  } catch (error) {
    handleEmailError(error, "Error sending verification email");
  }
};

exports.sendWelcomeEmail = async (email, userName) => {
  try {
    await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Kredibly",
      text: `Hi ${userName},\n\nI just wanted to personally say — welcome.\n\nI'm Oluwatosin, the founder of Kredibly. I built this so growing your business doesn't mean drowning in notebooks and chasing debtors.\n\nIf you ever have questions or just want to say hi, reply to this email directly. I read every single one.\n\nWelcome to the new standard.\n\n— Oluwatosin\nFounder, Kredibly`,
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", userName),
    });
  } catch (error) {
    handleEmailError(error, "Error sending welcome email");
  }
};

exports.sendOnboardingSuccessEmail = async (email, userName, businessName, planTitle = "Chairman") => {
    try {
        await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Your business is now live on Kredibly",
            text: `Hi ${userName},\n\nCongratulations! ${businessName} is officially live on Kredibly.\n\nYour bank details are verified. You can now send invoices and receive payments directly.\n\nLog in here: https://usekredibly.com/dashboard\n\n— Oluwatosin\nFounder, Kredibly`,
            html: ONBOARDING_SUCCESS_TEMPLATE
                .replace(/{name}/g, userName)
                .replace(/{businessName}/g, businessName)
                .replace(/{planTitle}/g, planTitle)
        });
    } catch (error) {
        console.error("Error sending onboarding success email:", error);
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

// 🛡️ SUPER ADMIN ALERTS
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || sender.email;

exports.sendAdminPaymentAlert = async (data) => {
    try {
        const { merchantName, planName, amount, reference, email } = data;
        await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: ADMIN_EMAIL,
            subject: `💰 NEW PAYMENT: ₦${amount} from ${merchantName}`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #4C1D95;">Cash Received! 🎉</h2>
                    <p><strong>Merchant:</strong> ${merchantName} (${email})</p>
                    <p><strong>Plan:</strong> ${planName}</p>
                    <p><strong>Amount:</strong> ₦${amount}</p>
                    <p><strong>Reference:</strong> ${reference}</p>
                    <hr />
                    <p style="font-size: 12px; color: #777;">Kredibly Revenue Tracker</p>
                   </div>`
        });
    } catch (error) {
        console.error("Admin Payment Alert Error:", error.message);
    }
};

exports.sendAdminNewUserAlert = async (data) => {
    try {
        const { name, email } = data;
        await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: ADMIN_EMAIL,
            subject: `New User Sign-up: ${name} (Onboarding Pending)`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #0F172A; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0;">
                    <div style="margin-bottom: 20px; border-bottom: 2px solid #F1F5F9; padding-bottom: 16px;">
                        <div style="display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                            Stage 1 • Account Created
                        </div>
                        <h2 style="color: #4C1D95; margin: 4px 0 6px 0; font-size: 20px; font-weight: 800;">New User Registration</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748B;">A new user has registered an account. Business onboarding is pending.</p>
                    </div>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1E293B; font-weight: 700;">User Details</h3>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Full Name:</strong> ${name}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Email Address:</strong> ${email}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Status:</strong> <span style="color: #D97706; font-weight: 600;">Onboarding Pending</span></p>
                    </div>

                    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94A3B8;">
                        <p style="margin: 0;">Kredibly Growth Monitor • Real-time Signup Alert</p>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error("Admin New User Alert Error:", error.message);
    }
};

exports.sendAdminNewBusinessAlert = async (data) => {
    try {
        const { 
            name, email, businessName, phone, 
            bankDetails, staffNumbers, plan, sellMode, entityType, kyc 
        } = data;

        const hasBank = bankDetails && bankDetails.accountNumber;
        const bankHtml = hasBank ? `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1E293B;">Bank Payout Account Attached</p>
                <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Bank:</strong> ${bankDetails.bankName || 'N/A'}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Account Number:</strong> ${bankDetails.accountNumber || 'N/A'}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Account Name:</strong> ${bankDetails.accountName || 'N/A'}</p>
            </div>
        ` : `
            <div style="background: #FFF7ED; border: 1px solid #FFEDD5; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; color: #C2410C;">
                No Bank Payout Account attached yet.
            </div>
        `;

        const hasStaff = staffNumbers && staffNumbers.length > 0;
        const staffHtml = hasStaff ? `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1E293B;">Staff Members Added (${staffNumbers.length})</p>
                <ul style="margin: 4px 0; padding-left: 20px; font-size: 14px; color: #475569;">
                    ${staffNumbers.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        ` : `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; color: #64748B;">
                Staff: Solo merchant (No staff added yet).
            </div>
        `;

        await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: ADMIN_EMAIL,
            subject: `Merchant Activated: ${businessName || name}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #0F172A; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0;">
                    <div style="margin-bottom: 20px; border-bottom: 2px solid #F1F5F9; padding-bottom: 16px;">
                        <div style="display: inline-block; background: #DCFCE7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                            Stage 2 • Business Live
                        </div>
                        <h2 style="color: #4C1D95; margin: 4px 0 6px 0; font-size: 20px; font-weight: 800;">New Merchant Live on Kredibly</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748B;">A merchant has completed business onboarding and is now active.</p>
                    </div>

                    <!-- Merchant Overview -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 12px; margin-bottom: 16px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1E293B; font-weight: 700;">Merchant Profile</h3>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Business Name:</strong> <span style="color: #4C1D95; font-weight: 700;">${businessName || 'Not Provided'}</span></p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Owner Name:</strong> ${name}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>WhatsApp Number:</strong> ${phone || 'N/A'}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Plan:</strong> ${String(plan || 'chairman').toUpperCase()}</p>
                        <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Selling Mode:</strong> ${sellMode || 'both'}</p>
                    </div>

                    <!-- Bank Details Section -->
                    ${bankHtml}

                    <!-- Staff Members Section -->
                    ${staffHtml}

                    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94A3B8;">
                        <p style="margin: 0;">Kredibly Growth Monitor • Real-time Merchant Activation Alert</p>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error("Admin New Business Alert Error:", error.message);
    }
};






