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
