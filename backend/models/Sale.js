const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true
    },
    customerName: {
        type: String,
        trim: true
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
            method: { type: String, default: "Cash" }
        }
    ],
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid"],
        default: "unpaid"
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirmedAt: Date,
    dueDate: Date,
    reminderSentAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for balance
SaleSchema.virtual("paidAmount").get(function () {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

SaleSchema.virtual("balance").get(function () {
    return this.totalAmount - this.paidAmount;
});

// Update status before save
SaleSchema.pre("save", function (next) {
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
