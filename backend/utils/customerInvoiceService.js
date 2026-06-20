/**
 * Kreddy AI - Customer Invoice Service
 * 
 * Handles all customer-facing WhatsApp interactions for invoice delivery,
 * payment collection, extension requests, and lifecycle management.
 * 
 * Flow:
 *   Merchant creates invoice → Kreddy sends to customer via WhatsApp
 *   Customer sees: PDF + interactive buttons [Pay Now] [Request Extension]
 *   Customer interaction → Kreddy routes to appropriate handler
 *   Payment detected → Kreddy notifies both customer and merchant
 */

const axios = require("axios");
const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
const WhatsAppSession = require("../models/WhatsAppSession");
const { generateAndUploadInvoicePDF } = require("./pdfGenerator");
const { logActivity } = require("./activityLogger");

const APP_URL = process.env.FRONTEND_URL || "https://usekredibly.com";

// ─── WhatsApp API helpers ──────────────────────────────────────────────────────

const getWACredentials = () => ({
    phoneId: process.env.WHATSAPP_PHONE_ID || process.env.PHONE_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN
});

const normalizePhone = (num) => {
    if (!num) return num;
    let clean = String(num).replace(/\D/g, "");
    if (clean.startsWith("0") && clean.length === 11) clean = "234" + clean.slice(1);
    return clean;
};

/**
 * Send a plain text message to a WhatsApp number.
 */
const sendText = async (to, text) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);
    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "text",
                text: { body: text, preview_url: false }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error("❌ sendText Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Sends a message to a customer with automatic template fallback if the 24-hour window is closed.
 */
const sendCustomerMessageWithFallback = async (to, text, customerName, invoiceNumber = null) => {
    if (invoiceNumber) {
        // ALWAYS use template message for invoice links to avoid naked links
        const templateName = 'kreddy_system_alert';
        const cleanMsg = String(text)
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s\s+/g, ' ')
            .trim()
            .substring(0, 1024);

        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: String(customerName || "Customer").substring(0, 60) },
                    { type: "text", text: cleanMsg }
                ]
            },
            {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                    { type: "text", text: `i/${invoiceNumber}` }
                ]
            }
        ];
        return await sendTemplateMsg(to, templateName, components);
    }

    // For other messages (e.g. no invoice link), send text and fallback to simple alert template if needed
    const success = await sendText(to, text);
    if (success) return true;

    console.log(`⚠️ Free-form message failed to deliver to customer ${to}. Attempting template fallback (kreddy_simple_alert)...`);
    const templateName = 'kreddy_simple_alert';
    const cleanMsg = String(text)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s\s+/g, ' ')
        .trim()
        .substring(0, 1024);

    const components = [
        {
            type: "body",
            parameters: [
                { type: "text", text: String(customerName || "Customer").substring(0, 60) },
                { type: "text", text: cleanMsg }
            ]
        }
    ];
    return await sendTemplateMsg(to, templateName, components);
};

/**
 * Send a WhatsApp document (PDF) message with optional caption.
 */
const sendDocument = async (to, pdfUrl, filename, caption = "") => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);
    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "document",
                document: {
                    link: pdfUrl,
                    filename: filename,
                    caption: caption
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
        );
        return true;
    } catch (err) {
        console.error("❌ sendDocument Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Send an interactive message with reply buttons (max 3 buttons).
 * Used for customer-facing messages like invoice delivery and extension requests.
 */
const sendInteractiveButtons = async (to, headerText, bodyText, footerText, buttons) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);

    // buttons: [{ id: "pay_now", title: "💳 Pay Now" }, ...]
    const waButtons = buttons.map(btn => ({
        type: "reply",
        reply: { id: btn.id, title: btn.title.substring(0, 20) }
    }));

    const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "interactive",
        interactive: {
            type: "button",
            header: headerText ? {
                type: "text",
                text: headerText.substring(0, 60)
            } : undefined,
            body: { text: bodyText.substring(0, 1024) },
            footer: footerText ? { text: footerText.substring(0, 60) } : undefined,
            action: { buttons: waButtons }
        }
    };

    // Remove undefined keys
    if (!payload.interactive.header) delete payload.interactive.header;
    if (!payload.interactive.footer) delete payload.interactive.footer;

    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            payload,
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error("❌ sendInteractiveButtons Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Send a WhatsApp template message (for when the 24h session window is closed).
 */
const sendTemplateMsg = async (to, templateName, components = []) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);
    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en" },
                    components
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
        );
        return true;
    } catch (err) {
        console.error(`❌ sendTemplateMsg [${templateName}] Error:`, err.response?.data || err.message);
        return false;
    }
};

