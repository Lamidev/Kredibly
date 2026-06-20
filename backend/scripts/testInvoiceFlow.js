const mongoose = require("mongoose");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config({ path: __dirname + "/../.env" });

// --- Database In-Memory Mocking ---
const db = {};

function setDeep(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function makeQueryMock(result) {
    const promise = Promise.resolve(result);
    const chain = {
        then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
        catch: (onRejected) => promise.catch(onRejected),
        sort: () => chain,
        limit: (n) => {
            if (Array.isArray(result)) {
                return makeQueryMock(result.slice(0, n));
            }
            return chain;
        },
        select: () => chain,
        populate: () => chain,
        exec: () => promise
    };
    return chain;
}

function mockModel(ModelClass, modelName) {
    if (db[modelName]) return; // Already mocked
    const store = [];
    db[modelName] = store;

    ModelClass.findOne = function(query) {
        const found = store.find(item => {
            if (!query) return true;
            for (let key in query) {
                let itemVal = item[key];
                let queryVal = query[key];
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let current = item;
                    for (let p of parts) {
                        current = current ? current[p] : undefined;
                    }
                    itemVal = current;
                }
                if (queryVal && typeof queryVal === 'object') {
                    if (queryVal._id && String(itemVal) !== String(queryVal._id)) return false;
                    if (queryVal.$ne && itemVal === queryVal.$ne) return false;
                    if (queryVal.$in && !queryVal.$in.includes(itemVal)) return false;
                } else if (itemVal !== queryVal) {
                    if (key === 'ownerId' || key === 'businessId' || key === 'saleId' || key === '_id') {
                        if (String(itemVal) !== String(queryVal)) return false;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        });
        return makeQueryMock(found || null);
    };

    ModelClass.findById = function(id) {
        const found = store.find(item => String(item._id) === String(id));
        return makeQueryMock(found || null);
    };

    ModelClass.find = function(query) {
        if (!query || Object.keys(query).length === 0) return makeQueryMock(store);
        const filtered = store.filter(item => {
            for (let key in query) {
                let itemVal = item[key];
                let queryVal = query[key];
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let current = item;
                    for (let p of parts) {
                        current = current ? current[p] : undefined;
                    }
                    itemVal = current;
                }
                if (queryVal && typeof queryVal === 'object') {
                    if (queryVal.$gte) {
                        const val = new Date(itemVal);
                        const gteVal = new Date(queryVal.$gte);
                        if (val < gteVal) return false;
                    }
                    if (queryVal.$ne && itemVal === queryVal.$ne) return false;
                    if (queryVal.$in && !queryVal.$in.includes(itemVal)) return false;
                    if (queryVal.$exists !== undefined) {
                        const exists = itemVal !== undefined;
                        if (exists !== queryVal.$exists) return false;
                    }
                } else if (itemVal !== queryVal) {
                    if (key === 'ownerId' || key === 'businessId' || key === 'saleId' || key === '_id') {
                        if (String(itemVal) !== String(queryVal)) return false;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        });
        return makeQueryMock(filtered);
    };

    ModelClass.findOneAndUpdate = function(query, update, options = {}) {
        let doc = store.find(item => {
            for (let key in query) {
                if (String(item[key]) !== String(query[key])) return false;
            }
            return true;
        });
        if (!doc) {
            if (options.upsert) {
                doc = new ModelClass(query);
                store.push(doc);
            } else {
                return makeQueryMock(null);
            }
        }
        const fields = update.$set || update;
        for (let key in fields) {
            setDeep(doc, key, fields[key]);
        }
        return makeQueryMock(doc);
    };

    ModelClass.findByIdAndUpdate = function(id, update, options = {}) {
        let doc = store.find(item => String(item._id) === String(id));
        if (!doc) {
            if (options.upsert) {
                doc = new ModelClass({ _id: id });
                store.push(doc);
            } else {
                return makeQueryMock(null);
            }
        }
        const fields = update.$set || update;
        for (let key in fields) {
            setDeep(doc, key, fields[key]);
        }
        return makeQueryMock(doc);
    };

    ModelClass.deleteMany = function(query) {
        if (!query || Object.keys(query).length === 0) {
            const count = store.length;
            store.length = 0;
            return makeQueryMock({ deletedCount: count });
        }
        let initialCount = store.length;
        const newStore = store.filter(item => {
            for (let key in query) {
                if (String(item[key]) === String(query[key])) return false;
            }
            return true;
        });
        store.length = 0;
        store.push(...newStore);
        return makeQueryMock({ deletedCount: initialCount - store.length });
    };

    ModelClass.deleteOne = function(query) {
        const idx = store.findIndex(item => {
            for (let key in query) {
                if (String(item[key]) !== String(query[key])) return false;
            }
            return true;
        });
        if (idx !== -1) {
            store.splice(idx, 1);
            return makeQueryMock({ deletedCount: 1 });
        }
        return makeQueryMock({ deletedCount: 0 });
    };

    ModelClass.countDocuments = function(query) {
        if (!query || Object.keys(query).length === 0) return makeQueryMock(store.length);
        const count = store.filter(item => {
            for (let key in query) {
                if (String(item[key]) !== String(query[key])) return false;
            }
            return true;
        }).length;
        return makeQueryMock(count);
    };

    ModelClass.create = async function(docs) {
        if (Array.isArray(docs)) {
            const results = [];
            for (let docData of docs) {
                const inst = new ModelClass(docData);
                await inst.save();
                results.push(inst);
            }
            return results;
        } else {
            const inst = new ModelClass(docs);
            await inst.save();
            return inst;
        }
    };

    ModelClass.prototype.save = async function() {
        if (!this._id) {
            this._id = new mongoose.Types.ObjectId();
        }
        const idx = store.findIndex(item => String(item._id) === String(this._id));
        if (idx === -1) {
            store.push(this);
        } else {
            store[idx] = this;
        }
        return this;
    };
}

// Hook mongoose model compiler globally before requiring files
const originalModel = mongoose.model.bind(mongoose);
mongoose.model = function(name, schema) {
    const ModelClass = originalModel(name, schema);
    mockModel(ModelClass, name);
    return ModelClass;
};

mongoose.connect = async () => {
    console.log("🔌 [MOCK] Connected to in-memory MongoDB.");
};
mongoose.disconnect = async () => {
    console.log("🔌 [MOCK] Disconnected from in-memory MongoDB.");
};

// Import all models (this registers them and applies mocks)
const User = require("../models/User");
const BusinessProfile = require("../models/BusinessProfile");
const WhatsAppSession = require("../models/WhatsAppSession");
const Sale = require("../models/Sale");
const Notification = require("../models/Notification");
const SupportTicket = require("../models/SupportTicket");
const Reminder = require("../models/Reminder");
const Feedback = require("../models/Feedback");
const CustomerAlias = require("../models/CustomerAlias");

// Mock external AI service and PDF service
const aiService = require("../utils/aiService");
const pdfGenerator = require("../utils/pdfGenerator");

aiService.processMessageWithAI = async (text, context) => {
    if (text.includes("Vicky baby") && text.includes("75K")) {
        return {
            intent: "create_sale",
            confidence: 1.0,
            data: {
                customerName: "Vicky baby",
                totalAmount: 75000,
                paidAmount: 0,
                item: "two pairs of Nike Prado",
                reply: "Sharp move! Getting this sale into the ledger now."
            }
        };
    }
    return { intent: "general_chat", data: { reply: "I hear you, Chief." } };
};

aiService.generateWittyIntro = async (intent, context) => {
    return "Sharp move!";
};

pdfGenerator.generateAndUploadInvoicePDF = async (sale, business) => {
    return "https://res.cloudinary.com/dummy/image/upload/v12345/dummy.pdf";
};

// Now import whatsappController
const whatsappController = require("../controllers/whatsapp/whatsappController");

const sentMessages = [];

// Mock Axios Post to intercept all WhatsApp API calls
axios.post = async (url, data, config) => {
    sentMessages.push({ url, data });
    return { data: { success: true, messages: [{ id: "wamid.mock_" + Math.random().toString(36).substring(7) }] } };
};

// Mock Response Object
const makeRes = () => ({
    sendStatus: (code) => {},
    status: function(code) { return this; },
    json: function(data) { return this; },
    send: function(data) { return this; }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    console.log("🚀 Starting Kredibly v2 E2E Invoice Creation & Editing Flow Test...\n");

    // Force setup local mock URL if not set
    process.env.MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/kredibly_mock";

    if (!process.env.MONGODB_URL) {
        console.error("❌ MONGODB_URL not found in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URL);
    console.log("🔌 Connected to MongoDB.\n");

    const merchantPhone = "2348082366322";
    const customerPhone = "2348012345678";

    // 1. Setup/Ensure Business Profile & User
    console.log("🛠️ Preparing Test Merchant User...");
    let user = await User.findOne({ email: "testmerchant@kredibly.com" });
    if (!user) {
        user = new User({
            name: "Test Merchant",
            email: "testmerchant@kredibly.com",
            password: "password123",
            isVerified: true
        });
        await user.save();
    }

    let profile = await BusinessProfile.findOne({ ownerId: user._id });
    if (!profile) {
        profile = new BusinessProfile({
            ownerId: user._id,
            displayName: "Vicky Fashion Emporium",
            whatsappNumber: merchantPhone,
            plan: "oga",
            planStatus: "active"
        });
        await profile.save();
    } else {
        // Ensure whatsapp number matches merchantPhone
        profile.whatsappNumber = merchantPhone;
        await profile.save();
    }

    // Clean up any old sessions or sales from previous runs to ensure clean test state
    await WhatsAppSession.deleteMany({ whatsappNumber: merchantPhone });
    await Sale.deleteMany({ recordedBy: merchantPhone });

    console.log(`✅ Merchant: ${profile.displayName} (+${profile.whatsappNumber}) is ready.\n`);

    // Helper to print last captured outbound message
    const popLastMessageText = () => {
        const last = sentMessages[sentMessages.length - 1];
        if (!last) return null;
        if (last.data.type === "interactive") {
            const bodyText = last.data.interactive.body.text;
            const buttons = last.data.interactive.action.buttons.map(b => b.reply.title).join(" | ");
            return `[Interactive] ${bodyText}\nButtons: [ ${buttons} ]`;
        }
        return last.data.text?.body || JSON.stringify(last.data);
    };

    // Helper to send message from Merchant
    const sendFromMerchant = async (text, type = "text", buttonId = null) => {
        const msgId = "wamid.inbound_" + Math.random().toString(36).substring(7);
        const req = {
            body: {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                from: merchantPhone,
                                id: msgId,
                                type,
                                text: type === "text" ? { body: text } : undefined,
                                interactive: type === "interactive" ? {
                                    button_reply: { id: buttonId, title: text }
                                } : undefined
                            }],
                            contacts: [{ profile: { name: "Test Merchant" } }]
                        }
                    }]
                }]
            }
        };
        await whatsappController.handleIncoming(req, makeRes());
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Send Invoice Creation request
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 1: Merchant sends invoice instruction...");
    await sendFromMerchant("Create an invoice for Vicky baby, she bought two pairs of Nike Prado for 75K");
    await sleep(500);

    let response = popLastMessageText();
    console.log(`🤖 Kreddy: "${response}"`);
    if (!response.includes("WhatsApp number")) {
        console.error("❌ Failed Step 1: Kreddy should ask for customer WhatsApp number.");
        process.exit(1);
    }
    console.log("✅ Step 1 passed.\n");

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Provide Customer Phone Number
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 2: Merchant provides customer phone number...");
    await sendFromMerchant("08012345678");
    await sleep(500);

    response = popLastMessageText();
    console.log(`🤖 Kreddy:\n${response}`);
    if (!response.toLowerCase().includes("vicky baby") || !response.toLowerCase().includes("nike prado") || !response.includes("✏️ Edit")) {
        console.error("❌ Failed Step 2: Kreddy should show invoice summary with Yes, No, and ✏️ Edit buttons.");
        process.exit(1);
    }
    console.log("✅ Step 2 passed (Summary generated with Edit button successfully).\n");

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Click "✏️ Edit" Button
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 3: Merchant clicks '✏️ Edit' button...");
    await sendFromMerchant("✏️ Edit", "interactive", "invoice_edit");
    await sleep(500);

    response = popLastMessageText();
    console.log(`🤖 Kreddy:\n${response}`);
    if (!response.includes("Current Invoice Details") || !response.includes("change name to Bukola")) {
        console.error("❌ Failed Step 3: Kreddy should list details and instruction guide.");
        process.exit(1);
    }
    console.log("✅ Step 3 passed (Edit instructions shown correctly).\n");

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Make an Edit (Update price)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 4: Merchant edits the price to 85k...");
    await sendFromMerchant("price is 85k");
    await sleep(500);

    response = popLastMessageText();
    console.log(`🤖 Kreddy:\n${response}`);
    if (!response.includes("₦85,000") || response.includes("₦75,000")) {
        console.error("❌ Failed Step 4: Kreddy should update price in summary to ₦85,000.");
        process.exit(1);
    }
    console.log("✅ Step 4 passed (Price edit parsed & applied successfully).\n");

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Make another Edit (Update customer name)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 5: Merchant edits customer name to Vicky Baby Samwell...");
    await sendFromMerchant("change name to Vicky Baby Samwell");
    await sleep(500);

    response = popLastMessageText();
    console.log(`🤖 Kreddy:\n${response}`);
    if (!response.includes("Vicky Baby Samwell")) {
        console.error("❌ Failed Step 5: Kreddy should update customer name to Vicky Baby Samwell.");
        process.exit(1);
    }
    console.log("✅ Step 5 passed (Name edit parsed & applied successfully).\n");

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Confirm and Generate Invoice (Click "Yes")
    // ─────────────────────────────────────────────────────────────────────────
    console.log("➡️ Step 6: Merchant confirms by clicking 'Yes'...");
    const saleBefore = await Sale.countDocuments({ recordedBy: merchantPhone });
    await sendFromMerchant("Yes", "interactive", "invoice_yes");
    await sleep(6000); // Allow deliverInvoiceToCustomer promise to execute

    const saleAfter = await Sale.countDocuments({ recordedBy: merchantPhone });
    if (saleAfter !== saleBefore + 1) {
        console.error("❌ Failed Step 6: Sale was not saved to DB.");
        process.exit(1);
    }

    const createdSale = await Sale.findOne({ recordedBy: merchantPhone }).sort({ createdAt: -1 });
    console.log("📊 Created Sale in DB:", {
        customerName: createdSale.customerName,
        totalAmount: createdSale.totalAmount,
        customerPhone: createdSale.customerPhone,
        description: createdSale.description
    });

    if (createdSale.totalAmount !== 85000 || createdSale.customerName !== "Vicky Baby Samwell" || createdSale.customerPhone !== customerPhone) {
        console.error("❌ Failed Step 6: Sale fields do not match edited invoice session.");
        process.exit(1);
    }

    console.log("\n📦 Inspecting Outgoing Delivery to Customer...");
    // Find customer deliveries in sentMessages
    const customerMsgs = sentMessages.filter(msg => msg.data.to === customerPhone);
    console.log(`Total messages sent to customer (+${customerPhone}):`, customerMsgs.length);

    customerMsgs.forEach((msg, idx) => {
        console.log(`Msg ${idx + 1}:`, JSON.stringify(msg.data, null, 2));
    });

    // Customer message should have buttons (Pay Now, Request Extension) and a PDF file sent
    const hasButtonsMsg = customerMsgs.some(m => m.data.type === "interactive" && m.data.interactive.action.buttons.some(b => b.reply.id.startsWith("pay_now:")));
    const hasDocumentMsg = customerMsgs.some(m => m.data.type === "document");

    if (!hasButtonsMsg) {
        console.error("❌ Failed Step 6: Customer did not receive the interactive pay buttons.");
        process.exit(1);
    }
    if (!hasDocumentMsg) {
        console.error("❌ Failed Step 6: Customer did not receive the invoice PDF document.");
        process.exit(1);
    }

    console.log("✅ Step 6 passed (Invoice confirmed, generated, and delivered to customer successfully).\n");

    console.log("🎉 ALL E2E FLOW TESTS PASSED SUCCESSFULLY! No crashes, correct state transitions, robust edits, and clean button delivery.");
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(async (err) => {
    console.error("💥 E2E Test Execution Error:", err);
    await mongoose.disconnect();
    process.exit(1);
});
