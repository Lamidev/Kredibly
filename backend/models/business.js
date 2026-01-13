const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const BusinessSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, "Business name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"]
  },
  businessType: {
    type: String,
    required: [true, "Business type is required"],
    enum: ["retail", "freelancer", "online_vendor", "service", "other"]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiresAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  lastLogin: Date,
  lastActive: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
BusinessSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
BusinessSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Business", BusinessSchema);