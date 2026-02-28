const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../../models/User");
const BusinessProfile = require("../../models/BusinessProfile");
const Waitlist = require("../../models/Waitlist");
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Waitlist Gatekeeper Check
    const waitlisted = await Waitlist.findOne({ email: email.toLowerCase() });
    if (!waitlisted) {
        return res.status(403).json({ 
            success: false, 
            message: "This email hasn't been added to our pilot list yet. Please join the waitlist first!" 
        });
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

    // Mark waitlist as active
    waitlisted.status = 'active';
    await waitlisted.save().catch(err => console.error("Waitlist Update Error:", err));

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
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  }).json({ success: true, message: "Logged out" });
};

// Check Auth
const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const profile = await BusinessProfile.findOne({ ownerId: user._id });

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

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetPasswordExpiresAt;

    await user.save();

    sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`)
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

module.exports = {
  register,
  login,
  verifyEmail,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword,
  verifyPassword
};