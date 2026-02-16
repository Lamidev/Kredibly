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
    // Auto-generate invoice short code if not set
    if (!this.invoiceNumber) {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 1, I, 0, O
        const generateCode = () => {
            let part1 = '';
            let part2 = '';
            for (let i = 0; i < 4; i++) {
                part1 += characters.charAt(Math.floor(Math.random() * characters.length));
                part2 += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return `KR-${part1}-${part2}`;
        };

        let isUnique = false;
        let code = '';
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            code = generateCode();
            const existing = await this.constructor.findOne({ invoiceNumber: code });
            if (!existing) isUnique = true;
            attempts++;
        }
        this.invoiceNumber = code;
    }

    // Auto-generate public slug for obfuscated links
    if (!this.publicSlug) {
        const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let slug = '';
        const generateSlug = () => {
            let result = '';
            for (let i = 0; i < 12; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let isUnique = false;
        while (!isUnique) {
            slug = generateSlug();
            const existing = await this.constructor.findOne({ publicSlug: slug });
            if (!existing) isUnique = true;
        }
        this.publicSlug = slug;
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

module.exports = mongoose.model("Sale", SaleSchema);
