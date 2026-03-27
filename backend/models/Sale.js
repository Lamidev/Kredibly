const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true,
        index: true
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    customerName: {
        type: String,
        trim: true,
        index: true
    },
    customerPhone: {
        type: String,
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"]
    },
    payments: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            method: { type: String, default: "Cash" },
            reference: String
        }
    ],
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid"],
        default: "unpaid",
        index: true
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirmedAt: Date,
    dueDate: {
        type: Date,
        index: true
    },
    reminderSentAt: Date,
    lastAutoReminderSent: Date,
    lastMessageSentAt: Date,
    recordedBy: String,
    viewed: {
        type: Boolean,
        default: false
    },
    viewedAt: Date,
    lastLinkSentAt: {
        type: Date,
        default: Date.now
    },
    lastOpenedAt: Date,
    viewCount: {
        type: Number,
        default: 0
    },
    publicSlug: {
        type: String,
        unique: true,
        index: true
    },
    invoiceType: {
        type: String,
        enum: ["billing", "record"],
        default: "billing",
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for balance
SaleSchema.virtual("paidAmount").get(function () {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

SaleSchema.virtual("balance").get(function () {
    return this.totalAmount - this.paidAmount;
});

// Update status before save
SaleSchema.pre("save", async function (next) {
    const crypto = require("crypto");

    // Auto-generate invoice short code if not set
    if (!this.invoiceNumber) {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 1, I, 0, O
        const generateCode = () => {
            const bytes = crypto.randomBytes(8);
            let part1 = '';
            let part2 = '';
            for (let i = 0; i < 4; i++) {
                part1 += characters[bytes[i] % characters.length];
                part2 += characters[bytes[i+4] % characters.length];
            }
            return `KR-${part1}-${part2}`;
        };

        let isUnique = false;
        let attempts = 0;
        // Limit attempts to avoid Event loop blocking. Use .exists() for faster lookup
        while (!isUnique && attempts < 3) {
            let code = generateCode();
            const existing = await this.constructor.exists({ invoiceNumber: code });
            if (!existing) {
                this.invoiceNumber = code;
                isUnique = true;
            }
            attempts++;
        }
        
        // Final fallback to guarantee uniqueness without crashing
        if (!this.invoiceNumber) {
             this.invoiceNumber = generateCode() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
        }
    }

    // Auto-generate public slug for obfuscated links
    if (!this.publicSlug) {
        // Generate a 16-byte base64url slug. Cryptographically secure & 100% collision-proof. No DB query needed!
        this.publicSlug = crypto.randomBytes(16).toString('base64url');
    }

    const paid = this.payments.reduce((sum, p) => sum + p.amount, 0);
    if (paid >= this.totalAmount) {
        this.status = "paid";
    } else if (paid > 0) {
        this.status = "partial";
    } else {
        this.status = "unpaid";
    }
    next();
});

// Performance Indexes for Mission Control & Revenue Analytics
SaleSchema.index({ businessId: 1, status: 1 });
SaleSchema.index({ "payments.date": 1 });

module.exports = mongoose.model("Sale", SaleSchema);
