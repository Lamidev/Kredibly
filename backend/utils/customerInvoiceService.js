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

/**
 * Send the official kreddy_customer_invoice template with a document (PDF) header
 * and body variables matching the Xara customer invoice template.
 */
const sendInvoiceTemplateToCustomer = async (to, sale, business, pdfUrl) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);

    const itemsText = sale.items && sale.items.length > 0
        ? sale.items.map(i => `${i.name} x${i.quantity}`).join(", ")
        : (sale.description || "Purchase");

    const formattedAmount = `₦${sale.totalAmount.toLocaleString()}`;
    const invoiceRef = `#${sale.invoiceNumber}`;
    const businessName = business.displayName || "Our Merchant";

    // Meta requires components in strict order: header → body → button
    const components = [];

    // 1. Header (document / PDF) — must come first
    if (pdfUrl) {
        components.push({
            type: "header",
            parameters: [
                {
                    type: "document",
                    document: {
                        link: pdfUrl,
                        filename: `Invoice-${sale.invoiceNumber}.pdf`
                    }
                }
            ]
        });
    }

    // 2. Body — variables matching the approved template
    components.push({
        type: "body",
        parameters: [
            { type: "text", text: String(sale.customerName || "Customer").substring(0, 60) },
            { type: "text", text: String(businessName).substring(0, 60) },
            { type: "text", text: String(itemsText).substring(0, 1024) },
            { type: "text", text: formattedAmount },
            { type: "text", text: invoiceRef }
        ]
    });

    // 3. Button — dynamic URL suffix
    components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
            { type: "text", text: `${sale.invoiceNumber}` }
        ]
    });

    // 4. Button 1 — Quick Reply (Request Extension)
    const canRequestExt = (sale.extensionsCount || 0) < 2
        && sale.lifecycleStatus !== "EXTENSION_REQUESTED";
    if (canRequestExt) {
        components.push({
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [
                { type: "payload", payload: `req_ext:${sale._id}` }
            ]
        });
    }

    try {
        console.log(`Sending customer invoice template (kreddy_customer_invoice) to ${cleanTo}...`);
        const res = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "template",
                template: {
                    name: "kreddy_customer_invoice",
                    language: { code: "en" },
                    components
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
        );
        return true;
    } catch (err) {
        console.error("❌ sendInvoiceTemplateToCustomer Error:", err.response?.data || err.message);
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

        // Step 2: Send Invoice to customer via template
        const itemsListStr = sale.items && sale.items.length > 0
            ? sale.items.map(i => `${i.name} x${i.quantity}`).join(", ")
            : (sale.description || "Purchase");

        const formattedAmount = `₦${sale.totalAmount.toLocaleString()}`;
        const refStr = `#${sale.invoiceNumber}`;

        const summaryLines = [
            `Hi ${sale.customerName},`,
            ``,
            `*${businessName}* sent you an invoice for *${itemsListStr}*.`,
            ``,
            `*Amount:* ${formattedAmount}`,
            `*Ref:* ${refStr}`,
            ``,
            `Tap "Pay Invoice Now" to complete payment.`
        ].join("\n");

        if (bal > 0) {
            // Always use the kreddy_customer_invoice template directly.
            // Free-form messages (document/interactive) only work when a customer has an
            // open 24h session — new customers never do. Template-first guarantees delivery.
            console.log(`📨 Sending invoice template to customer ${cleanCustomerPhone}...`);
            const tplSent = await sendInvoiceTemplateToCustomer(cleanCustomerPhone, sale, business, pdfUrl);
            console.log(`📨 Template delivery to customer ${cleanCustomerPhone}: ${tplSent ? '✅ sent' : '❌ failed'}`);

            if (!tplSent) {
                // Fallback: general alert template with a payment link button
                console.log(`⚠️ Invoice template failed. Falling back to kreddy_system_alert...`);
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

        // Step 6: Notify the merchant matching the target flow order and copy
        const merchantPhone = business.whatsappNumber;
        if (merchantPhone) {
            // First, send the PDF copy to the merchant
            if (pdfUrl) {
                const merchantPdfSent = await sendDocument(
                    merchantPhone,
                    pdfUrl,
                    `invoice-${sale.invoiceNumber}.pdf`,
                    `Your copy of Invoice #${sale.invoiceNumber} for ${sale.customerName}`
                );
                console.log(`📄 PDF copy to merchant ${merchantPhone}: ${merchantPdfSent ? '✅ sent' : '❌ failed'}`);
                await new Promise(r => setTimeout(r, 800)); // small gap
            }

            // Second, send confirmation text to the merchant
            const merchantConfirmationText = `Invoice #${sale.invoiceNumber} has been sent to ${sale.customerName} (+${cleanCustomerPhone}), you will receive a notification when the payment is confirmed.`;
            const merchantMsgSent = await sendText(merchantPhone, merchantConfirmationText);
            console.log(`📩 Merchant delivery notification to ${merchantPhone}: ${merchantMsgSent ? '✅ sent' : '❌ failed'}`);
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
const scheduleCustomerReminders = async (sale, business, customerPhone, anchorDate = new Date()) => {
    try {
        const saleId = sale._id;
        const businessId = business._id;
        const merchantPhone = business.whatsappNumber;
        const baseDate = new Date(anchorDate);

        const remindersToCreate = [];

        if (sale.dueDate) {
            const dueDate = new Date(sale.dueDate);
            const diffTime = dueDate.getTime() - baseDate.getTime();
            const diffDays = Math.ceil(diffTime / (24 * 60 * 60 * 1000));

            if (diffDays > 7) {
                // Reminder 1: 3 days before due date
                const r1Date = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                r1Date.setHours(9, 0, 0, 0);
                if (r1Date > baseDate) {
                    remindersToCreate.push({
                        businessId,
                        whatsappNumber: merchantPhone,
                        recipientType: "customer",
                        recipientPhone: customerPhone,
                        description: `Friendly reminder: Invoice #${sale.invoiceNumber} is due soon`,
                        type: "debt",
                        triggerDate: r1Date,
                        saleId,
                        reminderSequence: 1
                    });
                }

                // Reminder 2: 1 day before due date
                const r2Date = new Date(dueDate.getTime() - 1 * 24 * 60 * 60 * 1000);
                r2Date.setHours(9, 0, 0, 0);
                if (r2Date > baseDate) {
                    remindersToCreate.push({
                        businessId,
                        whatsappNumber: merchantPhone,
                        recipientType: "customer",
                        recipientPhone: customerPhone,
                        description: `Follow-up: Invoice #${sale.invoiceNumber} is due tomorrow`,
                        type: "debt",
                        triggerDate: r2Date,
                        saleId,
                        reminderSequence: 2
                    });
                }
            } else if (diffDays >= 3 && diffDays <= 7) {
                // Reminder 1: 2 days before due date
                const r1Date = new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000);
                r1Date.setHours(9, 0, 0, 0);
                if (r1Date > baseDate) {
                    remindersToCreate.push({
                        businessId,
                        whatsappNumber: merchantPhone,
                        recipientType: "customer",
                        recipientPhone: customerPhone,
                        description: `Friendly reminder: Invoice #${sale.invoiceNumber} is due soon`,
                        type: "debt",
                        triggerDate: r1Date,
                        saleId,
                        reminderSequence: 1
                    });
                }
            }

            // Reminder 3: on due date
            const dueReminderDate = new Date(dueDate);
            dueReminderDate.setHours(9, 0, 0, 0);
            if (dueReminderDate > baseDate) {
                remindersToCreate.push({
                    businessId,
                    whatsappNumber: merchantPhone,
                    recipientType: "customer",
                    recipientPhone: customerPhone,
                    description: `Invoice #${sale.invoiceNumber} is due today`,
                    type: "debt",
                    triggerDate: dueReminderDate,
                    saleId,
                    reminderSequence: 3
                });
            }
        } else {
            // No due date (e.g. pay on receipt), use standard 24h/48h sequence:
            remindersToCreate.push({
                businessId,
                whatsappNumber: merchantPhone,
                recipientType: "customer",
                recipientPhone: customerPhone,
                description: `Payment reminder: Invoice #${sale.invoiceNumber}`,
                type: "debt",
                triggerDate: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
                saleId,
                reminderSequence: 1
            });

            remindersToCreate.push({
                businessId,
                whatsappNumber: merchantPhone,
                recipientType: "customer",
                recipientPhone: customerPhone,
                description: `Payment follow-up: Invoice #${sale.invoiceNumber}`,
                type: "debt",
                triggerDate: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000),
                saleId,
                reminderSequence: 2
            });
        }

        if (remindersToCreate.length > 0) {
            await Reminder.insertMany(remindersToCreate);
            console.log(`📅 Scheduled ${remindersToCreate.length} customer reminders for Invoice #${sale.invoiceNumber}`);
        }
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
        const paymentMsg = `Ready to pay Invoice #${sale.invoiceNumber}? Tap the button below to settle outstanding balance of ₦${bal.toLocaleString()} securely online.`;
        
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
                    { type: "text", text: `${sale.invoiceNumber}` }
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

        // ── ONE-TIME GUARD: Block if already paid ──────────────────────────────
        if (sale.status === "paid" || sale.lifecycleStatus === "PAID") {
            await sendCustomerMessageWithFallback(
                customerPhone,
                `Hi ${sale.customerName}, Invoice #${sale.invoiceNumber} has already been fully paid. No extension needed! Thank you.`,
                sale.customerName,
                sale.invoiceNumber
            );
            return;
        }

        // ── ONE-TIME GUARD: Reject duplicate clicks ────────────────────────────
        // Block if already in a pending extension request (lifecycle) — prevents
        // the customer from hammering the button multiple times.
        if (sale.lifecycleStatus === "EXTENSION_REQUESTED") {
            await sendCustomerMessageWithFallback(
                customerPhone,
                `Hi ${sale.customerName}, your extension request for Invoice #${sale.invoiceNumber} is already pending. Your merchant will respond shortly.`,
                sale.customerName,
                sale.invoiceNumber
            );
            return;
        }
        // ── MAX EXTENSIONS GUARD ───────────────────────────────────────────────
        if ((sale.extensionsCount || 0) >= 2) {
            const bizName = sale.businessId?.displayName || "your merchant";
            const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);
            await sendCustomerMessageWithFallback(
                customerPhone,
                `Hi ${sale.customerName}, you have already reached the maximum of 2 extensions for Invoice #${sale.invoiceNumber}. Please complete your payment or contact ${bizName} directly.\n\nBalance: ₦${bal.toLocaleString()}`,
                sale.customerName,
                sale.invoiceNumber
            );
            return;
        }

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

        const sent = await sendInteractiveButtons(
            customerPhone,
            "Payment Extension",
            `Hi ${sale.customerName}, how much more time do you need to settle Invoice #${sale.invoiceNumber} (₦${sale.totalAmount.toLocaleString()})? Alternatively, you can reply with natural text like "I need 5 days".`,
            "Your merchant will be notified immediately",
            [
                { id: `ext_3days:${saleId}`, title: "3 More Days" },
                { id: `ext_1week:${saleId}`, title: "1 More Week" },
                { id: `ext_2weeks:${saleId}`, title: "2 More Weeks" }
            ]
        );

        // Fallback: window closed — send plain text prompt
        if (!sent) {
            await sendCustomerMessageWithFallback(
                customerPhone,
                `Hi ${sale.customerName}, to request a payment extension for Invoice #${sale.invoiceNumber}, simply reply with how many days you need (e.g. "I need 3 days") and I'll pass it along to the merchant.`,
                sale.customerName,
                sale.invoiceNumber
            );
        }
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

        // Acknowledge to customer using merchant business display name
        const bizName = business?.displayName || "the merchant";
        await sendText(
            customerPhone,
            `Got it, ${customerName}! I've sent your request for a *${daysNum}-day extension* to *${bizName}*. They will respond shortly.`
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

        const success = await sendInteractiveButtons(
            merchantPhone,
            "Extension Request",
            `${sale.customerName} is requesting a ${daysNum}-day payment extension for Invoice #${sale.invoiceNumber} (₦${sale.totalAmount.toLocaleString()}).\n\nNew due date: ${newDueDateStr}\n\nDo you approve?`,
            "Reply to notify the customer instantly",
            [
                { id: `ext_approve:${saleId}`, title: "Approve" },
                { id: `ext_reject:${saleId}`, title: "Reject" }
            ]
        );

        if (!success) {
            console.log(`⚠️ Merchant 24h window closed for extension request. Sending template alert with buttons to ${merchantPhone}...`);
            const { sendWhatsAppTemplate } = require("../controllers/whatsapp/whatsappController");
            
            const finalTitle = business?.assistantSettings?.preferredName || business?.displayName || "Partner";
            
            const alertText = `*${sale.customerName}* requested a *${daysNum}-day* payment extension for Invoice *#${sale.invoiceNumber}* (₦${sale.totalAmount.toLocaleString()}). New Due Date: *${newDueDateStr}*.`;
            const cleanMsg = alertText
                .replace(/[\r\n\t]+/g, ' ')
                .replace(/\s\s+/g, ' ')
                .trim()
                .substring(0, 1024);

            const components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: String(finalTitle).substring(0, 60) },
                        { type: "text", text: cleanMsg }
                    ]
                }
            ];

            await sendWhatsAppTemplate(merchantPhone, "kreddy_merchant_decision", components);
        }

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
            extensionApprovedAt: new Date(),
            $inc: { extensionsCount: 1 }
        });

        // Cancel old customer reminders and reschedule
        await cancelCustomerReminders(saleId);

        const sale = await Sale.findById(saleId);
        const business = await BusinessProfile.findById(businessId);
        if (sale && business) {
            await scheduleCustomerReminders(sale, business, customerPhone);
        }

        const newDueDateStr = newDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        await sendCustomerMessageWithFallback(
            customerPhone,
            `Hi ${customerName}, your payment extension request for Invoice #${invoiceNumber} has been approved. Please make sure to clear the invoice on or before the new due date: ${newDueDateStr}.`,
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
            `Hi ${customerName}, unfortunately your payment extension request for Invoice #${invoiceNumber} was not approved by ${businessName}.\n\nPlease make payment as soon as possible.`,
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
            msg = `Payment confirmed. Thank you, ${sale.customerName}. Your payment of ₦${amountPaid.toLocaleString()} for Invoice #${sale.invoiceNumber} has been received. The invoice is now fully paid.`;
            // Cancel pending customer reminders
            await cancelCustomerReminders(saleId);
        } else {
            msg = `Partial payment received. Thank you, ${sale.customerName}. Your payment of ₦${amountPaid.toLocaleString()} for Invoice #${sale.invoiceNumber} has been received.\n\nOutstanding balance: ₦${balance.toLocaleString()}`;
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

        // ── Template Quick Reply: "button" type ─────────────────────────────────────
        // When a customer taps "Request Extension" or "Pay With Transfer" on the
        // kreddy_customer_invoice template (outside the 24h window), WhatsApp sends
        // msgType === "button" with message.button.payload or message.button.text.
        if (msgType === "button") {
            const btnPayload = message?.button?.payload || "";
            const btnText = (message?.button?.text || "").toLowerCase().trim();

            if (btnPayload.startsWith("req_ext:")) {
                const saleId = btnPayload.split(":")[1];
                await handleCustomerRequestExtension(saleId, cleanFrom);
                return true;
            }

            if (btnPayload.startsWith("pay_now:")) {
                const saleId = btnPayload.split(":")[1];
                await handleCustomerPayNow(saleId, cleanFrom);
                return true;
            }

            const activeSale = await Sale.findOne({
                deliveredToPhone: cleanFrom,
                status: { $ne: "paid" },
                lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_GRANTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
            }).sort({ customerDeliveredAt: -1 });

            if (!activeSale) return false;

            if (btnText === "request extension") {
                await handleCustomerRequestExtension(activeSale._id, cleanFrom);
                return true;
            }

            if (btnText === "pay with transfer" || btnText === "pay now") {
                await handleCustomerPayNow(activeSale._id, cleanFrom);
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
            lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_GRANTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
        }).sort({ customerDeliveredAt: -1 }).populate("businessId");

        if (activeSale) {
            const bal = activeSale.totalAmount - (activeSale.payments || []).reduce((s, p) => s + p.amount, 0);

            // If they say something about paying, send them the payment button (no raw links in V2)
            if (/pay|payment|transfer|link|invoice/i.test(lowerText)) {
                await sendCustomerMessageWithFallback(
                    cleanFrom,
                    `Hi ${activeSale.customerName}, here are the payment details for Invoice #${activeSale.invoiceNumber}. Balance due: \u20a6${bal.toLocaleString()}.`,
                    activeSale.customerName,
                    activeSale.invoiceNumber
                );
                return true;
            }

            // If they click the template quick-reply "Request Extension" or ask for more time
            if (/extend|extension|more time/i.test(lowerText)) {
                await handleCustomerRequestExtension(activeSale._id, cleanFrom);
                return true;
            }

            // Generic response with action buttons
            const businessName = activeSale.businessId?.displayName || "Your merchant";
            const buttons = [
                { id: `pay_now:${activeSale._id}`, title: "Pay with Transfer" }
            ];
            if ((activeSale.extensionsCount || 0) < 2) {
                buttons.push({ id: `req_ext:${activeSale._id}`, title: "Request Extension" });
            }

            await sendInteractiveButtons(
                cleanFrom,
                `Invoice #${activeSale.invoiceNumber}`,
                `Hi ${activeSale.customerName}, you have an unpaid invoice from ${businessName} for ₦${bal.toLocaleString()}.\n\nHow would you like to proceed?`,
                "",
                buttons
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

        const correctBodyText = customText || `Hi ${sale.customerName}, this is a reminder from ${businessName} about Invoice #${sale.invoiceNumber}.\n\nAmount outstanding: ₦${bal.toLocaleString()}\nDue: ${dueText.replace("Due: ", "")}\n\nWhat would you like to do?`;

        const buttons = [
            { id: `pay_now:${sale._id}`, title: "Pay with Transfer" }
        ];
        if ((sale.extensionsCount || 0) < 2) {
            buttons.push({ id: `req_ext:${sale._id}`, title: "Request Extension" });
        }

        let success = await sendInteractiveButtons(
            cleanCustomerPhone,
            `Invoice Reminder #${sale.invoiceNumber}`,
            correctBodyText,
            "",
            buttons
        );

        if (!success) {
            console.log(`⚠️ Interactive buttons failed for chase. Falling back to template...`);
            // Strip any newlines for template strictness
            const templateText = correctBodyText.replace(/[\r\n\t]+/g, ' ').replace(/\s\s+/g, ' ');
            success = await sendCustomerMessageWithFallback(
                cleanCustomerPhone,
                templateText,
                sale.customerName,
                sale.invoiceNumber
            );
        }

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

            // Notify merchant on WhatsApp that the reminder has been sent directly
            const merchantPhone = business.whatsappNumber;
            if (merchantPhone) {
                await sendText(
                    merchantPhone,
                    `I've sent a payment reminder directly to *${sale.customerName}* for Invoice *#${sale.invoiceNumber}*.`
                );
            }

            return { success: true };
        } else {
            throw new Error("WhatsApp API send failure");
        }
    } catch (err) {
        console.error("❌ sendChaseToCustomer Error:", err.message);
        return { success: false, error: err.message };
    }
};