// ─── Core Invoice Delivery ─────────────────────────────────────────────────────

/**
 * Deliver an invoice to a customer via WhatsApp.
 * 1. Generates the PDF and uploads to Cloudinary
 * 2. Sends the PDF as a document
 * 3. Sends a follow-up interactive message with [Pay Now] [Request Extension] buttons
 * 4. Updates the sale's lifecycleStatus to DELIVERED
 * 5. Schedules automated customer reminders
 * 6. Notifies the merchant that delivery was successful
 */
const deliverInvoiceToCustomer = async (saleId, businessId, options = {}) => {
    try {
        const sale = await Sale.findById(saleId);
        if (!sale) throw new Error("Sale not found");

        const business = await BusinessProfile.findById(businessId);
        if (!business) throw new Error("Business not found");

        const customerPhone = options.customerPhone || sale.customerPhone || sale.deliveredToPhone;
        if (!customerPhone) throw new Error("Customer phone number required");

        const cleanCustomerPhone = normalizePhone(customerPhone);

        // Step 1: Generate PDF
        console.log(`📄 Generating PDF for Invoice ${sale.invoiceNumber}...`);
        const pdfUrl = await generateAndUploadInvoicePDF(sale, business);

        if (pdfUrl) {
            // Save PDF URL on the sale
            await Sale.findByIdAndUpdate(saleId, { pdfUrl });
        }

        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);
        const paymentLink = `${APP_URL}/i/${sale.invoiceNumber}`;
        const businessName = business.displayName || "Your Merchant";
        const hasDueDate = !!sale.dueDate;
        const dueDateFormatted = hasDueDate
            ? new Date(sale.dueDate).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
            : null;
        const hasPartialPayment = (sale.payments || []).length > 0 && bal > 0 && bal < sale.totalAmount;
        const isFullyUnpaid = bal >= sale.totalAmount;

        // Step 2: Send PDF document (if successfully generated)
        if (pdfUrl) {
            const docCaption = `Invoice from ${businessName} — ₦${sale.totalAmount.toLocaleString()}`;
            const docSent = await sendDocument(
                cleanCustomerPhone,
                pdfUrl,
                `Invoice-${sale.invoiceNumber}.pdf`,
                docCaption
            );
            console.log(`📄 PDF send to customer ${cleanCustomerPhone}: ${docSent ? '✅ sent' : '❌ failed'}`);
            // Small delay so PDF arrives first
            await new Promise(r => setTimeout(r, 1500));
        }

        // Step 3: Build context-aware customer message
        const itemsText = sale.items && sale.items.length > 0
            ? sale.items.map(i => `${i.name} × ${i.quantity || 1} — ₦${((i.unitPrice || 0) * (i.quantity || 1)).toLocaleString()}`).join("\n")
            : `${sale.description || "Purchase"} — ₦${sale.totalAmount.toLocaleString()}`;

        // Build the summary lines context-aware
        const summaryLines = [
            `Hello ${sale.customerName}!`,
            ``,
            `You have ${hasPartialPayment ? "an outstanding balance" : "a new invoice"} from *${businessName}*.`,
            ``,
            itemsText,
            ``,
            `Invoice Total: ₦${sale.totalAmount.toLocaleString()}`,
            hasPartialPayment ? `Already Paid: ₦${(sale.totalAmount - bal).toLocaleString()}` : null,
            hasPartialPayment || isFullyUnpaid ? `Amount Due: *₦${bal.toLocaleString()}*` : null,
            hasDueDate ? `Payment Due: ${dueDateFormatted}` : `Payment Due: On receipt`,
            ``,
            `Tap a button below to take action:`
        ].filter(v => v !== null).join("\n");

        let btnSent = false;
        if (bal > 0) {
            btnSent = await sendInteractiveButtons(
                cleanCustomerPhone,
                `Invoice #${sale.invoiceNumber}`,
                summaryLines,
                "",
                [
                    { id: `pay_now:${sale._id}`, title: "Pay Now" },
                    { id: `req_ext:${sale._id}`, title: "Request Extension" }
                ]
            );
            console.log(`🔘 Interactive buttons to customer ${cleanCustomerPhone}: ${btnSent ? '✅ sent' : '❌ failed'}`);
            if (!btnSent) {
                // Fallback: send template message since free-form/interactive failed (e.g. 24h window closed)
                console.log(`⚠️ Interactive buttons failed for customer ${cleanCustomerPhone}. Sending template message fallback...`);
                await sendCustomerMessageWithFallback(
                    cleanCustomerPhone,
                    summaryLines,
                    sale.customerName,
                    sale.invoiceNumber
                );
            }
        } else {
            console.log(`ℹ️ Invoice fully settled (balance: 0). Skipping action buttons for customer.`);
            await sendCustomerMessageWithFallback(
                cleanCustomerPhone,
                `Hello ${sale.customerName}! Your payment has been received and confirmed. Please find your invoice receipt attached.`,
                sale.customerName,
                sale.invoiceNumber
            );
        }

        // Step 4: Update sale lifecycle
        await Sale.findByIdAndUpdate(saleId, {
            lifecycleStatus: "DELIVERED",
            deliveredToPhone: cleanCustomerPhone,
            customerDeliveredAt: new Date()
        });

        // Step 5: Schedule customer payment reminders
        await scheduleCustomerReminders(sale, business, cleanCustomerPhone);

        // Step 6: Build context-aware merchant delivery confirmation
        const merchantSummaryLines = [
            `Invoice sent to *${sale.customerName}* (+${cleanCustomerPhone}).`,
            ``,
            `Invoice #${sale.invoiceNumber}`,
            `Total: ₦${sale.totalAmount.toLocaleString()}`,
            hasPartialPayment ? `Already paid: ₦${(sale.totalAmount - bal).toLocaleString()}` : null,
            `Balance due: ₦${bal.toLocaleString()}`,
            hasDueDate ? `Due date: ${dueDateFormatted}` : `Due: On receipt`,
            ``,
            `I'll send them automatic reminders${hasDueDate ? ` and a final nudge on the due date` : ""}. You'll be notified if they respond.`
        ].filter(v => v !== null).join("\n");

        const merchantPhone = business.whatsappNumber;
        if (merchantPhone) {
            const merchantMsgSent = await sendText(merchantPhone, merchantSummaryLines);
            console.log(`📩 Merchant delivery notification to ${merchantPhone}: ${merchantMsgSent ? '✅ sent' : '❌ failed'}`);

            // Send the PDF to the merchant right after the summary text
            if (pdfUrl) {
                await new Promise(r => setTimeout(r, 800)); // small gap so text arrives first
                const merchantPdfSent = await sendDocument(
                    merchantPhone,
                    pdfUrl,
                    `Invoice-${sale.invoiceNumber}.pdf`,
                    `Your copy of Invoice #${sale.invoiceNumber} for ${sale.customerName}`
                );
                console.log(`📄 PDF copy to merchant ${merchantPhone}: ${merchantPdfSent ? '✅ sent' : '❌ failed'}`);
            }
        }

        await Notification.create({
            businessId: business._id,
            title: "Invoice Delivered",
            message: `Invoice #${sale.invoiceNumber} sent to ${sale.customerName} via WhatsApp.`,
            type: "system",
            saleId: sale._id
        });

        await logActivity({
            businessId: business._id,
            action: "INVOICE_DELIVERED_CUSTOMER",
            entityType: "SALE",
            entityId: sale._id,
            details: `Invoice #${sale.invoiceNumber} delivered to customer ${cleanCustomerPhone}`
        });

        return { success: true, pdfUrl };

    } catch (err) {
        console.error("❌ deliverInvoiceToCustomer Error:", err.message);
        return { success: false, error: err.message };
    }
};

