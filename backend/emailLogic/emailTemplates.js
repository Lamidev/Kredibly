const THEME_COLOR = "#4C1D95"; // Kredibly Purple

const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p>Hello,</p>
  <p>Thank you for joining Kredibly! Here is your 6-digit verification code to complete your setup:</p>
  <div style="margin: 28px 0; text-align: center; background: #F8FAFC; border: 1.5px dashed #CBD5E1; padding: 24px; border-radius: 16px;">
    <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4C1D95; display: inline-block;">{verificationCode}</span>
  </div>
  <p style="font-size: 13px; color: #9CA3AF; margin-top: 16px;">This code will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; margin: 0; font-size: 16px; color: #111827;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p>Hello,</p>
  <p>I’m sending this quick note to confirm that your password was successfully reset. You can now log back into your dashboard using your new credentials.</p>
  <p>Security is my top priority here at Kredibly, so if this change wasn't made by you, please reply to this email immediately so I can lock down your account.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; margin: 0; font-size: 16px; color: #111827;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p>Hello,</p>
  <p>We received a request to reset your password. It happens to the best of us, but I want to make sure your business data stays secure. Please use the security code below to reset your password:</p>
  <div style="margin: 32px 0;">
    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #6B7280; margin-bottom: 8px;">Security Code</p>
    <span style="font-size: 32px; font-weight: 800; letter-spacing: 2px; color: #111827;">{resetURL}</span>
  </div>
  <p style="font-size: 14px; color: #6B7280;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; margin: 0; font-size: 16px; color: #111827;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p>Hi {name},</p>
  <p>Welcome to the family! We built Kredibly because we believe growing a business shouldn't mean drowning in chaos or chasing debtors who "promise next week."</p>
  <p>You've just taken the first step towards automating your trust and finances. Whether you're recording a quick sale via text, voice note, or even just uploading a photo of a paper invoice, Kredibly is designed to give you peace of mind and professional power. Our team is here to support your growth every inch of the way.</p>
  <p>If you ever have feedback or just want to say hi, simply reply to this email. We read every single one personally.</p>
  <p>Welcome to the new standard.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const NEW_TICKET_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <h2 style="font-size: 18px; font-weight: 800; color: #111827;">New Support Ticket</h2>
  <p>A user has just submitted a new ticket. Details below:</p>
  <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0;">
    <p style="margin: 0 0 10px;"><strong>User:</strong> {userName}</p>
    <p style="margin: 0;"><strong>Message:</strong> {message}</p>
  </div>
  <p style="font-size: 13px; color: #6B7280;">Ticket ID: {ticketId}</p>
  <div style="margin-top: 32px;">
    <a href="https://usekredibly.com/admin" style="font-weight: 700; color: #4C1D95; text-decoration: none;">Launch Admin Panel →</a>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;


