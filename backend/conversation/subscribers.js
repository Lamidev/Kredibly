const WorkflowEventBus = require("./WorkflowEventBus");
const MessageDispatcher = require("./MessageDispatcher");
const Notification = require("../models/Notification");
const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const { logActivity } = require("../utils/activityLogger");
const { deliverInvoiceToCustomer } = require("../utils/customerInvoiceService");

// ==========================================
// Event: InvoiceCreated
// ==========================================

// 1. Logging and DB Notifications
WorkflowEventBus.subscribe("InvoiceCreated", async (payload) => {
    const { saleId, businessId, totalAmount, customerName } = payload;

    try {
        await Notification.create({
            businessId,
            title: "Invoice Created via Kreddy",
            message: `₦${totalAmount.toLocaleString()} invoice created for ${customerName}.`,
            type: "sale",
            saleId
        });

        const sale = await Sale.findById(saleId);
        const invoiceNum = sale ? sale.invoiceNumber : "N/A";

        await logActivity({
            businessId,
            action: "SALE_CREATED_WHATSAPP",
            entityType: "SALE",
            entityId: saleId,
            details: `Invoice #${invoiceNum} created for ${customerName} via Kreddy`
        });
    } catch (err) {
        console.error("🚨 [Subscriber] Error logging invoice creation activity:", err);
    }
});

// 2. Staff Oga Notification
WorkflowEventBus.subscribe("InvoiceCreated", async (payload) => {
    const { businessId, isStaff, cleanFrom, totalAmount, customerName } = payload;

    if (!isStaff) return;

    try {
        const profile = await BusinessProfile.findById(businessId);
        if (profile && profile.whatsappNumber) {
            const sale = await Sale.findById(payload.saleId);
            const invoiceNum = sale ? sale.invoiceNumber : "N/A";

            await MessageDispatcher.send(
                profile.whatsappNumber,
                `📢 *Staff Activity:* ${cleanFrom} created Invoice #${invoiceNum} for ${customerName} (₦${totalAmount.toLocaleString()}).`
            );
        }
    } catch (err) {
        console.error("🚨 [Subscriber] Error notifying staff manager:", err);
    }
});

// 3. Async PDF Invoice Delivery & Reminders Scheduling
WorkflowEventBus.subscribe("InvoiceCreated", async (payload) => {
    const { saleId, businessId, from, customerPhone, customerName } = payload;

    if (!customerPhone) return;

    try {
        const result = await deliverInvoiceToCustomer(saleId, businessId, { customerPhone });
        if (!result.success) {
            await MessageDispatcher.send(
                from,
                `I had trouble delivering the invoice to ${customerName}'s WhatsApp. Check the number and try sending manually from the dashboard.`
            );
        }
    } catch (err) {
        console.error("🚨 [Subscriber] Error delivering PDF invoice to customer:", err);
        try {
            await MessageDispatcher.send(
                from,
                `I had trouble delivering the invoice to ${customerName}'s WhatsApp. Check the number and try sending manually from the dashboard.`
            );
        } catch (e) {
            console.error("🚨 Failed to send failure notification to merchant:", e);
        }
    }
});

// 4. Update long-term conversation memory on invoice creation
WorkflowEventBus.subscribe("InvoiceCreated", async (payload) => {
    const { businessId, customerName, customerPhone, items, totalAmount } = payload;
    if (!businessId) return;

    try {
        const ConversationMemory = require("../models/ConversationMemory");
        let memory = await ConversationMemory.findOne({ businessId });
        if (!memory) {
            memory = new ConversationMemory({ businessId });
        }

        // Update customer memory
        if (customerName && customerPhone) {
            const cleanPhone = customerPhone.replace(/\D/g, "");
            const nameLower = customerName.toLowerCase().trim();
            const existingCust = memory.customers.find(c => c.name.toLowerCase().trim() === nameLower);
            if (existingCust) {
                existingCust.phone = cleanPhone;
                existingCust.frequency += 1;
                existingCust.lastInteractionAt = new Date();
            } else {
                memory.customers.push({
                    name: customerName,
                    phone: cleanPhone,
                    frequency: 1,
                    lastInteractionAt: new Date()
                });
            }
        }

        // Update products memory
        if (items && items.length > 0) {
            items.forEach(item => {
                if (!item.name) return;
                const prodName = item.name.toLowerCase().trim();
                const existingProd = memory.products.find(p => p.name.toLowerCase().trim() === prodName);
                if (existingProd) {
                    existingProd.frequency += 1;
                    if (item.unitPrice) {
                        existingProd.defaultPrice = item.unitPrice;
                    }
                } else {
                    memory.products.push({
                        name: item.name,
                        defaultPrice: item.unitPrice || (totalAmount / items.length),
                        frequency: 1
                    });
                }
            });
        }

        await memory.save();
        console.log(`🧠 [Subscriber] Updated conversation memory for businessId: ${businessId}`);
    } catch (err) {
        console.error("🚨 [Subscriber] Error updating conversation memory:", err);
    }
});

