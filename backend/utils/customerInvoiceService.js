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
const chrono = require("chrono-node");
const Sale = require("../models/Sale");
const BusinessProfile = require("../models/BusinessProfile");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
const WhatsAppSession = require("../models/WhatsAppSession");
const PaymentSession = require("../models/PaymentSession");
const VirtualAccount = require("../models/VirtualAccount");
const { generatePaymentConfirmationCard } = require("./receiptGenerator");
const { generateAndUploadInvoicePDF } = require("./pdfGenerator");
const { logActivity } = require("./activityLogger");
const { createDynamicVirtualAccount } = require("./nomba");
const FINANCIAL_CONFIG = require("../config/financials");

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
 * Send a typing indicator (thinking bubble) to a customer.
 */
const sendTypingIndicator = async (to) => {
    try {
        const { phoneId, accessToken } = getWACredentials();
        if (!accessToken || !phoneId) return;
        const cleanTo = normalizePhone(to);

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanTo,
                sender_action: "typing_on",
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
    } catch (err) {
        // Silent fallback
    }
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
 * Sends a WhatsApp native contact card for "Kreddy AI" so the recipient can
 * save it with one tap. Once saved, "Kreddy AI" appears in their chat header
 * and notification banners for all future messages.
 * Fire-and-forget: errors are silently swallowed so they never block delivery.
 */
const sendKreddyContactCard = async (to) => {
    try {
        const { phoneId, accessToken } = getWACredentials();
        if (!accessToken || !phoneId) return;

        const cleanTo = normalizePhone(to);
        const waId = (process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, '') || cleanTo;

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "contacts",
                contacts: [
                    {
                        name: {
                            formatted_name: "Kreddy AI",
                            first_name: "Kreddy",
                            last_name: "AI"
                        },
                        org: {
                            company: "Kredibly",
                            title: "AI Business Partner"
                        },
                        phones: [
                            {
                                phone: process.env.WHATSAPP_PHONE_NUMBER || `+${waId}`,
                                type: "WORK",
                                wa_id: waId
                            }
                        ],
                        urls: [
                            { url: "https://usekredibly.com", type: "WORK" }
                        ]
                    }
                ]
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10000
            }
        );
        console.log(`📇 Kreddy AI contact card sent to customer ${cleanTo}`);
    } catch (err) {
        console.warn(`⚠️ Contact card send failed for ${to}:`, err?.response?.data || err.message);
    }
};

/**
 * Sends a message to a customer with automatic template fallback if the 24-hour window is closed.
 * V2: Direct WhatsApp text, falls back to kreddy_simple_alert (no browser/URL button templates).
 */
const sendCustomerMessageWithFallback = async (to, text, customerName, invoiceNumber = null) => {
    const cleanTo = normalizePhone(to);
    const WhatsAppSession = require("../models/WhatsAppSession");

    // Check if customer's 24-hour window is active
    const activeSession = await WhatsAppSession.findOne({ whatsappNumber: cleanTo, type: "customer_active_window" });
    const isWindowOpen = !!activeSession;

    if (isWindowOpen) {
        // Window open: send directly via free-form text
        const success = await sendText(cleanTo, text);
        if (success) return true;
    }

    // Window closed or sendText failed: use kreddy_simple_alert template (no URL buttons)
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
 * Send a WhatsApp image message with optional caption.
 */
const sendImage = async (to, imageUrl, caption = "") => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);
    try {
        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "image",
                image: {
                    link: imageUrl,
                    caption: caption
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
        );
        return true;
    } catch (err) {
        console.error("❌ sendImage Error:", err.response?.data || err.message);
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
                text: headerText.replace(/[\*_~`#]/g, "").substring(0, 60)
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
 * Send an interactive message with a native CTA URL button (opens a web browser link).
 */
const sendInteractiveCTAUrlButton = async (to, headerText, bodyText, footerText, buttonTitle, url) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);

    const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "interactive",
        interactive: {
            type: "cta_url",
            header: headerText ? {
                type: "text",
                text: headerText.replace(/[\*_~`#]/g, "").substring(0, 60)
            } : undefined,
            body: { text: bodyText.substring(0, 1024) },
            footer: footerText ? { text: footerText.substring(0, 60) } : undefined,
            action: {
                name: "cta_url",
                parameters: {
                    display_text: String(buttonTitle).substring(0, 20),
                    url: url
                }
            }
        }
    };

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
        console.error("❌ sendInteractiveCTAUrlButton Error:", err.response?.data || err.message);
        return false;
    }
};

/**
 * Send an interactive message with a list (up to 10 options).
 * Used when more than 3 options are needed, e.g., task reminders.
 */
