const THEME_COLOR = "#4C1D95"; // Kredibly Purple

const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 16px; color: #1A202C; margin-top: 0;">Hello,</p>
  <p style="font-size: 15px;">Thank you for joining Kredibly. Please use your 6-digit verification code to complete your setup:</p>
  <div style="margin: 28px 0; text-align: center; background: #F7FAFC; border: 1.5px dashed #CBD5E0; padding: 20px; border-radius: 12px;">
    <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4C1D95; display: inline-block;">{verificationCode}</span>
  </div>
  <p style="font-size: 13px; color: #718096; margin-top: 16px;">This code will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; margin: 0; font-size: 15px; color: #1A202C;">The Kredibly Team</p>
  </div>
  <div style="margin-top: 32px; border-top: 1px solid #F7FAFC; padding-top: 16px; font-size: 11px; color: #A0AEC0;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 16px; color: #1A202C; margin-top: 0;">Hello,</p>
  <p style="font-size: 15px;">Your password was successfully reset. You can now log back into your dashboard using your new credentials.</p>
  <p style="font-size: 15px;">If this change was not made by you, please reply to this email immediately so our security team can assist you.</p>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; margin: 0; font-size: 15px; color: #1A202C;">The Kredibly Team</p>
  </div>
  <div style="margin-top: 32px; border-top: 1px solid #F7FAFC; padding-top: 16px; font-size: 11px; color: #A0AEC0;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 16px; color: #1A202C; margin-top: 0;">Hello,</p>
  <p style="font-size: 15px;">We received a request to reset your password. Please use the security link below to proceed:</p>
  <div style="margin: 28px 0;">
    <a href="{resetURL}" style="background-color: #1A202C; color: #FFFFFF; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Reset My Password</a>
  </div>
  <p style="font-size: 13px; color: #718096;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; margin: 0; font-size: 15px; color: #1A202C;">The Kredibly Team</p>
  </div>
  <div style="margin-top: 32px; border-top: 1px solid #F7FAFC; padding-top: 16px; font-size: 11px; color: #A0AEC0;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 16px; color: #1A202C; margin-top: 0;">Hi {name},</p>
  <p style="font-size: 15px;">Welcome to Kredibly! We built this platform because managing your sales and getting paid shouldn't mean drowning in notebooks or chasing clients who promise "next week."</p>
  <p style="font-size: 15px;">Whether you're recording a quick sale via text, voice note, or photo on WhatsApp, Kredibly is designed to give you peace of mind and professional clarity.</p>
  <p style="font-size: 15px;">If you ever have feedback or just want to say hi, simply reply to this email. We read every message personally.</p>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
  <div style="margin-top: 32px; border-top: 1px solid #F7FAFC; padding-top: 16px; font-size: 11px; color: #A0AEC0;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const NEW_TICKET_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <h2 style="font-size: 16px; font-weight: 800; color: #1A202C; margin-top: 0;">New Support Ticket</h2>
  <p style="font-size: 14px;">A user has submitted a support ticket. Details below:</p>
  <div style="background: #F7FAFC; padding: 18px; border-radius: 8px; margin: 16px 0; border: 1px solid #E2E8F0;">
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>User:</strong> {userName}</p>
    <p style="margin: 0; font-size: 14px;"><strong>Message:</strong> {message}</p>
  </div>
  <p style="font-size: 12px; color: #718096;">Ticket ID: {ticketId}</p>
  <div style="margin-top: 24px;">
    <a href="https://usekredibly.com/admin" style="font-weight: 700; color: #4C1D95; text-decoration: none; font-size: 14px;">Launch Admin Panel →</a>
  </div>
</body>
</html>
`;

const SUPPORT_REPLY_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 16px; color: #1A202C; margin-top: 0;">Hello {name},</p>
  <p style="font-size: 15px;">The Kredibly team has replied to your support ticket regarding <strong>"{ticketSubject}"</strong>:</p>
  <div style="background: #F7FAFC; border-radius: 8px; padding: 16px 18px; margin: 20px 0; border-left: 3px solid #1A202C;">
      <p style="margin: 0; font-size: 14px; color: #1A202C;">"{message}"</p>
  </div>
  <p style="font-size: 14px;">Please log in to your dashboard to continue the conversation or mark this ticket as resolved.</p>
  <div style="margin: 24px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #1A202C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Go to Dashboard</a>
  </div>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">The Kredibly Team</p>
  </div>
</body>
</html>
`;