// ─── Customer Reminder Scheduling ─────────────────────────────────────────────

/**
 * Schedule automated customer payment reminder sequence.
 * Reminders: 24h after delivery, 48h after delivery, on due date (if set).
 */
const scheduleCustomerReminders = async (sale, business, customerPhone) => {
    try {
        const now = new Date();
        const saleId = sale._id;
        const businessId = business._id;
        const merchantPhone = business.whatsappNumber;

        const remindersToCreate = [];

        // Reminder 1: 24 hours after delivery
        remindersToCreate.push({
            businessId,
            whatsappNumber: merchantPhone, // business context
            recipientType: "customer",
            recipientPhone: customerPhone,
            description: `Customer payment reminder for Invoice #${sale.invoiceNumber} — ${sale.customerName}`,
            type: "debt",
            triggerDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            saleId,
            reminderSequence: 1
        });

        // Reminder 2: 48 hours after delivery
        remindersToCreate.push({
            businessId,
            whatsappNumber: merchantPhone,
            recipientType: "customer",
            recipientPhone: customerPhone,
            description: `Customer payment reminder for Invoice #${sale.invoiceNumber} — ${sale.customerName}`,
            type: "debt",
            triggerDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
            saleId,
            reminderSequence: 2
        });

        // Reminder 3: on/near due date (if set and in future)
        if (sale.dueDate) {
            const dueReminderDate = new Date(sale.dueDate);
            dueReminderDate.setHours(9, 0, 0, 0); // 9 AM on due date
            if (dueReminderDate > new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
                remindersToCreate.push({
                    businessId,
                    whatsappNumber: merchantPhone,
                    recipientType: "customer",
                    recipientPhone: customerPhone,
                    description: `DUE TODAY: Customer payment reminder for Invoice #${sale.invoiceNumber} — ${sale.customerName}`,
                    type: "debt",
                    triggerDate: dueReminderDate,
                    saleId,
                    reminderSequence: 3
                });
            }
        }

        await Reminder.insertMany(remindersToCreate);
        console.log(`📅 Scheduled ${remindersToCreate.length} customer reminders for Invoice #${sale.invoiceNumber}`);
    } catch (err) {
        console.error("❌ scheduleCustomerReminders Error:", err.message);
    }
};