const SUPPORT_REPLY_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p>Hello {name},</p>
  <p>The Kredibly team has replied to your support ticket regarding <strong>"{ticketSubject}"</strong>. You can find the reply below:</p>
  <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #111827;">
      <p style="margin: 0; font-size: 15px; color: #111827;">"{message}"</p>
  </div>
  <p>Please log in to your dashboard to continue the conversation or mark this ticket as resolved.</p>
  <div style="margin: 32px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #111827; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Go to Dashboard</a>
  </div>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const SUBSCRIPTION_CONFIRM_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 0;">Payment Verified. Welcome home, Pioneer 🛡️</p>
  <p>Hi {name},</p>
  <p>Your support today means a lot to us. By securing your <strong>{planName} Plan</strong>, you’ve not just bought a tool; you’ve joined a mission to build a more professional and reliable future for your business.</p>
  <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px;"><strong>Plan:</strong> {planName}</p>
      <p style="margin: 0 0 8px;"><strong>Amount:</strong> {amount}</p>
      <p style="margin: 0 0 8px;"><strong>Status:</strong> <span style="color: #16A34A; font-weight: 800;">ACTIVE</span></p>
      <p style="margin: 0;"><strong>Next Renewal:</strong> {expiryDate}</p>
  </div>
  <p>{pioneerStatus}</p>
  <p>We built Kredibly because we believe your shop boy shouldn't be late and your debtors shouldn't have excuses. Together, we are changing the standard. If you need anything at all, simply reply to this email.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const BANK_CHANGE_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <h2 style="font-size: 16px; font-weight: 800; color: #EF4444; margin-top: 0; text-transform: uppercase;">🚨 Security Alert</h2>
  <p>Hello {name},</p>
  <p>This is an automated security notification to let you know that the <strong>bank account details</strong> for your Kredibly business were just updated.</p>
  <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 4px 0;"><strong>Bank:</strong> {bankName}</p>
      <p style="margin: 4px 0;"><strong>Account:</strong> {accountNumber}</p>
      <p style="margin: 4px 0;"><strong>Holder:</strong> {accountName}</p>
  </div>
  <p style="color: #EF4444; font-weight: 700;">If you DID NOT make this change:</p>
  <p>Please reply to this email immediately. We have temporarily suspended automated payouts to the new account for the next 24 hours as a precaution.</p>
  <div style="margin: 32px 0;">
    <a href="https://usekredibly.com/dashboard/support" style="background-color: #EF4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">This Wasn't Me!</a>
  </div>
  <p style="font-size: 14px; color: #6B7280;">If you made this change, you can safely ignore this email.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; margin: 0; font-size: 16px; color: #111827;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const ONBOARDING_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 0;">Setup Complete. You are officially a {planTitle}! 🛡️</p>
  <p>Hi {name},</p>
  <p>Congratulations! Your business, <strong>{businessName}</strong>, is now fully set up on Kredibly. Our system has verified your bank details, and you are officially ready to start building your professional legacy.</p>
  <p>From today, you can generate professional invoices in 30 seconds, record sales via WhatsApp (voice, text, or photo), and stay in control while your staff handles the daily hustle. Since you joined during our Grand Opening, your <strong>{planTitle} Plan</strong> trial is active. Go ahead and commit your first transaction—let’s grow your business together.</p>
  <div style="margin: 32px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #111827; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Enter My Dashboard</a>
  </div>
  <p>Welcome home.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">The Kredibly Team</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">hello@usekredibly.com</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const ACTIVATION_NUDGE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 0;">Help me get to work, {name}? 🛡️</p>
  <p>I noticed you registered your business on Kredibly, but your Digital Chief of Staff (Kreddy) is still waiting for the green light to start working.</p>
  <p>Without activation, I can't track your sales, automatically chase your debtors, or give you the daily intelligence summaries you need to stay in control.</p>
  <p>It takes less than 60 seconds to finish. Once you're done, just message me <strong>"Hi Kreddy"</strong> on WhatsApp, and I'll take it from there.</p>
  <div style="margin: 32px 0;">
    <a href="https://usekredibly.com/dashboard" style="background-color: #4C1D95; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Finish My Activation 🚀</a>
  </div>
  <p>I built Kredibly so you can focus on growing your business while I handle the chaos. Let's get started.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">Oluwatosin</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Founder, Kredibly</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const FINISH_SETUP_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 32px;">
    <img src="https://usekredibly.com/krediblyrevamped.png" alt="Kredibly" style="width: 100px; height: auto; display: block;">
  </div>
  <p style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 0;">Don't leave your shop boy hanging, {name}! 🛡️</p>
  <p>I noticed you started your Kredibly journey, but your business profile is still missing some key details.</p>
  <p>To start recording sales, sending professional invoices, and tracking your debts automatically, you need to finish your dashboard setup.</p>
  <p>It’s fast, simple, and the final step before you can activate Kreddy, your Digital Chief of Staff, on WhatsApp.</p>
  <div style="margin: 32px 0;">
    <a href="https://usekredibly.com/onboarding" style="background-color: #4C1D95; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Complete My Setup 🚀</a>
  </div>
  <p>Let's get your business automated so you can spend less time bookkeeping and more time growing.</p>
  <div style="margin-top: 48px;">
    <p style="font-weight: 800; color: #111827; margin: 0; font-size: 16px;">Oluwatosin</p>
    <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Founder, Kredibly</p>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px; font-size: 11px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd. All rights reserved.</p>
  </div>
</body>
</html>
`;

const GROWTH_MASTERCLASS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p style="font-size: 16px; margin-top: 0;">Good morning {name},</p>
  
  <p style="font-size: 16px; color: #374151;">{adviceText}</p>

  <p style="font-size: 15px; color: #374151; margin-top: 24px;">
    To see your full financial performance for yesterday or record a new sale, simply visit your dashboard or send me a message on WhatsApp:
    <br>
    <a href="https://wa.me/2347071238658?text=Kreddy%2C%20I'm%20ready%20to%20grow%20today!" style="color: #4C1D95; font-weight: 700; text-decoration: underline;">Open Kreddy on WhatsApp →</a>
  </p>

  <p style="font-size: 15px; color: #374151;">Let's make today a winning day for your business.</p>

  <div style="margin-top: 40px; border-top: 1px solid #F1F5F9; padding-top: 20px;">
    <p style="font-weight: 700; color: #111827; margin: 0; font-size: 16px;">Oluwatosin</p>
    <p style="color: #6B7280; font-size: 14px; margin: 0;">Founder, Kredibly</p>
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
  FINISH_SETUP_TEMPLATE
};
