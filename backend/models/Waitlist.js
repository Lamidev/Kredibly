const mongoose = require("mongoose");

const WaitlistSchema = new mongoose.Schema({
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
  whatsappNumber: { 
    type: String, 
    required: [true, "WhatsApp number is required"],
    unique: true,
    trim: true
  },
  industry: { 
    type: String,
    trim: true
  },
  referralCode: { 
    type: String, 
    unique: true 
  },
  referredBy: { 
    type: String 
  },
  referralCount: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ['waiting', 'invited', 'active'],
    default: 'waiting'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Generate a random referral code before saving
WaitlistSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    this.referralCode = "KR" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Waitlist", WaitlistSchema);