// ─── Customer Reminder Template (always works, window open OR closed) ──────────
/**
 * Send a customer invoice reminder using the `kreddy_customer_invoice` template.
 * The template has:
 *   - Header: document PDF (optional)
 *   - Body: {{1}}=customerName, {{2}}=businessName, {{3}}=items, {{4}}=amount, {{5}}=invoiceRef
 *   - Button 0: URL → Pay Invoice Now  (dynamic suffix = invoiceNumber)
 *   - Button 1: Quick Reply → "Request Extension"
 *
 * This ALWAYS delivers because it uses an approved template — no 24h window needed.
 */
const sendCustomerReminderTemplate = async (to, sale, business, sequenceLabel = "Reminder") => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);

    const itemsText = sale.items && sale.items.length > 0
        ? sale.items.map(i => `${i.name} x${i.quantity}`).join(", ")
        : (sale.description || "Purchase");

    const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);
    const formattedAmount = `₦${bal.toLocaleString()} outstanding`;
    const invoiceRef = `#${sale.invoiceNumber}`;
    const businessName = business.displayName || "Your Merchant";

    const components = [];

    // Header: PDF (optional — skip if no pdfUrl to avoid template error)
    if (sale.pdfUrl) {
        components.push({
            type: "header",
            parameters: [
                {
                    type: "document",
                    document: {
                        link: sale.pdfUrl,
                        filename: `Invoice-${sale.invoiceNumber}.pdf`
                    }
                }
            ]
        });
    }

    // Body
    components.push({
        type: "body",
        parameters: [
            { type: "text", text: String(sale.customerName || "Customer").substring(0, 60) },
            { type: "text", text: String(businessName).substring(0, 60) },
            { type: "text", text: String(itemsText).substring(0, 1024) },
            { type: "text", text: formattedAmount },
            { type: "text", text: invoiceRef }
        ]
    });

    // Button 0: URL → Pay Now (dynamic suffix)
    components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: `${sale.invoiceNumber}` }]
    });

    // Button 1: Quick Reply → Request Extension
    // (only include if customer hasn't maxed out extensions or already requested)
    const canRequestExt = (sale.extensionsCount || 0) < 2
        && sale.lifecycleStatus !== "EXTENSION_REQUESTED";
    if (canRequestExt) {
        components.push({
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: `req_ext:${sale._id}` }]
        });
    }

    try {
        console.log(`📨 [${sequenceLabel}] Sending kreddy_customer_invoice template to ${cleanTo}...`);
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "template",
                template: {
                    name: "kreddy_customer_invoice",
                    language: { code: "en" },
                    components
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
        );
        return true;
    } catch (err) {
        console.error(`❌ sendCustomerReminderTemplate Error:`, err.response?.data || err.message);
        return false;
    }
};

const isCustomerPhone = async (phone) => {
    const cleanPhone = normalizePhone(phone);
    const activeSale = await Sale.findOne({
        deliveredToPhone: cleanPhone,
        status: { $ne: "paid" },
        lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_GRANTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
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
    sendCustomerReminderTemplate,
    sendInteractiveButtons,
    sendDocument,
    sendText,
    sendTemplateMsg,
    sendCustomerMessageWithFallback,
    normalizePhone
};
