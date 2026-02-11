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
        let code = '';
        const generateCode = () => {
            let result = 'KR-';
            for (let i = 0; i < 4; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        };

        let isUnique = false;
        while (!isUnique) {
            code = generateCode();
            const existing = await this.constructor.findOne({ invoiceNumber: code });
            if (!existing) isUnique = true;
        }
        this.invoiceNumber = code;
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
