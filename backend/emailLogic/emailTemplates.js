const THEME_COLOR = "#000080"; // Navy Blue

const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: ${THEME_COLOR}; margin: 0; font-size: 24px; font-weight: 800;">Kredibly.</h1>
  </div>
  <div style="background-color: #ffffff; padding: 0;">
    <p style="font-size: 16px;">Hello,</p>
    <p style="font-size: 16px;">To secure your Kredibly account, please verify your email address. This step ensures that your business data remains private and valid.</p>
    
    <div style="margin: 32px 0;">
      <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; color: #6B7280; margin-bottom: 8px;">Verification Code</p>
      <span style="font-size: 36px; font-weight: 800; letter-spacing: 2px; color: ${THEME_COLOR};">{verificationCode}</span>
    </div>

    <p style="font-size: 14px; color: #6B7280;">This code will expire in 15 minutes. If you didn't create an account, you can safely ignore this email.</p>
    
    <div style="margin-top: 32px;">
      <p style="font-weight: 700; margin: 0; font-size: 16px;">Oluwatosin</p>
      <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Founder, Kredibly</p>
    </div>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 12px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly Inc. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: ${THEME_COLOR}; margin: 0; font-size: 24px; font-weight: 800;">Kredibly.</h1>
  </div>
  <div style="background-color: #ffffff; padding: 0;">
    <p style="font-size: 16px;">Hello,</p>
    <p style="font-size: 16px;">This is a quick confirmation that your password has been successfully reset. You can now log back into your dashboard.</p>
    
    <div style="margin: 32px 0;">
       <div style="background-color: #ECFDF5; color: #047857; width: fit-content; padding: 12px 24px; border-radius: 100px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        ✅ Password Updated
      </div>
    </div>

    <p style="font-size: 16px;">If this wasn't you, please reply to this email immediately so we can secure your account.</p>
    
    <div style="margin-top: 32px;">
      <p style="font-weight: 700; margin: 0; font-size: 16px;">Oluwatosin</p>
      <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Founder, Kredibly</p>
    </div>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 12px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly Inc. All rights reserved.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="margin-bottom: 32px;">
    <h1 style="color: ${THEME_COLOR}; margin: 0; font-size: 24px; font-weight: 800;">Kredibly.</h1>
  </div>
  <div style="background-color: #ffffff; padding: 0;">
    <p style="font-size: 16px;">Hello,</p>
    <p style="font-size: 16px;">We received a request to reset your password. No worries—it happens to the best of us.</p>
    
    <div style="margin: 32px 0;">
      <a href="{resetURL}" style="background-color: ${THEME_COLOR}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">Reset Password</a>
    </div>

    <p style="font-size: 14px; color: #6B7280;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    
    <div style="margin-top: 32px;">
      <p style="font-weight: 700; margin: 0; font-size: 16px;">The Kredibly Security Team</p>
    </div>
  </div>
  <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 12px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly Inc. All rights reserved.</p>
  </div>
</body>
</html>
`;

const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Kredibly</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  
  <div style="margin-bottom: 32px;">
    <h1 style="color: ${THEME_COLOR}; margin: 0; font-size: 24px; font-weight: 800;">Kredibly.</h1>
  </div>

  <div style="background-color: #ffffff; padding: 0;">
    <p style="font-size: 16px;">Hi {name},</p>
    
    <p style="font-size: 16px;">I’m Oluwatosin, the founder of Kredibly.</p>

    <p style="font-size: 16px;">I built this platform because I believe growing a business shouldn’t mean drowning in chaos. Whether you're recording a quick sale on WhatsApp or tracking debtors who "promise next week," Kredibly is designed to give you peace of mind and professional power.</p>

    <p style="font-size: 16px;">You’ve just taken the first step towards automating your trust and finances. My team and I are here to support your growth every inch of the way.</p>

    <p style="font-size: 16px;">If you ever have feedback or just want to say hi, simply reply to this email. I read every single one.</p>

    <p style="font-size: 16px; margin-top: 32px;">Welcome to the new standard.</p>

    <div style="margin-top: 24px;">
      <p style="font-weight: 700; margin: 0; font-size: 16px;">Oluwatosin</p>
      <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Founder, Kredibly</p>
    </div>
  </div>

  <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 12px; color: #9CA3AF;">
    <p>© ${new Date().getFullYear()} Kredibly Inc. All rights reserved.</p>
  </div>
</body>
</html>
`;

const NEW_TICKET_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Support Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${THEME_COLOR}; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Support Ticket</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p><strong>User:</strong> {userName}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="background: white; border-left: 4px solid ${THEME_COLOR}; padding: 10px; margin: 10px 0;">
        {message}
    </blockquote>
    <p>Ticket ID: {ticketId}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://usekredibly.com/admin" style="background-color: ${THEME_COLOR}; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
    </div>
  </div>
</body>
</html>
`;

const WAITLIST_NOTIFICATION_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Waitlist Signup</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${THEME_COLOR}; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Waitlist Signup 🚀</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; font-weight: bold; color: ${THEME_COLOR};">A new founder has joined the movement!</p>
    <div style="background: white; border-left: 4px solid ${THEME_COLOR}; padding: 20px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Name:</strong> {name}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> {email}</p>
        <p style="margin: 8px 0;"><strong>WhatsApp:</strong> {whatsappNumber}</p>
        <p style="margin: 8px 0;"><strong>Industry:</strong> {industry}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #6B7280; font-size: 14px;">Documentation and Follow-up required.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  NEW_TICKET_ALERT_TEMPLATE,
  WAITLIST_NOTIFICATION_TEMPLATE
};
