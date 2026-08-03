const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  bankVerified: {
    type: Boolean,
    default: false
  },
  pendingAction: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  verificationToken: String,
  verificationTokenExpiresAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  lastLoginAt: Date,
  lastLoginIp: String,
  accountStatus: {
    type: String,
    enum: ['active', 'frozen', 'blocked'],
    default: 'active'
  },
  accountStatusReason: { type: String, default: '' },
  accountStatusUpdatedAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    deviceType: String,
    lastUsed: { type: Date, default: Date.now }
  }]
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== 'string') return false;
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