/**
 * Cancel all pending customer reminders for a sale (called on full payment).
 */
const cancelCustomerReminders = async (saleId) => {
    try {
        const result = await Reminder.updateMany(
            { saleId, recipientType: "customer", status: "pending" },
            { status: "cancelled" }
        );
        console.log(`🛑 Cancelled ${result.modifiedCount} customer reminders for Sale ${saleId}`);
    } catch (err) {
        console.error("❌ cancelCustomerReminders Error:", err.message);
    }
};

// ─── Customer Interaction Handlers ────────────────────────────────────────────

/**
 * Handle a [Pay Now] button press from a customer.
 * Sends them the payment link in a clean message.
 */
const handleCustomerPayNow = async (saleId, customerPhone) => {
    try {
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const business = sale.businessId;
        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);

        if (bal <= 0) {
            await sendText(customerPhone, `Great news! This invoice *#${sale.invoiceNumber}* has already been fully paid. Thank you!`);
            return;
        }

        const cleanCustomerPhone = normalizePhone(customerPhone);
        const paymentMsg = `Ready to make payment for Invoice #${sale.invoiceNumber}? Tap the button below to pay securely online. Amount Due: *₦${bal.toLocaleString()}*`;
        
        // Use template message with URL button (no naked links!)
        const templateName = 'kreddy_system_alert';
        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: String(sale.customerName || "Customer").substring(0, 60) },
                    { type: "text", text: paymentMsg }
                ]
            },
            {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                    { type: "text", text: `i/${sale.invoiceNumber}` }
                ]
            }
        ];
        
        await sendTemplateMsg(cleanCustomerPhone, templateName, components);
    } catch (err) {
        console.error("❌ handleCustomerPayNow Error:", err.message);
    }
};

