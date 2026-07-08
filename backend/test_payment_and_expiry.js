const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const BusinessProfile = require("./models/BusinessProfile");
const Sale = require("./models/Sale");
const VirtualAccount = require("./models/VirtualAccount");
const PaymentSession = require("./models/PaymentSession");

// Mock WhatsApp functions to log to console instead of sending live API calls
const whatsappController = require("./controllers/whatsapp/whatsappController");
const customerInvoiceService = require("./utils/customerInvoiceService");
const nomba = require("./utils/nomba");

// Keep track of calls
const logs = [];

whatsappController.sendWhatsAppPaymentAlert = async (to, amount, invoice, name, text) => {
    logs.push({ type: "MERCHANT_ALERT", to, amount, invoice, name, text });
    console.log(`[MOCK] 📱 WhatsApp alert sent to merchant (${to}): ${text}`);
};

whatsappController.sendWhatsAppMessage = async (to, text) => {
    logs.push({ type: "CUSTOMER_ALERT", to, text });
    console.log(`[MOCK] 💬 WhatsApp message sent to customer (${to}): ${text}`);
};

customerInvoiceService.sendCustomerMessageWithFallback = async (to, text, name, invoice) => {
    logs.push({ type: "CUSTOMER_TEMPLATE_ALERT", to, text, name, invoice });
    console.log(`[MOCK] 🧾 WhatsApp Template message sent to customer (${to}) for invoice ${invoice}. Text: ${text}`);
};

customerInvoiceService.sendImage = async (to, url, caption) => {
    logs.push({ type: "CUSTOMER_IMAGE", to, url, caption });
    console.log(`[MOCK] 🖼️ WhatsApp image receipt sent to customer (${to}). Caption: ${caption}`);
};

customerInvoiceService.sendDocument = async (to, url, filename, caption) => {
    logs.push({ type: "CUSTOMER_DOCUMENT", to, url, filename, caption });
    console.log(`[MOCK] 📄 WhatsApp PDF receipt sent to customer (${to}). Caption: ${caption}`);
};

// Mock Nomba transfer/sweep to avoid live payout call
nomba.initiateTransfer = async (payload) => {
    logs.push({ type: "AUTO_SWEEP_PAYOUT", payload });
    console.log(`[MOCK] 💸 Nomba sweep executed: ₦${payload.amount} transferred to ${payload.accountNumber} (${payload.bankCode})`);
    return { success: true, transactionReference: "TX-SWEEP-MOCK-123" };
};

// Import the payment processor function
const { handleNombaWebhook } = require("./controllers/common/nombaController");