const SUBSCRIPTION_CONFIRM_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #1A202C; margin-top: 0;">Payment Verified. Welcome home, Pioneer</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">Your support means a lot to us. By securing your <strong>{planName} Plan</strong>, you've joined a mission to build a more professional and reliable future for your business.</p>
  <div style="background: #F7FAFC; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #E2E8F0;">
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Plan:</strong> {planName}</p>
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Amount:</strong> {amount}</p>
      <p style="margin: 0 0 6px; font-size: 14px;"><strong>Status:</strong> <span style="color: #16A34A; font-weight: 800;">ACTIVE</span></p>
      <p style="margin: 0; font-size: 14px;"><strong>Next Renewal:</strong> {expiryDate}</p>
  </div>
  <p style="font-size: 14px;">{pioneerStatus}</p>
  <p style="font-size: 14px;">If you need anything at all, simply reply to this email.</p>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">The Kredibly Team</p>
  </div>
</body>
</html>
`;

const BANK_CHANGE_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <h2 style="font-size: 16px; font-weight: 800; color: #DC2626; margin-top: 0;">Security Alert: Payout Details Changed</h2>
  <p style="font-size: 15px;">Hello {name},</p>
  <p style="font-size: 15px;">This is an automated notification to let you know that the <strong>bank account details</strong> for your Kredibly business were recently updated:</p>
  <div style="background: #F7FAFC; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #E2E8F0;">
      <p style="margin: 4px 0; font-size: 14px;"><strong>Bank:</strong> {bankName}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Account:</strong> {accountNumber}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Holder:</strong> {accountName}</p>
  </div>
  <p style="font-size: 14px; color: #DC2626; font-weight: 700;">If you did not make this change:</p>
  <p style="font-size: 14px;">Please reply to this email immediately. As a precaution, we place temporary security locks on settlements when details are modified.</p>
  <div style="margin: 24px 0;">
    <a href="https://usekredibly.com/dashboard/support" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">This Wasn't Me</a>
  </div>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; margin: 0; font-size: 15px; color: #1A202C;">The Kredibly Team</p>
  </div>
</body>
</html>
`;

const ONBOARDING_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #1A202C; margin-top: 0;">Setup Complete. You are officially live on Kredibly</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">Congratulations! Your business, <strong>{businessName}</strong>, is now fully set up on Kredibly. Our system has verified your bank details, and you are ready to issue invoices and collect payments directly.</p>
  <p style="font-size: 15px;">From today, you can generate professional invoices in 30 seconds and record transactions via WhatsApp (voice note or text). Go ahead and commit your first transaction.</p>
  <div style="margin: 24px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #1A202C; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Enter My Dashboard</a>
  </div>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">The Kredibly Team</p>
  </div>