/**
 * Handle a [Request Extension] button press from a customer.
 * Shows them duration options (interactive buttons).
 */
const handleCustomerRequestExtension = async (saleId, customerPhone) => {
    try {
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        // Save session so we know what invoice extension is being requested
        await WhatsAppSession.findOneAndUpdate(
            { whatsappNumber: normalizePhone(customerPhone) },
            {
                type: "customer_extension_duration",
                data: {
                    saleId: saleId.toString(),
                    customerName: sale.customerName,
                    invoiceNumber: sale.invoiceNumber,
                    businessId: sale.businessId?._id?.toString(),
                    merchantPhone: sale.businessId?.whatsappNumber
                },
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            },
            { upsert: true, new: true }
        );

        await sendInteractiveButtons(
            customerPhone,
            "Payment Extension",
            `Hi ${sale.customerName}! How much more time do you need to settle Invoice *#${sale.invoiceNumber}* (₦${sale.totalAmount.toLocaleString()})?`,
            "Your merchant will be notified immediately",
            [
                { id: `ext_3days:${saleId}`, title: "3 More Days" },
                { id: `ext_1week:${saleId}`, title: "1 More Week" },
                { id: `ext_2weeks:${saleId}`, title: "2 More Weeks" }
            ]
        );
    } catch (err) {
        console.error("❌ handleCustomerRequestExtension Error:", err.message);
    }
};

/**
 * Handle customer selecting an extension duration.
 * Notifies the merchant with [Approve] [Reject] buttons.
 */
const handleCustomerExtensionDuration = async (saleId, days, customerPhone, customerName) => {
    try {
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const business = sale.businessId;
        const daysNum = parseInt(days);

        // Update sale: extension requested
        await Sale.findByIdAndUpdate(saleId, {
            lifecycleStatus: "EXTENSION_REQUESTED",
            extensionRequestedAt: new Date(),
            requestedExtensionDays: daysNum
        });

        // Acknowledge to customer
        await sendText(
            customerPhone,
            `Got it, ${customerName}! I've sent your request for a *${daysNum}-day extension* to ${business?.displayName || "your merchant"}. They will respond shortly.`
        );

        // Notify merchant with [Approve] [Reject] interactive buttons
        const merchantPhone = business?.whatsappNumber;
        if (!merchantPhone) return;

        const requestedDate = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);
        const newDueDateStr = requestedDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });

        // Save session on merchant's number so they can approve/reject
        await WhatsAppSession.findOneAndUpdate(
            { whatsappNumber: normalizePhone(merchantPhone) },
            {
                type: "merchant_extension_approval",
                data: {
                    saleId: saleId.toString(),
                    customerName: sale.customerName,
                    customerPhone: normalizePhone(customerPhone),
                    invoiceNumber: sale.invoiceNumber,
                    requestedDays: daysNum,
                    newDueDate: requestedDate.toISOString(),
                    businessId: business._id.toString()
                },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h to decide
            },
            { upsert: true, new: true }
        );

        await sendInteractiveButtons(
            merchantPhone,
            "Extension Request",
            `*${sale.customerName}* is requesting a *${daysNum}-day payment extension* for Invoice *#${sale.invoiceNumber}* (₦${sale.totalAmount.toLocaleString()}).\n\nNew Due Date would be: *${newDueDateStr}*\n\nDo you approve?`,
            "Reply to notify the customer instantly",
            [
                { id: `ext_approve:${saleId}`, title: "Approve" },
                { id: `ext_reject:${saleId}`, title: "Reject" }
            ]
        );

        await Notification.create({
            businessId: business._id,
            title: "Extension Request",
            message: `${sale.customerName} requested a ${daysNum}-day extension for Invoice #${sale.invoiceNumber}.`,
            type: "system",
            saleId: sale._id
        });

    } catch (err) {
        console.error("❌ handleCustomerExtensionDuration Error:", err.message);
    }
};

/**
 * Handle merchant approving a customer extension request.
 */
