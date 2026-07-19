const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../../models/User");
const BusinessProfile = require("../../models/BusinessProfile");
const {
  generateTokenAndSetCookie,
} = require("../../utils/generateTokenAndSetCookies");
const {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("../../emailLogic/emails");

// Register User
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // VANGUARD SECURITY: Strong Password Check
    // VANGUARD SECURITY: More inclusive but strong password check
    // Requires at least 8 chars, one number, and one special character (any non-alphanumeric)
    const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 8 characters long and include at least one number and one special character (e.g. !@#$%^&*)." 
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }


    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await newUser.save();

    // 🛡️ SUPER ADMIN NOTIFICATION
    const { sendAdminNewUserAlert, sendVerificationEmail } = require("../../emailLogic/emails");
    sendAdminNewUserAlert({ name: newUser.name, email: newUser.email })
        .catch(err => console.error("Admin Registration Alert Error:", err.message));

    // Send verification email in background for speed
    sendVerificationEmail(newUser.email, verificationToken)
      .catch(err => console.error("Background Email Error (Verification):", err.message));

    const userData = newUser.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for verification.",
      user: userData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login User
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`🚨 Failed Login Attempt: User not found [${email}] from IP: ${req.ip || req.headers['x-forwarded-for']}`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`🚨 Failed Login Attempt: Incorrect Password [${email}] from IP: ${req.ip || req.headers['x-forwarded-for']}`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Update login audit Info
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.headers['x-forwarded-for'];
    await user.save();

    const token = generateTokenAndSetCookie(res, user._id, user.name, user.email, user.role);

    // Get business profile if exists
    const profile = await BusinessProfile.findOne({ ownerId: user._id });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      user: userData,
      profile: profile || null,
      token
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    sendWelcomeEmail(user.email, user.name)
      .catch(err => console.error("Background Email Error (Welcome):", err.message));

    // Generate token and set cookie so user is authenticated immediately
    const token = generateTokenAndSetCookie(res, user._id, user.name, user.email, user.role);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token // Send token back just in case client needs it
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
    path: "/",
  };

  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie("token", "", cookieOptions).json({ success: true, message: "Logged out" });
};

// Check Auth
const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const profile = await BusinessProfile.findOne({ ownerId: user._id });

    // Prevent caching of this sensitive auth check
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.status(200).json({ success: true, user, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Generate numeric reset token (6 digits)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetPasswordExpiresAt;

    await user.save();

    sendPasswordResetEmail(user.email, resetToken)
      .catch(err => console.error("Background Email Error (Forgot Password):", err.message));

    res.status(200).json({ success: true, message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    // VANGUARD SECURITY: Strong Password Check
    // VANGUARD SECURITY: More inclusive but strong password check
    const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 8 characters long and include at least one number and one special character (e.g. !@#$%^&*)." 
        });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    sendResetSuccessEmail(user.email)
      .catch(err => console.error("Background Email Error (Reset Success):", err.message));

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        res.status(200).json({ success: true, message: "Password verified" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ success: false, message: "Subscription is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Avoid duplicate subscriptions
    const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceType: req.headers['user-agent']
      });
      await user.save();
    } else {
        exists.lastUsed = Date.now();
        await user.save();
    }

    res.status(200).json({ success: true, message: "Subscription saved" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePushSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: "Endpoint is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    await user.save();

    res.status(200).json({ success: true, message: "Subscription removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend Verification Code
const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic response to prevent user enumeration
    if (!user || user.isVerified) {
      return res.status(200).json({ success: true, message: "If this email exists and is unverified, a new code has been sent." });
    }

    // ⏱️ Rate limit: block resend if a code was issued within the last 60 seconds
    const sixtySecondsAgo = Date.now() - 60 * 1000;
    if (user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt).getTime() > sixtySecondsAgo + (24 * 60 * 60 * 1000 - 60 * 1000)) {
      return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting a new code." });
    }

    // Generate a fresh 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = newCode;
    user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    sendVerificationEmail(user.email, newCode)
      .catch(err => console.error("Background Email Error (Resend Verification):", err.message));

    res.status(200).json({ success: true, message: "A new verification code has been sent to your email." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword,
  verifyPassword,
  savePushSubscription,
  deletePushSubscription
};