const sendInteractiveList = async (to, headerText, bodyText, footerText, buttonText, sections) => {
    const { phoneId, accessToken } = getWACredentials();
    if (!accessToken || !phoneId) return false;
    const cleanTo = normalizePhone(to);

    const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "interactive",
        interactive: {
            type: "list",
            header: headerText ? {
                type: "text",
                text: headerText.replace(/[\*_~`#]/g, "").substring(0, 60)
            } : undefined,
            body: { text: bodyText.substring(0, 1024) },
            footer: footerText ? { text: footerText.substring(0, 60) } : undefined,
            action: {
                button: buttonText.substring(0, 20),
                sections: sections
            }
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
        console.error("❌ sendInteractiveList Error:", err.response?.data || err.message);
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
 * Send the customer invoice WhatsApp template.
 *
 * Supports two templates:
 *
 * 1. kreddy_customer_invoice (CURRENT — legacy)
 *    Button 0: URL → opens public invoice page  ← V1 behaviour
 *    Button 1: Quick Reply → req_ext:{saleId}
 *
 * 2. kreddy_customer_invoice_v2 (V2 — set USE_INVOICE_V2_TEMPLATE=true in .env)
 *    Button 0: Quick Reply → payload "pay_now"   ← stays in WhatsApp ✅
 *    Button 1: Quick Reply → payload "req_ext"   ← stays in WhatsApp ✅
 *
 * Note: Template Quick Reply payloads MUST be static strings (Meta limitation).
 * The code resolves the active sale from the customer's phone when these fire.
 *
 * In both cases, after the template sends, Kreddy immediately follows up with
 * a free-form interactive message containing pay_now:{saleId} buttons — this
 * is the primary V2 payment entry point.
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
    const templateName = "kreddy_customer_invoice_v2";

    // Meta requires components in strict order: header → body → buttons
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

    // 2. Body — variables matching the approved template body
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

    const canRequestExt = (sale.extensionsCount || 0) < 2
        && sale.lifecycleStatus !== "EXTENSION_REQUESTED";

    // V2 template: both buttons are Quick Replies — customer stays in WhatsApp
    // Button 0: Pay with Transfer (static payload "pay_now")
    components.push({
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: "pay_now" }]
    });

    // Button 1: Request Extension (static payload "req_ext") — only if eligible
    if (canRequestExt) {
        components.push({
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: "req_ext" }]
        });
    }

    try {
        console.log(`Sending ${templateName} template to ${cleanTo}...`);
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
            `Please see the attached PDF for bank transfer details.`
        ].join("\n");

        const canRequestExt = (sale.extensionsCount || 0) < 2
            && sale.lifecycleStatus !== "EXTENSION_REQUESTED";

        if (bal > 0) {

            // Step 2a: Send the invoice template (delivers the PDF and opens a 24h window).
            // Template-first guarantees delivery even for new customers with no prior session.
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
            const merchantCaption = [
                `✅ *Invoice Created Successfully*`,
                ``,
                `*Invoice:* ${sale.invoiceNumber}`,
                `*Customer:* ${sale.customerName}`,
                `*Amount:* ₦${sale.totalAmount.toLocaleString()}`,
                ``,
                `Your invoice has been generated successfully.`,
                ``,
                `• A PDF copy has been sent to you.`,
                `• The customer has received the invoice on WhatsApp.`,
                `• You'll be notified immediately once payment is made.`
            ].join("\n");

            if (pdfUrl) {
                const merchantPdfSent = await sendDocument(
                    merchantPhone,
                    pdfUrl,
                    `invoice-${sale.invoiceNumber}.pdf`,
                    merchantCaption
                );
                console.log(`📄 PDF copy with invoice summary sent to merchant ${merchantPhone}: ${merchantPdfSent ? '✅ sent' : '❌ failed'}`);
            } else {
                // Fallback: if no PDF was generated for some reason, just send the text
                const merchantMsgSent = await sendText(merchantPhone, merchantCaption);
                console.log(`📩 Merchant text summary fallback sent to ${merchantPhone}: ${merchantMsgSent ? '✅ sent' : '❌ failed'}`);
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
        await sendTypingIndicator(customerPhone);
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);

        if (bal <= 0) {
            await sendText(customerPhone, `Great news! This invoice *#${sale.invoiceNumber}* has already been fully paid. Thank you! 🎉`);
            return;
        }

        const cleanCustomerPhone = normalizePhone(customerPhone);

        // V2: Ownership-first language, cleaner options
        await sendInteractiveButtons(
            cleanCustomerPhone,
            `Invoice #${sale.invoiceNumber}`,
            `Hi ${sale.customerName} 👋\n\nYou have an outstanding balance of *₦${bal.toLocaleString()}* on Invoice *#${sale.invoiceNumber}*.\n\nWould you like to pay the full balance or make a partial payment?`,
            "A unique bank account will be generated for you instantly.",
            [
                { id: `pay_full:${saleId}`, title: "Full Payment" },
                { id: `pay_part:${saleId}`, title: "Partial Payment" }
            ]
        );
    } catch (err) {
        console.error("❌ handleCustomerPayNow Error:", err.message);
    }
};

/**
 * Handle a [Pay Full] button press — generate a DVA for the full outstanding balance.
 */
const handleCustomerPayFull = async (saleId, customerPhone) => {
    try {
        await sendTypingIndicator(customerPhone);
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const business = sale.businessId;
        const cleanPhone = normalizePhone(customerPhone);
        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);

        if (bal <= 0) {
            await sendText(cleanPhone, `Invoice *#${sale.invoiceNumber}* is already fully paid. Thank you! 🎉`);
            return;
        }

        // Invalidate any existing open PaymentSession for this sale
        await PaymentSession.updateMany(
            { saleId, status: "pending" },
            { $set: { status: "expired" } }
        );

        // Determine DVA amount — gross up if merchant doesn't absorb fees
        const absorbFees = business?.prefersGatewayFeeAbsorption !== false && business?.prefersGatewayFeeAbsorption !== "false";
        const dvaAmount = FINANCIAL_CONFIG.calculateGrossAmount(bal, absorbFees);

        // Generate DVA
        const dva = await createDynamicVirtualAccount({
            amount: dvaAmount,
            invoiceNumber: sale.invoiceNumber,
            merchantName: business?.displayName || "Kredibly",
            customerEmail: sale.customerEmail || "payments@usekredibly.com"
        });

        // Persist PaymentSession
        const paySession = await PaymentSession.create({
            saleId,
            businessId: sale.businessId?._id || sale.businessId,
            customerPhone: cleanPhone,
            amountExpected: dvaAmount,
            amountIntended: bal,
            paymentType: "full",
            nombaReference: dva.reference,
            nombaAccountNumber: dva.accountNumber,
            nombaBankName: dva.bankName,
            nombaAccountName: dva.accountName,
            nombaExpiresAt: new Date(dva.expiresAt),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Persist VirtualAccount (so the webhook processor finds it)
        await VirtualAccount.create({
            businessId: sale.businessId?._id || sale.businessId,
            saleId,
            invoiceNumber: sale.invoiceNumber,
            accountNumber: dva.accountNumber,
            bankName: dva.bankName,
            provider: 'nomba',
            reference: dva.reference,
            accountName: dva.accountName,
            amount: dvaAmount,
            baseAmount: bal,
            status: 'active',
            expiresAt: new Date(dva.expiresAt)
        });

        // V2: Structured payment card
        const expiryTime = new Date(dva.expiresAt);
        const expiryStr = expiryTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
        const expiryDateStr = expiryTime.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
        const validUntil = `${expiryDateStr} at ${expiryStr}`;

        const feeLines = absorbFees
            ? ``
            : `\n*Invoice Amount:* ₦${bal.toLocaleString()}\n*Gateway Fee:* ₦${(dvaAmount - bal).toLocaleString()}`;

        await sendText(
            cleanPhone,
            `*You're paying*\n${sale.businessId?.displayName || "Your Merchant"}\nInvoice ${sale.invoiceNumber}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `*Amount*          ₦${bal.toLocaleString()}${feeLines}\n` +
            `*Transfer exactly* ₦${dvaAmount.toLocaleString()}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `*Bank*            ${dva.bankName}\n` +
            `*Account Name*    ${dva.accountName}\n` +
            `*Account Number*  ${dva.accountNumber}\n` +
            `*Valid until*     ${validUntil}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Open your banking app and transfer exactly *₦${dvaAmount.toLocaleString()}*. Your payment will be confirmed automatically — no need to send a screenshot. 🏦`
        );
    } catch (err) {
        console.error("❌ handleCustomerPayFull Error:", err.message);
        await sendText(
            normalizePhone(customerPhone),
            "Sorry, we couldn't generate your payment account right now. Please try again in a moment."
        );
    }
};

/**
 * Handle a [Pay Part] button press — ask the customer how much they want to pay.
 */
const handleCustomerPayPart = async (saleId, customerPhone) => {
    try {
        await sendTypingIndicator(customerPhone);
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const cleanPhone = normalizePhone(customerPhone);
        const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);

        if (bal <= 0) {
            await sendText(cleanPhone, `Invoice *#${sale.invoiceNumber}* is already fully paid. Thank you! 🎉`);
            return;
        }

        // Open a WhatsApp session to collect the partial amount
        await WhatsAppSession.findOneAndUpdate(
            { whatsappNumber: cleanPhone },
            {
                whatsappNumber: cleanPhone,
                type: "collect_partial_payment_amount",
                data: { saleId: saleId.toString(), balance: bal, invoiceNumber: sale.invoiceNumber }
            },
            { upsert: true, new: true }
        );

        await sendText(
            cleanPhone,
            `💬 How much would you like to pay now?\n\n` +
            `Outstanding balance on Invoice *#${sale.invoiceNumber}*: *₦${bal.toLocaleString()}*\n\n` +
            `Please reply with the amount (e.g. *5000*).`
        );
    } catch (err) {
        console.error("❌ handleCustomerPayPart Error:", err.message);
    }
};

/**
 * Handle a [Request Extension] button press from a customer.
 * Shows them duration options (interactive buttons).
 */
const handleCustomerRequestExtension = async (saleId, customerPhone) => {
    try {
        await sendTypingIndicator(customerPhone);
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

        // Save V2 workflow context so we know what invoice extension is being requested
        const WorkflowQueue = require("../conversation/WorkflowQueue");
        await WorkflowQueue.enqueue(
            normalizePhone(customerPhone),
            sale.businessId?._id || sale.businessId,
            "customer_extension",
            "awaiting_duration",
            "HIGH",
            {
                saleId: saleId.toString(),
                customerName: sale.customerName,
                invoiceNumber: sale.invoiceNumber,
                businessId: sale.businessId?._id?.toString() || sale.businessId?.toString(),
                merchantPhone: sale.businessId?.whatsappNumber
            },
            30 // 30 min timeout
        );

        const sent = await sendInteractiveButtons(
            customerPhone,
            "Payment Extension",
            `Hi ${sale.customerName}, how much more time do you need to settle Invoice #${sale.invoiceNumber} (₦${sale.totalAmount.toLocaleString()})?`,
            "Your merchant will be notified immediately",
            [
                { id: `ext_3days:${saleId}`, title: "+3 Days" },
                { id: `ext_1week:${saleId}`, title: "+1 Week" },
                { id: `ext_custom:${saleId}`, title: "Custom Date" }
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
 * Handle customer selecting 'Custom Date' — opens a conversation to collect the date.
 */
const handleCustomerCustomDate = async (saleId, customerPhone, sale) => {
    try {
        // Save session so we capture the next free-text reply as a date
        await WhatsAppSession.findOneAndUpdate(
            { whatsappNumber: normalizePhone(customerPhone) },
            {
                type: "customer_extension_custom_date",
                data: {
                    saleId: saleId.toString(),
                    customerName: sale.customerName,
                    invoiceNumber: sale.invoiceNumber,
                    businessId: sale.businessId?._id?.toString() || sale.businessId?.toString(),
                    merchantPhone: sale.businessId?.whatsappNumber
                },
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min to answer
            },
            { upsert: true, new: true }
        );

        await sendText(
            customerPhone,
            `Sure. What date would you like to pay by? (e.g. *24 July* or *31/07*)`
        );
    } catch (err) {
        console.error("❌ handleCustomerCustomDate Error:", err.message);
    }
};

/**
 * Handle customer selecting an extension duration (from buttons or parsed text).
 * Accepts an optional reason string to include in the merchant card.
 * @param {string|null} reason  - Customer's stated reason (null = skipped)
 * @param {Date|null}   newDueDateOverride - If set, use this date instead of computing from days
 */
const handleCustomerExtensionDuration = async (saleId, days, customerPhone, customerName, reason = null, newDueDateOverride = null) => {
    try {
        await sendTypingIndicator(customerPhone);
        const sale = await Sale.findById(saleId).populate("businessId");
        if (!sale) return;

        const business = sale.businessId;
        const daysNum = parseInt(days);

        // Resolve the target date — either from override (custom date flow) or from days count
        const requestedDate = newDueDateOverride
            ? new Date(newDueDateOverride)
            : new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);

        // Human-readable label for the date
        const newDueDateStr = requestedDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

        // Compute a display label for the duration
        const actualDays = newDueDateOverride
            ? Math.ceil((requestedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            : daysNum;
        const durationLabel = newDueDateOverride ? `until ${newDueDateStr}` : `${actualDays}-day extension`;

        // Update sale: extension requested
        await Sale.findByIdAndUpdate(saleId, {
            lifecycleStatus: "EXTENSION_REQUESTED",
            extensionRequestedAt: new Date(),
            requestedExtensionDays: actualDays
        });

        // Acknowledge to customer using merchant business display name
        const bizName = business?.displayName || "the merchant";
        await sendText(
            customerPhone,
            `Got it, ${customerName}! I've sent your request for a *${durationLabel}* to *${bizName}*. They will respond shortly.`
        );

        // Notify merchant with [Approve] [Decline] interactive buttons
        const merchantPhone = business?.whatsappNumber;
        if (!merchantPhone) return;

        // Build reason line for merchant card
        const reasonLine = reason
            ? `\n\nReason:\n"${reason}"`
            : `\n\nReason:\nNo reason provided.`;

        // Save V2 workflow context on merchant's number so they can approve/reject
        const WorkflowQueue = require("../conversation/WorkflowQueue");
        await WorkflowQueue.enqueue(
            normalizePhone(merchantPhone),
            business._id,
            "merchant_extension",
            "awaiting_decision",
            "HIGH",
            {
                saleId: saleId.toString(),
                customerName: sale.customerName,
                customerPhone: normalizePhone(customerPhone),
                invoiceNumber: sale.invoiceNumber,
                requestedDays: actualDays,
                newDueDate: requestedDate.toISOString(),
                businessId: business._id.toString()
            },
            24 * 60 // 24h timeout
        );

        const success = await sendInteractiveButtons(
            merchantPhone,
            "Extension Request",
            `${sale.customerName} is requesting an extension for Invoice #${sale.invoiceNumber} (₦${sale.totalAmount.toLocaleString()}).\n\nRequested date: *${newDueDateStr}*${reasonLine}\n\nDo you approve?`,
            "Reply to notify the customer instantly",
            [
                { id: `ext_approve:${saleId}`, title: "Approve" },
                { id: `ext_reject:${saleId}`, title: "Decline" }
            ]
        );

        if (!success) {
            console.log(`⚠️ Merchant 24h window closed for extension request. Sending template alert to ${merchantPhone}...`);
            const { sendWhatsAppTemplate } = require("../controllers/whatsapp/whatsappController");
            
            const finalTitle = business?.assistantSettings?.preferredName || business?.displayName || "Partner";
            const reasonClean = reason ? `Reason: "${reason}"` : `Reason: No reason provided.`;
            const alertText = `*${sale.customerName}* has requested a payment extension for Invoice *#${sale.invoiceNumber}* (₦${sale.totalAmount.toLocaleString()}). Requested date: *${newDueDateStr}*. ${reasonClean}`;
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
            message: `${sale.customerName} requested an extension for Invoice #${sale.invoiceNumber}. Requested date: ${newDueDateStr}.`,
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

        // Cancel old customer reminders and reschedule from new due date
        await cancelCustomerReminders(saleId);

        const sale = await Sale.findById(saleId);
        const business = await BusinessProfile.findById(businessId);
        if (sale && business) {
            await scheduleCustomerReminders(sale, business, customerPhone);
        }

        const newDueDateStr = newDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        const cleanCustomerPhone = normalizePhone(customerPhone);

        // ✅ Send ONE clean message — no "check below" pattern
        // If the customer's 24h window is open, send interactive buttons directly.
        // If window is closed (e.g. merchant approved hours later), fall back to template.
        const WhatsAppSession = require("../models/WhatsAppSession");
        const activeSession = await WhatsAppSession.findOne({ whatsappNumber: cleanCustomerPhone, type: "customer_active_window" });

        if (activeSession && sale) {
            const bal = sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0);
            const buttons = [
                { id: `pay_now:${saleId}`, title: "Pay with Transfer" }
            ];
            if ((sale.extensionsCount || 1) < 2) {
                buttons.push({ id: `req_ext:${saleId}`, title: "Request Extension" });
            }
            await sendInteractiveButtons(
                cleanCustomerPhone,
                `✅ Extension Approved! — Invoice #${invoiceNumber}`,
                `Great news, ${customerName}! Your extension request has been approved.\n\nYour new due date is *${newDueDateStr}*.\nOutstanding balance: *₦${bal.toLocaleString()}*\n\nHow would you like to proceed?`,
                "",
                buttons
            ).catch(e => console.warn("⚠️ Extension approval buttons failed:", e.message));
        } else {
            // Window closed — use template fallback (no "check below" button)
            const approvalText = `Hi ${customerName}, your payment extension request for Invoice #${invoiceNumber} has been approved. Your new due date is ${newDueDateStr}. Please ensure payment is made by then.`;
            await sendCustomerMessageWithFallback(
                customerPhone,
                approvalText,
                customerName,
                null  // null = no invoice URL button appended
            );
        }

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
 * Sequence:
 *  1. Branded payment confirmation image card (always)
 *  2. Final PAID PDF (only when fully settled)
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
        const isFullyPaid = balance <= 0;

        // Update lifecycle status first so PDF watermark reads correctly
        const lifecycleStatus = isFullyPaid ? "PAID" : "PARTIALLY_PAID";
        if (isFullyPaid) await cancelCustomerReminders(saleId);
        sale = await Sale.findByIdAndUpdate(saleId, { lifecycleStatus }, { new: true }).populate("businessId");

        const cleanCustomerPhone = normalizePhone(customerPhone);

        // Fetch customer session window status
        const WhatsAppSession = require("../models/WhatsAppSession");
        const activeSession = await WhatsAppSession.findOne({ whatsappNumber: cleanCustomerPhone, type: "customer_active_window" });
        const isCustomerWindowOpen = !!activeSession;

        // ── Pre-generate PDF for full payments so link is ready for fallbacks ──
        if (isFullyPaid && !sale.pdfUrl) {
            console.log(`📄 Regenerating PAID PDF for Invoice ${sale.invoiceNumber} before notifications...`);
            const pdfUrl = await generateAndUploadInvoicePDF(sale, business);
            if (pdfUrl) {
                sale = await Sale.findByIdAndUpdate(saleId, { pdfUrl }, { new: true }).populate("businessId");
            }
        }

        // ── Step 1: Branded payment confirmation card (image) ──────────────────
        let cardUrl = null;
        try {
            const VirtualAccount = require("../models/VirtualAccount");
            const va = await VirtualAccount.findOne({ saleId: sale._id }).sort({ createdAt: -1 });
            const latestPayment = sale.payments && sale.payments.length > 0 
                ? sale.payments[sale.payments.length - 1] 
                : null;

            cardUrl = await generatePaymentConfirmationCard({
                businessName,
                customerName: sale.customerName,
                invoiceNumber: sale.invoiceNumber,
                amountPaid,
                balance: isFullyPaid ? 0 : balance,
                reference: latestPayment?.reference || latestPayment?.externalReference || va?.reference || "N/A",
                date: latestPayment?.date || new Date(),
                method: latestPayment?.method || "Transfer",
                beneficiaryAccountNumber: va?.accountNumber || "N/A",
                beneficiaryAccountName: va?.accountName || businessName,
                bankName: va?.bankName || "Paycom (Opay)"
            });

            let imageSent = false;
            if (isCustomerWindowOpen && cardUrl) {
                const cardCaption = isFullyPaid
                    ? `✅ Payment received! Invoice *#${sale.invoiceNumber}* is now fully settled.`
                    : `✅ Partial payment of ₦${amountPaid.toLocaleString()} received for Invoice *#${sale.invoiceNumber}*.\n\nOutstanding: *₦${balance.toLocaleString()}*`;
                imageSent = await sendImage(cleanCustomerPhone, cardUrl, cardCaption);
            }

            if (!imageSent) {
                // Closed window fallback: send template notification with pdf link
                const fallbackText = isFullyPaid
                    ? `✅ Payment confirmed! Your payment of ₦${amountPaid.toLocaleString()} for Invoice #${sale.invoiceNumber} has been received. The invoice is now fully paid. View receipt: ${sale.pdfUrl}`
                    : `✅ Partial payment received. ₦${amountPaid.toLocaleString()} received for Invoice #${sale.invoiceNumber}. Outstanding balance: ₦${balance.toLocaleString()}`;
                
                await sendCustomerMessageWithFallback(cleanCustomerPhone, fallbackText, sale.customerName, sale.invoiceNumber);
            }

            if (!isFullyPaid && business?.whatsappNumber) {
                const cleanMerchantPhone = normalizePhone(business.whatsappNumber);
                const isMerchantWindowOpen = !!(business.lastInboundAt && (new Date() - new Date(business.lastInboundAt)) < 24 * 60 * 60 * 1000);
                if (isMerchantWindowOpen && cardUrl) {
                    const merchantCardCaption = `✅ Partial payment of ₦${amountPaid.toLocaleString()} received for Invoice *#${sale.invoiceNumber}* from *${sale.customerName}*.\n\nOutstanding: *₦${balance.toLocaleString()}*`;
                    await sendImage(cleanMerchantPhone, cardUrl, merchantCardCaption);
                }
            }

            // Small delay before next message
            await new Promise(r => setTimeout(r, 1500));
        } catch (cardErr) {
            console.error("⚠️ Could not generate payment card, falling back to text:", cardErr.message);
            // Fallback to plain text confirmation
            const msg = isFullyPaid
                ? `✅ Payment confirmed! Thank you, ${sale.customerName}. Your payment of ₦${amountPaid.toLocaleString()} for Invoice #${sale.invoiceNumber} has been received. The invoice is now fully paid. View receipt: ${sale.pdfUrl}`
                : `✅ Partial payment received. Thank you, ${sale.customerName}. ₦${amountPaid.toLocaleString()} received for Invoice #${sale.invoiceNumber}.\n\nOutstanding balance: ₦${balance.toLocaleString()}`;
            await sendText(cleanCustomerPhone, msg);

            if (!isFullyPaid && business?.whatsappNumber) {
                const cleanMerchantPhone = normalizePhone(business.whatsappNumber);
                const isMerchantWindowOpen = !!(business.lastInboundAt && (new Date() - new Date(business.lastInboundAt)) < 24 * 60 * 60 * 1000);
                if (isMerchantWindowOpen) {
                    const merchantMsg = `✅ Partial payment received from *${sale.customerName}*. ₦${amountPaid.toLocaleString()} received for Invoice #${sale.invoiceNumber}.\n\nOutstanding balance: ₦${balance.toLocaleString()}`;
                    await sendText(cleanMerchantPhone, merchantMsg);
                }
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        // ── Step 1.5: Send new checkout buttons for the remaining balance ─────
        if (!isFullyPaid && isCustomerWindowOpen) {
            const buttons = [
                { id: `pay_now:${sale._id}`, title: "Pay Remaining" }
            ];
            if ((sale.extensionsCount || 0) < 2) {
                buttons.push({ id: `req_ext:${sale._id}`, title: "Request Extension" });
            }
            await sendInteractiveButtons(
                cleanCustomerPhone,
                `Invoice #${sale.invoiceNumber}`,
                `You still have an outstanding balance of *₦${balance.toLocaleString()}*.\n\nWould you like to pay the remaining balance now or request an extension?`,
                "",
                buttons
            ).catch(err => console.error("⚠️ Failed to send remaining balance buttons:", err.message));
        }

        // ── Step 2: Final PAID PDF — only when fully settled ──────────────────
        if (isFullyPaid && sale.pdfUrl) {
            // Send to customer if window is open
            if (isCustomerWindowOpen) {
                await sendDocument(
                    cleanCustomerPhone,
                    sale.pdfUrl,
                    `Receipt-${sale.invoiceNumber}.pdf`,
                    `🧾 *Official Receipt from ${businessName}*\nInvoice #${sale.invoiceNumber} — Fully Settled`
                );
            }

            // Send to merchant copy if window is open
            if (business.whatsappNumber) {
                const cleanMerchantPhone = normalizePhone(business.whatsappNumber);
                const isMerchantWindowOpen = !!(business.lastInboundAt && (new Date() - new Date(business.lastInboundAt)) < 24 * 60 * 60 * 1000);
                
                if (isMerchantWindowOpen) {
                    await sendDocument(
                        cleanMerchantPhone,
                        sale.pdfUrl,
                        `Receipt-${sale.invoiceNumber}.pdf`,
                        `🧾 *Paid Invoice Receipt (Merchant Copy)*\nInvoice #${sale.invoiceNumber} from ${sale.customerName} is fully paid!`
                    );
                }
            }
        }

        console.log(`📩 Payment confirmation sent to customer ${customerPhone} for Invoice #${sale.invoiceNumber}`);

        // Publish InvoicePaid event to trigger event-driven subscribers (referral check, analytics, memory)
        const WorkflowEventBus = require("../conversation/WorkflowEventBus");
        WorkflowEventBus.publish("InvoicePaid", {
            saleId: sale._id,
            businessId: sale.businessId,
            customerPhone: cleanCustomerPhone,
            customerName: sale.customerName,
            paidAmount: amount,
            isFullyPaid
        });

        return cardUrl;
    } catch (err) {
        console.error("❌ notifyCustomerPaymentReceived Error:", err.message);
        return null;
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
        await sendTypingIndicator(cleanFrom);
        const lowerText = (text || "").toLowerCase().trim();

        // Refresh/upsert customer's 24-hour active window session
        const WhatsAppSession = require("../models/WhatsAppSession");
        await WhatsAppSession.findOneAndUpdate(
            { whatsappNumber: cleanFrom, type: "customer_active_window" },
            { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            { upsert: true, new: true }
        );

        // Check for interactive button reply
        if (msgType === "interactive") {
            const buttonReply = message?.interactive?.button_reply;
            if (!buttonReply) return false;

            const { id: buttonId } = buttonReply;

            // [Pay Now] button — shows Pay Full / Pay Part choice
            if (buttonId.startsWith("pay_now:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerPayNow(saleId, cleanFrom);
                return true;
            }

            // [Pay Full] button — generate DVA for full balance
            if (buttonId.startsWith("pay_full:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerPayFull(saleId, cleanFrom);
                return true;
            }

            // [Pay Part] button — ask how much they'd like to pay
            if (buttonId.startsWith("pay_part:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerPayPart(saleId, cleanFrom);
                return true;
            }

            // [Request Extension] button
            if (buttonId.startsWith("req_ext:")) {
                const saleId = buttonId.split(":")[1];
                await handleCustomerRequestExtension(saleId, cleanFrom);
                return true;
            }

            // Extension duration: 3 days / 1 week
            if (buttonId.startsWith("ext_3days:") || buttonId.startsWith("ext_1week:")) {
                const [prefix, saleId] = buttonId.split(":");
                const daysMap = { "ext_3days": 3, "ext_1week": 7 };
                const days = daysMap[prefix];

                // Get customer name from session or sale
                const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom, type: "customer_extension_duration" });
                const customerName = session?.data?.customerName || "Customer";
                await handleCustomerExtensionDuration(saleId, days, cleanFrom, customerName);
                if (session) await WhatsAppSession.deleteOne({ _id: session._id });
                return true;
            }

            // Custom Extension Date Button
            if (buttonId.startsWith("ext_custom:")) {
                const saleId = buttonId.split(":")[1];
                const sale = await Sale.findById(saleId);
                if (sale) {
                    await handleCustomerCustomDate(saleId, cleanFrom, sale);
                }
                return true;
            }

            return false;
        }

        // ── Template Quick Reply: "button" type ─────────────────────────────────────
        // When a customer taps a button on the kreddy_customer_invoice template
        // (outside the 24h window), WhatsApp sends msgType === "button" with payload.
        //
        // Two cases:
        //   1. Legacy template: payload = "pay_now:{saleId}" or "req_ext:{saleId}"
        //   2. V2 template:     payload = "pay_now" or "req_ext" (static, no saleId)
        if (msgType === "button") {
            const btnPayload = message?.button?.payload || "";
            const btnText = (message?.button?.text || "").toLowerCase().trim();

            // Legacy template: payload contains saleId
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

            // V2 template: static payload "pay_now" or "req_ext" — resolve sale by phone
            if (btnPayload === "pay_now" || btnText === "pay with transfer" || btnText === "pay now") {
                const activeSale = await findActiveCustomerSale(cleanFrom);
                if (activeSale) {
                    await handleCustomerPayNow(activeSale._id, cleanFrom);
                    return true;
                }
                return false;
            }

            if (btnPayload === "req_ext" || btnText === "request extension") {
                const activeSale = await findActiveCustomerSale(cleanFrom);
                if (activeSale) {
                    await handleCustomerRequestExtension(activeSale._id, cleanFrom);
                    return true;
                }
                return false;
            }

            return false;
        }


        // Check for text-based session
        const session = await WhatsAppSession.findOne({ whatsappNumber: cleanFrom });

        // ── Collect partial payment amount ─────────────────────────────────────
        if (session?.type === "collect_partial_payment_amount") {
            const amountMatch = lowerText.match(/([\d,]+(?:\.\d{1,2})?)/);
            const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : NaN;

            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                const { saleId, balance, invoiceNumber } = session.data;

                if (parsedAmount > balance) {
                    await sendText(cleanFrom,
                        `⚠️ The amount \u20a6${parsedAmount.toLocaleString()} exceeds the outstanding balance of *₦${balance.toLocaleString()}*.\n\nPlease enter an amount up to *₦${balance.toLocaleString()}*.`
                    );
                    return true;
                }

                // Delete the session — we're acting on it now
                await WhatsAppSession.deleteOne({ _id: session._id });

                // Fetch sale and generate partial DVA
                const partSale = await Sale.findById(saleId).populate("businessId");
                if (!partSale) return false;

                const business = partSale.businessId;
                const absorbFees = business?.prefersGatewayFeeAbsorption !== false && business?.prefersGatewayFeeAbsorption !== "false";
                const dvaAmount = FINANCIAL_CONFIG.calculateGrossAmount(parsedAmount, absorbFees);

                await PaymentSession.updateMany(
                    { saleId, status: "pending" },
                    { $set: { status: "expired" } }
                );

                let dva;
                try {
                    dva = await createDynamicVirtualAccount({
                        amount: dvaAmount,
                        invoiceNumber: partSale.invoiceNumber,
                        merchantName: business?.displayName || "Kredibly",
                        customerEmail: partSale.customerEmail || "payments@usekredibly.com"
                    });
                } catch (dvaErr) {
                    await sendText(cleanFrom, "Sorry, we couldn't generate your payment account. Please try again.");
                    return true;
                }

                await PaymentSession.create({
                    saleId,
                    businessId: partSale.businessId?._id || partSale.businessId,
                    customerPhone: cleanFrom,
                    amountExpected: dvaAmount,
                    amountIntended: parsedAmount,
                    paymentType: "partial",
                    nombaReference: dva.reference,
                    nombaAccountNumber: dva.accountNumber,
                    nombaBankName: dva.bankName,
                    nombaAccountName: dva.accountName,
                    nombaExpiresAt: new Date(dva.expiresAt),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });

                // Persist VirtualAccount (so the webhook processor finds it)
                await VirtualAccount.create({
                    businessId: partSale.businessId?._id || partSale.businessId,
                    saleId,
                    invoiceNumber: partSale.invoiceNumber,
                    accountNumber: dva.accountNumber,
                    bankName: dva.bankName,
                    provider: 'nomba',
                    reference: dva.reference,
                    accountName: dva.accountName,
                    amount: dvaAmount,
                    baseAmount: parsedAmount,
                    status: 'active',
                    expiresAt: new Date(dva.expiresAt)
                });

                // V2: Structured payment card for partial payment
                const partExpiryTime = new Date(dva.expiresAt);
                const partExpiryStr = partExpiryTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
                const partExpiryDateStr = partExpiryTime.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
                const partValidUntil = `${partExpiryDateStr} at ${partExpiryStr}`;

                const partFeeLines = absorbFees
                    ? ``
                    : `\n*Partial Amount:* ₦${parsedAmount.toLocaleString()}\n*Gateway Fee:* ₦${(dvaAmount - parsedAmount).toLocaleString()}`;

                await sendText(
                    cleanFrom,
                    `*You're paying (partial)*\nInvoice ${partSale.invoiceNumber}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `*Amount*          ₦${parsedAmount.toLocaleString()}${partFeeLines}\n` +
                    `*Transfer exactly* ₦${dvaAmount.toLocaleString()}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `*Bank*            ${dva.bankName}\n` +
                    `*Account Name*    ${dva.accountName}\n` +
                    `*Account Number*  ${dva.accountNumber}\n` +
                    `*Valid until*     ${partValidUntil}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `Open your banking app and transfer exactly *₦${dvaAmount.toLocaleString()}*. Your payment will be confirmed automatically — no need to send a screenshot. 🏦`
                );
                return true;
            } else {
                await sendText(cleanFrom, `Please reply with a valid amount (e.g. *5000*).`);
                return true;
            }
        }

        // ── Extension duration session ─────────────────────────────────────────
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

        // ── Custom Extension Date session ──────────────────────────────────────
        if (session?.type === "customer_extension_custom_date") {
            const parsedDate = chrono.parseDate(text);
            if (!parsedDate || parsedDate <= new Date()) {
                await sendText(cleanFrom, `I couldn't understand that date or it's not a future date. Please reply with a valid future date like "24 July" or "31/07".`);
                return true;
            }

            // Move to reason collection step
            session.type = "customer_extension_reason";
            session.data.newDueDate = parsedDate.toISOString();
            session.markModified("data");
            await session.save();

            await sendText(cleanFrom, `Got it. Would you like to tell the merchant why you're requesting this extension?\n\n(Reply with your reason, or type *skip* to skip)`);
            return true;
        }

        // ── Custom Extension Reason session ────────────────────────────────────
        if (session?.type === "customer_extension_reason") {
            const reply = text.trim();
            const reason = reply.toLowerCase() === "skip" ? null : reply;
            const { saleId, customerName, newDueDate } = session.data;

            // Delete session
            await WhatsAppSession.deleteOne({ _id: session._id });

            // Trigger the duration handler with the custom date and optional reason
            await handleCustomerExtensionDuration(saleId, null, cleanFrom, customerName, reason, new Date(newDueDate));
            return true;
        }

        // Check if this customer has any active invoice delivered to them
        const activeSale = await findActiveCustomerSale(cleanFrom);
        if (activeSale) {
            await activeSale.populate("businessId");
        }

        if (activeSale) {
            const bal = activeSale.totalAmount - (activeSale.payments || []).reduce((s, p) => s + p.amount, 0);

            // If they mention paying, trigger the Pay Full / Pay Part flow directly
            if (/pay|payment|transfer|link|invoice/i.test(lowerText)) {
                await handleCustomerPayNow(activeSale._id, cleanFrom);
                return true;
            }

            // If they ask for more time
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

            // Send Kreddy AI contact card so the customer sees "Kreddy AI" in chat header
            sendKreddyContactCard(cleanCustomerPhone).catch(() => {});

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
    const templateName = "kreddy_customer_invoice_v2";

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

    const canRequestExt = (sale.extensionsCount || 0) < 2
        && sale.lifecycleStatus !== "EXTENSION_REQUESTED";

    // V2 template: both buttons are Quick Replies — customer stays in WhatsApp
    // Button 0: Pay with Transfer (static payload "pay_now")
    components.push({
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: "pay_now" }]
    });

    // Button 1: Request Extension (static payload "req_ext") — only if eligible
    if (canRequestExt) {
        components.push({
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: "req_ext" }]
        });
    }

    try {
        console.log(`📨 [${sequenceLabel}] Sending ${templateName} template to ${cleanTo}...`);
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
            { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
        );
        return true;
    } catch (err) {
        console.error(`❌ sendCustomerReminderTemplate Error:`, err.response?.data || err.message);
        return false;
    }
};

const findActiveCustomerSale = async (phone) => {
    if (!phone) return null;
    const clean = String(phone).replace(/\D/g, "");
    const plus = "+" + clean;
    const alt = clean.startsWith("234") ? "0" + clean.slice(3) : (clean.startsWith("0") ? "234" + clean.slice(1) : null);
    const formats = [clean, plus, alt, phone].filter(Boolean);

    return await Sale.findOne({
        $or: [
            { deliveredToPhone: { $in: formats } },
            { customerPhone: { $in: formats } }
        ],
        status: { $ne: "paid" },
        lifecycleStatus: { $in: ["DELIVERED", "VIEWED", "EXTENSION_REQUESTED", "EXTENSION_GRANTED", "EXTENSION_REJECTED", "PARTIALLY_PAID"] }
    }).sort({ customerDeliveredAt: -1 });
};

const isCustomerPhone = async (phone) => {
    const activeSale = await findActiveCustomerSale(phone);
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
    handleCustomerPayFull,
    handleCustomerPayPart,
    handleCustomerRequestExtension,
    handleCustomerCustomDate,
    handleCustomerExtensionDuration,
    handleMerchantApproveExtension,
    handleMerchantRejectExtension,
    isCustomerPhone,
    findActiveCustomerSale,
    sendCustomerReminderTemplate,
    sendInteractiveButtons,
    sendInteractiveCTAUrlButton,
    sendInteractiveList,
    sendDocument,
    sendImage,
    sendText,
    sendTemplateMsg,
    sendCustomerMessageWithFallback,
    normalizePhone
};
