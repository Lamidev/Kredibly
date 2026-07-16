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
    // Structured line items (from conversational invoice creation)
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, default: 1 },
            unitPrice: { type: Number, required: true }
        }
    ],
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"]
    },
    payments: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            method: { type: String, default: "Cash" },
            reference: String,
            externalReference: String
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
    invoiceType: {
        type: String,
        enum: ["billing", "record"],
        default: "billing",
        index: true
    },
    // Kreddy AI Conversational Invoice Delivery Lifecycle
    lifecycleStatus: {
        type: String,
        enum: [
            "PENDING_DELIVERY",    // Created, not yet sent to customer
            "DELIVERED",           // Invoice PDF sent to customer via WhatsApp
            "EXTENSION_REQUESTED", // Customer requested more time
            "EXTENSION_GRANTED",   // Merchant approved extension
            "EXTENSION_REJECTED",  // Merchant rejected extension
            "PARTIALLY_PAID",      // Customer made a partial payment
            "PAID",                // Fully paid
            "CANCELLED"            // Merchant cancelled
        ],
        default: "PENDING_DELIVERY",
        index: true
    },
    // Customer phone the invoice was actually sent to via WhatsApp
    deliveredToPhone: { type: String },
    customerDeliveredAt: { type: Date },  // When we sent it to customer
    customerRemindersSent: { type: Number, default: 0 }, // # of auto-reminders sent
    lastCustomerReminderAt: { type: Date },
    extensionRequestedAt: { type: Date },
    requestedExtensionDays: { type: Number }, // How many days customer asked for
    extensionApprovedAt: { type: Date },
    extensionsCount: { type: Number, default: 0 },
    pdfUrl: { type: String },  // Cloudinary URL of generated PDF

    // Overpayment tracking — set when customer transfers more than the DVA amount
    overpaymentStatus: {
        type: String,
        enum: ['none', 'pending_refund', 'refunded', 'deferred'],
        default: 'none'
    },
    overpaymentAmount: { type: Number, default: 0 } // Excess amount transferred by customer
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
            const code = generateCode();
            const existing = await mongoose.model("Sale").exists({ invoiceNumber: code });
            if (!existing) {
                this.invoiceNumber = code;
                isUnique = true;
            }
            attempts++;
        }
        
        // Final fallback if collision continues (highly unlikely but for total safety)
        if (!this.invoiceNumber) {
             this.invoiceNumber = generateCode() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
        }
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
