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

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (err) {
    }

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
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateTokenAndSetCookie(res, user._id);

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

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
    }

    // Generate token and set cookie so user is authenticated immediately
    const token = generateTokenAndSetCookie(res, user._id);

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

    await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`);

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

    await sendResetSuccessEmail(user.email);

    res.status(200).json({ success: true, message: "Password reset successful" });
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
  resetPassword
};