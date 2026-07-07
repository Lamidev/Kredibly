const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Require V2 bootstrap to register workflows
require("./conversation/bootstrap");
const ConversationContext = require("./models/ConversationContext");
const ConversationGateway = require("./conversation/ConversationGateway");
const MessageDispatcher = require("./conversation/MessageDispatcher");
const Sale = require("./models/Sale");
const BusinessProfile = require("./models/BusinessProfile");

// Mock MessageDispatcher senders to log to console
MessageDispatcher.send = async (to, text) => {
    console.log(`\n📤 [Outbound text to ${to}]:`);
    console.log(text);
    return true;
};
MessageDispatcher.sendButtons = async (to, header, body, footer, buttons) => {
    console.log(`\n📤 [Outbound buttons to ${to}]:`);
    if (header) console.log(`Header: ${header}`);
    console.log(body);
    if (footer) console.log(`Footer: ${footer}`);
    console.log("Buttons:", buttons.map(b => `[${b.title} (${b.id})]`).join(" "));
    return true;
};

// Helper to initialize the customer extension workflow context
async function startCustomerExtensionWorkflow(saleId, customerPhone) {
    const sale = await Sale.findById(saleId).populate("businessId");
    const WorkflowQueue = require("./conversation/WorkflowQueue");
    await WorkflowQueue.enqueue(
        customerPhone,
        sale.businessId._id,
        "customer_extension",
        "awaiting_duration",
        "HIGH",
        {
            saleId: saleId.toString(),
            customerName: sale.customerName,
            invoiceNumber: sale.invoiceNumber,
            businessId: sale.businessId._id.toString(),
            merchantPhone: sale.businessId.whatsappNumber
        },
        30
    );
}