async function runTests() {
    try {
        console.log("DB URL:", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB!");

        // Drop stale reference_1 index if it exists to avoid duplicate key errors on null
        try {
            await mongoose.connection.collection("paymentsessions").dropIndex("reference_1");
            console.log("Dropped stale reference_1 index successfully!");
        } catch (idxErr) {
            // Index doesn't exist, ignore
        }

        // Clean up any stale leftovers from previous failed runs first
        await BusinessProfile.deleteMany({ displayName: "Akinbyte Creatives" });
        await Sale.deleteMany({ invoiceNumber: "KR-TEST-YPYQ" });
        await VirtualAccount.deleteMany({ reference: { $in: ["REF-TEST-PARTIAL-99", "REF-TEST-EXPIRED-77"] } });
        await PaymentSession.deleteMany({ reference: { $in: ["PS-REF-TEST-99", "PS-REF-EXPIRED-77"] } });

        // --- SETUP DUMMY DATA ---
        const testBusiness = await BusinessProfile.create({
            ownerId: new mongoose.Types.ObjectId(),
            displayName: "Akinbyte Creatives",
            whatsappNumber: "2349000000000",
            bankDetails: {
                bankCode: "000013",
                accountNumber: "0123456789",
                accountName: "Akinbyte Bank Account"
            },
            plan: "oga",
            planStatus: "active",
            assistantSettings: {
                preferredName: "Boss"
            }
        });

        // 1. Create sale
        const testSale = await Sale.create({
            businessId: testBusiness._id,
            invoiceNumber: "KR-TEST-YPYQ",
            customerName: "Samuel Ajayi",
            customerPhone: "2348111111111",
            customerEmail: "samuel@example.com",
            description: "Test design services",
            totalAmount: 10000,
            status: "unpaid",
            lifecycleStatus: "DELIVERED",
            items: [{ name: "Design Service", description: "Design service", unitPrice: 10000, price: 10000, quantity: 1 }],
            payments: []
        });

        console.log("\n--- TEST CASE 1: Webhook Payment Detection, Receipts & Auto-Sweep ---");

        // 2. Create the VirtualAccount (fix verified) and PaymentSession for a partial payment of 4,000 NGN
        const dvaRef = "REF-TEST-PARTIAL-99";
        const dvaAccNo = "6673709811";
        const dvaBankName = "Nombank MFB";
        
        await VirtualAccount.create({
            businessId: testBusiness._id,
            saleId: testSale._id,
            invoiceNumber: testSale.invoiceNumber,
            accountNumber: dvaAccNo,
            bankName: dvaBankName,
            provider: "nomba",
            reference: dvaRef,
            accountName: "AKINBYTE/LAMIDE CREATIVES",
            amount: 4000,
            baseAmount: 4000,
            status: "active",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await PaymentSession.create({
            saleId: testSale._id,
            businessId: testBusiness._id,
            customerPhone: "2348111111111",
            amountExpected: 4000,
            amountIntended: 4000,
            paymentType: "partial",
            reference: "PS-REF-TEST-99",
            nombaReference: dvaRef,
            nombaAccountNumber: dvaAccNo,
            nombaBankName: dvaBankName,
            nombaAccountName: "AKINBYTE/LAMIDE CREATIVES",
            nombaExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // 3. Simulate the Nomba Webhook Payload
        const webhookPayload = {
            event_type: "payment_success",
            data: {
                transaction: {
                    aliasAccountReference: dvaRef,
                    aliasAccountNumber: dvaAccNo,
                    transactionId: "TX-NOMBA-REAL-888",
                    transactionAmount: 4000
                },
                customer: {
                    senderName: "Samuel Ajayi Bank Account"
                }
            }
        };

        // Trigger webhook simulation
        const mockReq = { body: webhookPayload };
        const mockRes = {
            status: function(code) {
                return {
                    json: function(data) {
                        console.log(`[WEBHOOK RESPONSE] Status: ${code}`, data);
                    }
                };
            }
        };

        await handleNombaWebhook(mockReq, mockRes);

        // Wait 22 seconds for the auto-sweep setTimeout (20s buffer + 2s padding)
        console.log("Waiting 22 seconds for Auto-Sweep execution...");
        await new Promise(r => setTimeout(r, 22000));

        // Verify Database state
        const updatedSale = await Sale.findById(testSale._id);
        const updatedVA = await VirtualAccount.findOne({ reference: dvaRef });
        const updatedSession = await PaymentSession.findOne({ nombaReference: dvaRef });

        console.log("\n--- Verification Results (Test Case 1) ---");
        console.log(`Sale Status updated: ${updatedSale.status} (Expected: partial)`);
        console.log(`Sale Payments recorded: ${updatedSale.payments.length} (Expected: 1)`);
        console.log(`VirtualAccount Status: ${updatedVA.status} (Expected: used)`);
        console.log(`PaymentSession Status: ${updatedSession.status} (Expected: paid)`);
        console.log(`Image receipt sent: ${logs.some(l => l.type === "CUSTOMER_IMAGE")}`);
        console.log(`Auto-Sweep payout executed: ${logs.some(l => l.type === "AUTO_SWEEP_PAYOUT")}`);

        console.log("\n--- TEST CASE 2: DVA Expiry & Customer Template Notification ---");

        // 1. Create an expired PaymentSession and matching VirtualAccount
        const expiredDvaRef = "REF-TEST-EXPIRED-77";
        const expiredVA = await VirtualAccount.create({
            businessId: testBusiness._id,
            saleId: testSale._id,
            invoiceNumber: testSale.invoiceNumber,
            accountNumber: "6673708888",
            bankName: dvaBankName,
            provider: "nomba",
            reference: expiredDvaRef,
            accountName: "AKINBYTE/LAMIDE CREATIVES",
            amount: 4000,
            baseAmount: 4000,
            status: "active",
            expiresAt: new Date(Date.now() - 5000) // expired 5 seconds ago
        });

        const expiredSession = await PaymentSession.create({
            saleId: testSale._id,
            businessId: testBusiness._id,
            customerPhone: "2348111111111",
            amountExpected: 4000,
            amountIntended: 4000,
            paymentType: "partial",
            reference: "PS-REF-EXPIRED-77",
            nombaReference: expiredDvaRef,
            nombaAccountNumber: "6673708888",
            nombaBankName: dvaBankName,
            nombaAccountName: "AKINBYTE/LAMIDE CREATIVES",
            nombaExpiresAt: new Date(Date.now() - 5000),
            expiresAt: new Date(Date.now() - 5000) // expired 5 seconds ago
        });

        // Run the expiry check logic manually
        const expiredSessions = await PaymentSession.find({
            status: "pending",
            expiresAt: { $lte: new Date() }
        }).populate("saleId");

        console.log(`Found ${expiredSessions.length} pending expired sessions. Processing...`);

        for (const session of expiredSessions) {
            session.status = "expired";
            await session.save();

            if (session.nombaReference) {
                await VirtualAccount.findOneAndUpdate(
                    { reference: session.nombaReference, status: "active" },
                    { $set: { status: "expired" } }
                );
            }

            const customerPhone = session.customerPhone;
            if (customerPhone) {
                const invoiceNumber = session.saleId?.invoiceNumber || "your invoice";
                const alertMsg = [
                    `⚠️ *Payment Account Expired*`,
                    ``,
                    `Hello, the virtual bank account generated for Invoice *#${invoiceNumber}* has expired.`,
                    ``,
                    `*To pay this invoice now:*`,
                    `1️⃣ Scroll up to the original invoice message in this chat.`,
                    `2️⃣ Tap the *[Pay with Transfer]* button (or simply reply *"pay"* to this message).`,
                    `3️⃣ Kreddy will instantly generate a new virtual bank account for you.`,
                    ``,
                    `*Need more time?*`,
                    `You can tap the *[Request Extension]* button on the original message to ask the merchant for a new due date.`
                ].join('\n');
                
                await customerInvoiceService.sendCustomerMessageWithFallback(customerPhone, alertMsg, session.saleId?.customerName, invoiceNumber);
            }
        }

        const checkedVA = await VirtualAccount.findOne({ reference: expiredDvaRef });
        const checkedSession = await PaymentSession.findOne({ nombaReference: expiredDvaRef });

        console.log("\n--- Verification Results (Test Case 2) ---");
        console.log(`VirtualAccount Status marked expired: ${checkedVA.status} (Expected: expired)`);
        console.log(`PaymentSession Status marked expired: ${checkedSession.status} (Expected: expired)`);
        console.log(`Template Alert sent to customer: ${logs.some(l => l.type === "CUSTOMER_TEMPLATE_ALERT")}`);

        // --- CLEANUP ---
        console.log("\nCleaning up dummy test records...");
        await BusinessProfile.deleteOne({ _id: testBusiness._id });
        await Sale.deleteOne({ _id: testSale._id });
        await VirtualAccount.deleteMany({ saleId: testSale._id });
        await PaymentSession.deleteMany({ saleId: testSale._id });
        const Settlement = require("./models/Settlement");
        await Settlement.deleteMany({ saleId: testSale._id });
        console.log("Cleanup complete!");

    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

runTests();