const handleMerchantApproveExtension = async (saleId, sessionData) => {
    try {
        const { customerPhone, customerName, invoiceNumber, requestedDays, newDueDate, businessId } = sessionData;
        const daysNum = parseInt(requestedDays);
        const newDate = new Date(newDueDate);

        // Update sale
        await Sale.findByIdAndUpdate(saleId, {
            lifecycleStatus: "EXTENSION_GRANTED",
            dueDate: newDate,
            extensionApprovedAt: new Date()
        });

        // Cancel old customer reminders and reschedule
        await cancelCustomerReminders(saleId);

        const sale = await Sale.findById(saleId);
        const business = await BusinessProfile.findById(businessId);
        if (sale && business) {
            await scheduleCustomerReminders(sale, business, customerPhone);
        }

        const newDueDateStr = newDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

        // Notify customer (with fallback)
        await sendCustomerMessageWithFallback(
            customerPhone,
            `Great news, ${customerName}! Your payment extension has been approved.\n\nNew Due Date: *${newDueDateStr}*\n\nPlease settle Invoice *#${invoiceNumber}* by then. Thank you.`,
            customerName,
            invoiceNumber
        );

        return { success: true };
    } catch (err) {
        console.error("❌ handleMerchantApproveExtension Error:", err.message);
        return { success: false };
    }
};

/**
 * Handle merchant rejecting a customer extension request.
 */
const handleMerchantRejectExtension = async (saleId, sessionData) => {
    try {
        const { customerPhone, customerName, invoiceNumber, businessId } = sessionData;

        await Sale.findByIdAndUpdate(saleId, {
            lifecycleStatus: "EXTENSION_REJECTED"
        });

        const business = await BusinessProfile.findById(businessId);
        const businessName = business?.displayName || "Your merchant";

        // Notify customer (with fallback)
        await sendCustomerMessageWithFallback(
            customerPhone,
            `Hi ${customerName}, unfortunately your payment extension request for Invoice *#${invoiceNumber}* was *not approved* by ${businessName}.\n\nPlease make payment as soon as possible.`,
            customerName,
            invoiceNumber
        );

        return { success: true };
    } catch (err) {
        console.error("❌ handleMerchantRejectExtension Error:", err.message);
        return { success: false };
    }
};

/**
 * Send a payment confirmation to the customer after a successful payment.
 */
const notifyCustomerPaymentReceived = async (saleId, amountPaid) => {
    try {
        let sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const customerPhone = sale.deliveredToPhone || sale.customerPhone;
        if (!customerPhone) return;

        const business = sale.businessId;
        const totalPaid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
        const balance = sale.totalAmount - totalPaid;
        const businessName = business?.displayName || "Your merchant";

        let lifecycleStatus = "PARTIALLY_PAID";
        let msg;
        if (balance <= 0) {
            lifecycleStatus = "PAID";
            msg = `*Payment Confirmed!*\n\nThank you, ${sale.customerName}! Your payment of *₦${amountPaid.toLocaleString()}* for Invoice *#${sale.invoiceNumber}* has been received by ${businessName}.\n\nYour invoice is now *FULLY PAID*. Have a great day!`;
            // Cancel pending customer reminders
            await cancelCustomerReminders(saleId);
        } else {
            msg = `*Partial Payment Received!*\n\nThank you, ${sale.customerName}! Your payment of *₦${amountPaid.toLocaleString()}* for Invoice *#${sale.invoiceNumber}* has been received.\n\nRemaining Balance: *₦${balance.toLocaleString()}*\n\nPlease settle the balance at your earliest convenience by tapping the button below.`;
        }

        // Update database status first so PDF generation reads it
        sale = await Sale.findByIdAndUpdate(saleId, { lifecycleStatus }, { new: true }).populate("businessId");

        // Step 2: Regenerate updated PDF (with stamp PAID or updated balances) and upload to Cloudinary
        console.log(`📄 Regenerating PDF for Invoice ${sale.invoiceNumber} post-payment...`);
        const pdfUrl = await generateAndUploadInvoicePDF(sale, business);
        if (pdfUrl) {
            sale = await Sale.findByIdAndUpdate(saleId, { pdfUrl }, { new: true }).populate("businessId");
        }

        const cleanCustomerPhone = normalizePhone(customerPhone);

        // Step 3: Send the updated PDF document to the customer
        if (sale.pdfUrl) {
            const docCaption = balance <= 0
                ? `*Official Receipt from ${businessName}*\nStatus: Fully Settled`
                : `*Updated Invoice from ${businessName}*\nNew Balance: ₦${balance.toLocaleString()}`;
            
            await sendDocument(
                cleanCustomerPhone,
                sale.pdfUrl,
                `${balance <= 0 ? 'Receipt' : 'Invoice'}-${sale.invoiceNumber}.pdf`,
                docCaption
            );
            // Small delay so PDF arrives first
            await new Promise(r => setTimeout(r, 1500));
        }

        // Step 4: Send the confirmation text message (with template fallback if needed)
        await sendCustomerMessageWithFallback(cleanCustomerPhone, msg, sale.customerName, sale.invoiceNumber);
        console.log(`📩 Payment confirmation sent to customer ${customerPhone} for Invoice #${sale.invoiceNumber}`);
    } catch (err) {
        console.error("❌ notifyCustomerPaymentReceived Error:", err.message);
    }
};

