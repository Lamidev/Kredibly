const mongoose = require("mongoose");

const ConversationMemorySchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, unique: true },
    
    // Cached customers mapping name -> phone number
    customers: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        frequency: { type: Number, default: 1 },
        lastInteractionAt: { type: Date, default: Date.now }
    }],
    
    // Frequently sold products mapping name -> price and count
    products: [{
        name: { type: String, required: true },
        defaultPrice: { type: Number },
        frequency: { type: Number, default: 1 }
    }],
    
    // Inferred preferences
    preferences: {
        defaultDueDateDays: { type: Number, default: 2 },
        reminderStyle: { type: String, enum: ["friendly", "strict", "casual"], default: "friendly" }
    }
}, { timestamps: true });

// Case-insensitive query pattern finder
ConversationMemorySchema.methods.findCustomer = function(nameQuery) {
    if (!nameQuery) return null;
    const query = nameQuery.toLowerCase().trim();
    return this.customers.find(c => c.name.toLowerCase().includes(query));
};

module.exports = mongoose.model("ConversationMemory", ConversationMemorySchema);
