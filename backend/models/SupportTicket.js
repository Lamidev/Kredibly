const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["open", "replied", "resolved"],
        default: "open"
    },
    replies: [{
        message: { type: String, required: true },
        sender: { type: String, enum: ["admin", "user"], required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("SupportTicket", SupportTicketSchema);