/**
 * Route incoming WhatsApp messages from customers (non-merchants).
 * This is called from the main handleIncoming webhook when the sender
 * is not a registered merchant but has a pending invoice delivered to them.
 */
const handleCustomerInbound = async (from, msgType, message, text) => {
    try {
        const cleanFrom = normalizePhone(from);
        const lowerText = (text || "").toLowerCase().trim();

        // Check for interactive button reply
        if (msgType === "interactive") {
            const buttonReply = message?.interactive?.button_reply;
            if (!buttonReply) return false;

            const { id: buttonId } = buttonReply;

            // [Pay Now] button
            if (buttonId.startsWith("pay_now:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerPayNow(saleId, cleanFrom);
                return true;
            }

            // [Request Extension] button
            if (buttonId.startsWith("req_ext:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerRequestExtension(saleId, cleanFrom);
                return true;
            }

            // Extension duration: 3 days / 1 week / 2 weeks
            if (buttonId.startsWith("ext_3days:") || buttonId.startsWith("ext_1week:") || buttonId.startsWith("ext_2weeks:")) {
                const [prefix, saleId] = buttonId.split(":");
                const daysMap = { "ext_3days": 3, "ext_1week": 7, "ext_2weeks": 14 };
                const days = daysMap[prefix];

                // Get customer name from session or sale
                const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom, type: "customer_extension_duration" });
                const customerName = session?.data?.customerName || "Customer";
                await handleCustomerExtensionDuration(saleId, days, cleanFrom, customerName);
                if (session) await WhatsAppSession.deleteOne({ _id: session._id });
                return true;
            }

            return false;
        }

        // Check for text-based session (customer_extension_duration)
        const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });
        if (session?.type === "customer_extension_duration") {
            // They may have typed a number of days
            const numMatch = lowerText.match(/(\d+)\s*(day|week|month)/i);
            if (numMatch) {
                let days = parseInt(numMatch[1]);
                const unit = numMatch[2].toLowerCase();
                if (unit.startsWith("week")) days *= 7;
                if (unit.startsWith("month")) days *= 30;
                const saleId = session.data.saleId;
                const customerName = session.data.customerName;
                await handleCustomerExtensionDuration(saleId, days, cleanFrom, customerName);
                await WhatsAppSession.deleteOne({ _id: session._id });
                return true;
            }
        }

        // Check if this customer has any active invoice delivered to them
        const activeSale = await Sale.findOne({
            deliveredToPhone: cleanFrom,
            status: { $ne: "paid" },
            lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
        }).sort({ customerDeliveredAt: -1 }).populate("businessId");

        if (activeSale) {
            const bal = activeSale.totalAmount - (activeSale.payments || []).reduce((s, p) => s + p.amount, 0);
            const paymentLink = `${APP_URL}/i/${activeSale.invoiceNumber}`;

            // If they say something about paying, send them the link
            if (/pay|payment|transfer|link|invoice/i.test(lowerText)) {
                await sendText(
                    cleanFrom,
                    `Here is your payment link for Invoice *#${activeSale.invoiceNumber}*:\n\n${paymentLink}\n\nBalance Due: *₦${bal.toLocaleString()}*`
                );
                return true;
            }

            // Generic response with action buttons
            const businessName = activeSale.businessId?.displayName || "Your merchant";
            await sendInteractiveButtons(
                cleanFrom,
                `Invoice #${activeSale.invoiceNumber}`,
                `Hi ${activeSale.customerName}! You have an unpaid invoice from *${businessName}* for *₦${bal.toLocaleString()}*.\n\nHow can I help you?`,
                "",
                [
                    { id: `pay_now:${activeSale._id}`, title: "Pay Now" },
                    { id: `req_ext:${activeSale._id}`, title: "Request Extension" }
                ]
            );
            return true;
        }

        return false; // Not a customer interaction
    } catch (err) {
        console.error("❌ handleCustomerInbound Error:", err.message);
        return false;
    }
};