</body>
</html>
`;

const ACTIVATION_NUDGE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #1A202C; margin-top: 0;">Finish activating Kreddy for your business</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">I noticed you registered your business on Kredibly, but Kreddy is still waiting for the green light to start working on WhatsApp.</p>
  <p style="font-size: 15px;">It takes less than 60 seconds to finish setup. Once you're done, simply message <strong>"Hi Kreddy"</strong> on WhatsApp, and she will handle the rest.</p>
  <div style="margin: 24px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #4C1D95; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Finish My Activation →</a>
  </div>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const FINISH_SETUP_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #1A202C; margin-top: 0;">Complete your setup on Kredibly</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">I noticed you started your Kredibly journey, but your business profile is still missing a few key details.</p>
  <p style="font-size: 15px;">To start recording sales, sending professional invoices, and tracking your receivables automatically, take 60 seconds to finish your setup.</p>
  <div style="margin: 24px 0;">
    <a href="https://usekredibly.com/onboarding" style="background-color: #4C1D95; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Complete My Setup →</a>
  </div>
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const GROWTH_MASTERCLASS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 20px;">
  <p style="font-size: 16px; margin-top: 0; color: #1A202C;">Good morning {name},</p>
  
  <p style="font-size: 15px; color: #2D3748;">{adviceText}</p>

  <p style="font-size: 14px; color: #4A5568; margin-top: 20px;">
    To review your records or record a new transaction, message Kreddy on WhatsApp:
    <br>
    <a href="https://wa.me/2347071238658?text=Kreddy%2C%20I'm%20ready%20to%20grow%20today!" style="color: #4C1D95; font-weight: 700; text-decoration: underline;">Open Kreddy on WhatsApp →</a>
  </p>

  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const INACTIVITY_DAY2_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 17px; font-weight: 800; color: #1A202C; margin-top: 0;">Create your first invoice in 15 seconds</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">I noticed you haven't created your first invoice with Kreddy yet.</p>
  <p style="font-size: 15px;">You don't need to log into a complicated website or fill out spreadsheet columns. You can just talk to Kreddy on WhatsApp the exact same way you talk to a business partner.</p>
  
  <div style="background: #F7FAFC; border: 1.5px dashed #CBD5E0; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
    <p style="margin: 0 0 6px; font-weight: 700; color: #1A202C; font-size: 13px;">Try sending this directly to Kreddy on WhatsApp:</p>
    <p style="margin: 0; color: #4C1D95; font-family: monospace; font-size: 14px; font-weight: 700;">
      "Kreddy, Rebecca bought shoes for ₦25,000, due next Friday"
    </p>
  </div>

  <p style="font-size: 14px;">Kreddy will immediately generate a clean PDF invoice with secure bank transfer payment details and deliver it to your customer.</p>

  <div style="margin: 24px 0;">
    <a href="https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20I'd%20like%20to%20create%20my%20first%20invoice" style="background-color: #4C1D95; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Message Kreddy on WhatsApp →</a>
  </div>

  <p style="font-size: 15px;">Give it a try today and let me know how it goes!</p>

  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const INACTIVITY_DAY7_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 17px; font-weight: 800; color: #1A202C; margin-top: 0;">Are customers owing you money? Let Kreddy handle it</p>
  <p style="font-size: 15px;">Hi {name},</p>
  <p style="font-size: 15px;">One of the biggest profit killers for Nigerian business owners is chasing customers for payment. It's awkward, exhausting, and wastes hours of your week.</p>
  <p style="font-size: 15px;">That is why we built Kreddy. Whenever a customer buys on credit:</p>
  
  <ul style="color: #4A5568; padding-left: 20px; margin: 16px 0; font-size: 14px;">
    <li style="margin-bottom: 6px;">Kreddy schedules automated, polite reminders before and on the due date.</li>
    <li style="margin-bottom: 6px;">Customers receive dedicated virtual accounts to transfer payments directly to your bank account.</li>
    <li style="margin-bottom: 6px;">Your debt ledger stays 100% accurate with zero awkward phone calls.</li>
  </ul>

  <div style="margin: 24px 0;">
    <a href="https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20show%20me%20how%20debt%20tracking%20works" style="background-color: #1A202C; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Open Kreddy on WhatsApp →</a>
  </div>

  <p style="font-size: 15px;">I built Kredibly so you can keep 100% of your focus on sales while the system protects your cashflow.</p>

  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const WEEKLY_MONDAY_DIGEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 900; color: #1A202C; margin-top: 0; letter-spacing: -0.02em;">Monday Morning Kickoff: {businessName}</p>
  <p style="font-size: 15px;">Good morning {name},</p>
  <p style="font-size: 15px;">Here is your weekly business kickoff to start the new week with momentum and clarity.</p>
  
  <div style="background: #F7FAFC; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #E2E8F0;">
    <p style="margin: 0 0 10px; font-weight: 800; color: #1A202C; font-size: 14px; text-transform: uppercase;">Last Week's Performance</p>
    <p style="margin: 4px 0; font-size: 14px; color: #4A5568;">• Cash Collected: <strong style="color: #16A34A;">₦{cashCollected}</strong></p>
    <p style="margin: 4px 0; font-size: 14px; color: #4A5568;">• Invoices Issued: <strong>{invoicesCount}</strong></p>
    <p style="margin: 4px 0; font-size: 14px; color: #4A5568;">• Total Outstanding Debts: <strong style="color: #DC2626;">₦{pendingDebt}</strong></p>
  </div>

  <div style="background: #FAF5FF; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #E9D5FF;">
    <p style="margin: 0 0 8px; font-weight: 800; color: #6B21A8; font-size: 14px; text-transform: uppercase;">This Week's Growth Play</p>
    <div style="font-size: 14px; color: #4C1D95; white-space: pre-line; line-height: 1.7;">
      {weeklyAdvice}
    </div>
  </div>

  <div style="margin: 24px 0;">
    <a href="https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20let's%20start%20the%20week!" style="background-color: #4C1D95; color: white; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Open Kreddy on WhatsApp →</a>
  </div>

  <p style="font-size: 15px;">Let’s make this week a high-margin, high-cashflow week.</p>

  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

const LAUNCH_ANNOUNCEMENT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #2D3748; max-width: 580px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 28px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 95px; height: auto; display: block;">
  </div>
  
  <p style="font-size: 16px; margin-top: 0; color: #1A202C;">Hi {name},</p>
  
  <p style="font-size: 15px;">A little over a year ago, I was watching a friend try to balance his work in Lagos.</p>
  
  <p style="font-size: 15px;">He did great work and had plenty of clients. But by the end of every month, getting paid was always a headache.</p>
  
  <p style="font-size: 15px;">He was constantly tracking who owed what, dealing with clients who promised <em>"I’ll transfer tonight"</em> and forgot by morning, and having awkward conversations just to get paid for work he had already delivered.</p>
  
  <p style="font-size: 15px;">I realized this isn't just a retail store problem.</p>
  
  <p style="font-size: 15px;">Whether you sell products, offer professional services, consult, freelance, or run a workshop—if you create value every day, chasing payments and keeping clean records shouldn't take up half your energy.</p>
  
  <p style="font-size: 15px;">Most business software expects you to sit behind a laptop and manage complex spreadsheets. But real work in Africa happens on your phone, inside conversations, and specifically on <strong>WhatsApp</strong>.</p>
  
  <p style="font-size: 15px;">That is why we built <strong>Kredibly</strong>.</p>
  
  <p style="font-size: 15px;">We wanted to make tracking what you're owed, generating clean invoices, and receiving bank transfer payments as effortless as sending a quick WhatsApp message.</p>
  
  <div style="margin: 28px 0; border-top: 1px solid #EDF2F7; border-bottom: 1px solid #EDF2F7; padding: 16px 0;">
    <p style="font-size: 16px; font-weight: 800; color: #1A202C; margin: 0 0 6px 0;">This Saturday, August 22nd: We Go Live Globally</p>
    <p style="font-size: 14px; margin: 0; color: #4A5568;">Over the last few months, early users have been testing Kreddy, our WhatsApp AI assistant—recording transactions, sending invoices, and getting paid without awkward follow-ups.</p>
    <p style="font-size: 14px; margin: 10px 0 0 0; color: #4A5568;">This <strong>Saturday, August 22, 2026</strong>, Kredibly officially launches to the public. As someone who joined early, your account is already set up and your early-access access is ready.</p>
  </div>
  
  <p style="font-size: 15px; font-weight: 700; color: #1A202C; margin-bottom: 8px;">Try it before Saturday</p>
  <p style="font-size: 14px; color: #4A5568; margin-top: 0;">If you haven't yet, take 15 seconds today to try your first message with Kreddy on WhatsApp. You can type or send a voice note for any work or sale:</p>
  
  <div style="background: #F7FAFC; border-left: 3px solid #4C1D95; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 14px; color: #4C1D95; font-weight: 600;">
    "Kreddy, invoice Daniel ₦50,000 for brand design work, due Friday"
  </div>
  
  <p style="font-size: 14px; color: #4A5568;">She will format a clean invoice with direct payment details instantly.</p>
  
  <div style="margin: 28px 0;">
    <a href="https://wa.me/2347071238658?text=Hi%20Kreddy%2C%20I'm%20ready%20for%20Saturday" style="background-color: #1A202C; color: #FFFFFF; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Message Kreddy on WhatsApp →</a>
  </div>
  
  <p style="font-size: 15px;">Thank you for being part of this journey from the beginning. We're excited for what we are building together.</p>
  
  <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #EDF2F7;">
    <p style="font-weight: 800; color: #1A202C; margin: 0; font-size: 15px;">Oluwatosin</p>
    <p style="color: #718096; font-size: 13px; margin: 2px 0 0 0;">Founder, Kredibly</p>
  </div>
</body>
</html>
`;

module.exports = {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
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
  LAUNCH_ANNOUNCEMENT_TEMPLATE
};