// ==========================================
// Event: WorkflowCancelled
// ==========================================
// Snapshot the cancelled draft into ConversationMemory.lastDraft so the merchant
// can ask "what amount did I enter?" and Kreddy can answer without AI guessing.

WorkflowEventBus.subscribe("WorkflowCancelled", async (payload) => {
    const { businessId, workflowType, draftData } = payload;
    if (!businessId || !draftData) return;

    try {
        const ConversationMemory = require("../models/ConversationMemory");
        let memory = await ConversationMemory.findOne({ businessId });
        if (!memory) memory = new ConversationMemory({ businessId });

        memory.saveLastDraft(workflowType || "unknown", "cancelled", draftData);
        await memory.save();
        console.log(`🧠 [Subscriber] Saved cancelled draft snapshot to memory for businessId: ${businessId}`);
    } catch (err) {
        console.error("🚨 [Subscriber] Error saving cancelled draft to memory:", err);
    }
});

// ==========================================
// Event: WorkflowCompleted
// ==========================================
// Also snapshot completed drafts — merchants sometimes ask "what did I just send?"

WorkflowEventBus.subscribe("WorkflowCompleted", async (payload) => {
    const { businessId, workflowType, draftData } = payload;
    if (!businessId || !draftData) return;

    try {
        const ConversationMemory = require("../models/ConversationMemory");
        let memory = await ConversationMemory.findOne({ businessId });
        if (!memory) memory = new ConversationMemory({ businessId });

        memory.saveLastDraft(workflowType || "unknown", "completed", draftData);
        await memory.save();
        console.log(`🧠 [Subscriber] Saved completed draft snapshot to memory for businessId: ${businessId}`);
    } catch (err) {
        console.error("🚨 [Subscriber] Error saving completed draft to memory:", err);
    }
});

// ==========================================
// Event: ProspectPromoted
// ==========================================
// Sets up ConversationContext and ConversationMemory for the promoted merchant.

WorkflowEventBus.subscribe("ProspectPromoted", async (payload) => {
    const { profile, prospect } = payload;
    if (!profile || !profile.whatsappNumber) return;

    const cleanFrom = profile.whatsappNumber;
    const businessId = profile._id;

    try {
        const ConversationContext = require("../models/ConversationContext");
        const ConversationMemory = require("../models/ConversationMemory");

        // 1. Ensure ConversationContext is set up for the new merchant workspace
        let context = await ConversationContext.findOne({ whatsappNumber: cleanFrom });
        if (context) {
            context.businessId = businessId;
            // Reset to free conversation if they were in the middle of prospect demo
            if (context.workflowId === "prospect_demo" || context.mode === "active_workflow") {
                context.mode = "free_conversation";
                context.workflowId = null;
                context.step = null;
                context.data = {};
            }
            await context.save();
        } else {
            context = new ConversationContext({
                whatsappNumber: cleanFrom,
                businessId: businessId,
                mode: "free_conversation"
            });
            await context.save();
        }

        // 2. Ensure ConversationMemory exists
        let memory = await ConversationMemory.findOne({ businessId: businessId });
        if (!memory) {
            memory = new ConversationMemory({
                businessId: businessId,
                exchanges: []
            });
            await memory.save();
        }
        console.log(`🚀 [Subscriber] Converted Conversation Context & Memory for promoted merchant workspace: ${businessId}`);
    } catch (err) {
        console.error("🚨 [Subscriber] Error handling ProspectPromoted event:", err);
    }
});