/**
 * Check if a phone number has any active invoice delivered to them (is a customer).
 */
/**
 * Send an on-demand payment reminder/chase directly to a customer.
 */
const sendChaseToCustomer = async (saleId, businessId, customText = null) => {
    try {
        const sale = await Sale.findById(saleId);
        if (!sale) throw new Error("Sale not found");

        const business = await BusinessProfile.findById(businessId);
        if (!business) throw new Error("Business not found");

        const customerPhone = sale.customerPhone || sale.deliveredToPhone;
        if (!customerPhone) throw new Error("Customer phone number not set on sale");

        const cleanCustomerPhone = normalizePhone(customerPhone);
        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);

        const businessName = business.displayName || "Your Merchant";
        
        const dueText = sale.dueDate
            ? `Due: ${new Date(sale.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
            : "Due: On Receipt";

        const correctBodyText = customText || `Hi ${sale.customerName}!\n\nThis is a friendly reminder from *${businessName}* regarding your outstanding balance of *₦${bal.toLocaleString()}* for Invoice *#${sale.invoiceNumber}*.\n\n${dueText}\n\nTap a button below to take action:`;

        const success = await sendInteractiveButtons(
            cleanCustomerPhone,
            `Invoice Reminder #${sale.invoiceNumber}`,
            correctBodyText,
            "",
            [
                { id: `pay_now:${sale._id}`, title: "Pay Now" },
                { id: `req_ext:${sale._id}`, title: "Request Extension" }
            ]
        );

        if (success) {
            await Sale.findByIdAndUpdate(saleId, {
                $inc: { customerRemindersSent: 1 },
                lastCustomerReminderAt: new Date()
            });

            await logActivity({
                businessId: business._id,
                action: "INVOICE_CHASED_CUSTOMER",
                entityType: "SALE",
                entityId: sale._id,
                details: `On-demand reminder sent to customer ${cleanCustomerPhone} for Invoice #${sale.invoiceNumber}`
            });

            return { success: true };
        } else {
            throw new Error("WhatsApp API send failure");
        }
    } catch (err) {
        console.error("❌ sendChaseToCustomer Error:", err.message);
        return { success: false, error: err.message };
    }
};

const isCustomerPhone = async (phone) => {
    const cleanPhone = normalizePhone(phone);
    const activeSale = await Sale.findOne({
        deliveredToPhone: cleanPhone,
        status: { $ne: "paid" },
        lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
    });
    return !!activeSale;
};

module.exports = {
    deliverInvoiceToCustomer,
    sendChaseToCustomer,
    scheduleCustomerReminders,
    cancelCustomerReminders,
    notifyCustomerPaymentReceived,
    handleCustomerInbound,
    handleCustomerPayNow,
    handleCustomerRequestExtension,
    handleCustomerExtensionDuration,
    handleMerchantApproveExtension,
    handleMerchantRejectExtension,
    isCustomerPhone,
    sendInteractiveButtons,
    sendDocument,
    sendText,
    sendTemplateMsg,
    sendCustomerMessageWithFallback,
    normalizePhone
};