async function testFlows() {
    console.log("🚀 Starting V2 Workflow State Engine Verification Tests...");

    const testMerchantNumber = "2348000000000";
    const testCustomerNumber = "2348111111111";

    // 1. Create/Ensure Test Merchant Profile
    let profile = await BusinessProfile.findOne({ whatsappNumber: testMerchantNumber });
    if (!profile) {
        profile = new BusinessProfile({
            whatsappNumber: testMerchantNumber,
            displayName: "Mega Stores",
            plan: "oga",
            planStatus: "active"
        });
        await profile.save();
    }

    // Clean up active contexts and past sales
    await ConversationContext.deleteMany({ whatsappNumber: { $in: [testMerchantNumber, testCustomerNumber] } });
    await Sale.deleteMany({ recordedBy: testMerchantNumber });

    console.log("\n--- Scenario 1: Merchant Records a Sale (total 100k, paid 0) ---");
    // Mock the AI response object for "create_sale" intent
    const aiResponseItem = {
        intent: "create_sale",
        data: {
            customerName: "Obinna",
            totalAmount: 100000,
            paidAmount: 0,
            item: "Designer Suit",
            dueDate: null,
            invoiceType: "billing",
            customerPhone: null // missing phone!
        }
    };

    const resolvedName = aiResponseItem.data.customerName;
    const cleanFrom = testMerchantNumber;
    const from = testMerchantNumber;
    const isStaff = false;

    console.log("🤖 Simulated AI returns 'create_sale' intent. Starting workflow...");
    const WorkflowQueue = require("./conversation/WorkflowQueue");
    const WorkflowRegistry = require("./conversation/WorkflowRegistry");

    const pendingData = {
        customerName: resolvedName,
        totalAmount: aiResponseItem.data.totalAmount,
        paidAmount: aiResponseItem.data.paidAmount || 0,
        items: [],
        item: aiResponseItem.data.item || "Purchase",
        dueDate: null,
        invoiceType: "billing",
        customerPhone: null
    };

    const workflowState = await WorkflowQueue.enqueue(
        cleanFrom,
        profile._id,
        "invoice_creation",
        "awaiting_customer_phone",
        "HIGH",
        pendingData,
        20
    );

    const handler = WorkflowRegistry.getHandler("invoice_creation");
    await handler.proceedToInvoiceSummary(from, cleanFrom, profile, isStaff, pendingData, workflowState);

    console.log("\n--- Scenario 2: Gateway Intercepts Merchant supplying phone number ---");
    const msgPhone = {
        from: testMerchantNumber,
        type: "text",
        text: { body: "08082366322" }
    };
    const handledPhone = await ConversationGateway.receive(msgPhone, profile, {
        from: testMerchantNumber,
        cleanFrom: testMerchantNumber,
        text: "08082366322",
        msgType: "text",
        bossTitle: "Boss",
        isStaff: false
    });
    console.log("Gateway Handled? (Expect true):", handledPhone);

    console.log("\n--- Scenario 3: Gateway Intercepts Merchant editing invoice total to 120k ---");
    const msgEdit = {
        from: testMerchantNumber,
        type: "text",
        text: { body: "price is 120k" }
    };
    const handledEdit = await ConversationGateway.receive(msgEdit, profile, {
        from: testMerchantNumber,
        cleanFrom: testMerchantNumber,
        text: "price is 120k",
        msgType: "text",
        bossTitle: "Boss",
        isStaff: false
    });
    console.log("Gateway Handled? (Expect true):", handledEdit);

    console.log("\n--- Scenario 4: Gateway Intercepts Merchant confirming the invoice ---");
    const msgConfirm = {
        from: testMerchantNumber,
        type: "interactive",
        interactive: {
            button_reply: { id: "invoice_yes", title: "Send Invoice" }
        }
    };
    const handledConfirm = await ConversationGateway.receive(msgConfirm, profile, {
        from: testMerchantNumber,
        cleanFrom: testMerchantNumber,
        text: "invoice_yes",
        msgType: "interactive",
        bossTitle: "Boss",
        isStaff: false
    });
    console.log("Gateway Handled? (Expect true):", handledConfirm);

    // Verify sale was created in the DB
    const createdSale = await Sale.findOne({ recordedBy: testMerchantNumber });
    console.log("\nCreated Sale in DB:", createdSale ? `Invoice #${createdSale.invoiceNumber}, Total: ₦${createdSale.totalAmount.toLocaleString()}, Customer Phone: +${createdSale.customerPhone}` : "FAILED");

    console.log("\n--- Scenario 5: Customer Requests extension (+3 Days) ---");
    await startCustomerExtensionWorkflow(createdSale._id, testCustomerNumber);

    console.log("\n🤖 Customer clicks '+3 Days' button...");
    const msgExt3Days = {
        from: testCustomerNumber,
        type: "interactive",
        interactive: {
            button_reply: { id: `ext_3days:${createdSale._id}`, title: "+3 Days" }
        }
    };
    const handledExt3Days = await ConversationGateway.receive(msgExt3Days, null, {
        from: testCustomerNumber,
        cleanFrom: testCustomerNumber,
        text: `ext_3days:${createdSale._id}`,
        msgType: "interactive",
        bossTitle: "Customer",
        isStaff: false
    });
    console.log("Gateway Handled? (Expect true):", handledExt3Days);

    console.log("\n--- Scenario 6: Customer requesting Custom Date extension ---");
    await ConversationContext.deleteMany({ whatsappNumber: testCustomerNumber });
    await startCustomerExtensionWorkflow(createdSale._id, testCustomerNumber);

    console.log("\n🤖 Customer clicks 'Custom Date' button...");
    const msgExtCustom = {
        from: testCustomerNumber,
        type: "interactive",
        interactive: {
            button_reply: { id: `ext_custom:${createdSale._id}`, title: "Custom Date" }
        }
    };
    await ConversationGateway.receive(msgExtCustom, null, {
        from: testCustomerNumber,
        cleanFrom: testCustomerNumber,
        text: `ext_custom:${createdSale._id}`,
        msgType: "interactive",
        bossTitle: "Customer",
        isStaff: false
    });

    console.log("\n🤖 Customer replies with date '24 July'...");
    const msgDateText = {
        from: testCustomerNumber,
        type: "text",
        text: { body: "24 July" }
    };
    await ConversationGateway.receive(msgDateText, null, {
        from: testCustomerNumber,
        cleanFrom: testCustomerNumber,
        text: "24 July",
        msgType: "text",
        bossTitle: "Customer",
        isStaff: false
    });

    console.log("\n🤖 Customer enters reason 'waiting for salary'...");
    const msgReasonText = {
        from: testCustomerNumber,
        type: "text",
        text: { body: "waiting for salary" }
    };
    await ConversationGateway.receive(msgReasonText, null, {
        from: testCustomerNumber,
        cleanFrom: testCustomerNumber,
        text: "waiting for salary",
        msgType: "text",
        bossTitle: "Customer",
        isStaff: false
    });

    console.log("\n--- Scenario 7: Merchant receives approval decision and clicks APPROVE ---");
    const merchantExtContext = await ConversationContext.findOne({ whatsappNumber: testMerchantNumber, workflowId: "merchant_extension" });
    console.log("Merchant Workflow Context Active? (Expect true):", !!merchantExtContext);

    const msgApprove = {
        from: testMerchantNumber,
        type: "interactive",
        interactive: {
            button_reply: { id: `ext_approve:${createdSale._id}`, title: "Approve" }
        }
    };
    const handledApprove = await ConversationGateway.receive(msgApprove, profile, {
        from: testMerchantNumber,
        cleanFrom: testMerchantNumber,
        text: `ext_approve:${createdSale._id}`,
        msgType: "interactive",
        bossTitle: "Boss",
        isStaff: false
    });
    console.log("Gateway Handled? (Expect true):", handledApprove);

    // Verify updated Sale due date in DB
    const finalSale = await Sale.findById(createdSale._id);
    console.log("Updated Sale Due Date in DB:", finalSale.dueDate ? finalSale.dueDate.toLocaleDateString("en-NG") : "FAILED");

    console.log("\n🎉 V2 Workflow Engine Tests Completed Successfully.");
    process.exit(0);
}

mongoose.connect(process.env.MONGODB_URL).then(() => testFlows());
