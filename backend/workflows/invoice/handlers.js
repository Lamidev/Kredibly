/**
 * Invoice Creation Workflow Handlers
 */

const WorkflowBase = require("../_base/WorkflowBase");
const MessageDispatcher = require("../../conversation/MessageDispatcher");
const { InvoiceEditParser } = require("./validators");
const messages = require("./messages");
const buttons = require("./buttons");

// Models and Services
const Sale = require("../../models/Sale");
const Notification = require("../../models/Notification");
const { logActivity } = require("../../utils/activityLogger");
const { deliverInvoiceToCustomer } = require("../../utils/customerInvoiceService");

class InvoiceWorkflow extends WorkflowBase {
    constructor(manifest) {
        super(manifest);
    }

    /**
     * Main handle routing method.
     */
    async handle(step, message, state, profile, opts) {
        const text = this.getText(message, opts);
        const buttonId = this.getButtonId(message);

        console.log(`[InvoiceWorkflow] Handling step "${step}" for ${opts.cleanFrom}`);

        switch (step) {
            case "awaiting_customer_phone":
                return await this.handleCustomerPhone(text, state, profile, opts);
            case "awaiting_confirmation":
                return await this.handleConfirmation(text, buttonId, message, state, profile, opts);
            case "awaiting_multi_invoice_decision":
                return await this.handleMultiInvoiceDecision(buttonId, state, profile, opts);
            default:
                console.warn(`[InvoiceWorkflow] Unknown step "${step}"`);
                return false;
        }
    }

    /**
     * Step: awaiting_customer_phone
     */
    async handleCustomerPhone(text, state, profile, opts) {
        const phone = this.parsePhone(text);
        if (!phone || phone.length < 10) {
            await MessageDispatcher.send(opts.from, messages.invalidPhone);
            return true; // stay in current step
        }

        // Merge phone into pending sale data
        const pendingData = {
            ...(state.data.pendingSaleData || state.data),
            customerPhone: phone
        };

        // Transition context step and proceed
        state.data = pendingData;
        await state.save();

        await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, profile, opts.isStaff, pendingData, state);
        return true;
    }

    /**
     * Step: awaiting_confirmation
     */
    async handleConfirmation(text, buttonId, message, state, profile, opts) {
        const lowerText = text.toLowerCase().trim();

        // 1. Check for Send Invoice confirmation
        if (buttonId === "invoice_yes" || this.isConfirmation(lowerText)) {
            const { customerName, totalAmount, paidAmount, items, item, dueDate, invoiceType, customerPhone } = state.data;

            // Immediately mark context as completed to return to free conversation
            await this.complete(state);

            const newSale = new Sale({
                businessId: profile._id,
                customerName: customerName || "Customer",
                description: items && items.length > 0 ? items.map(i => `${i.name} x${i.quantity}`).join(", ") : (item || "Purchase"),
                items: items || [],
                totalAmount,
                payments: (paidAmount && paidAmount > 0) ? [{ amount: paidAmount, method: "WhatsApp" }] : [],
                dueDate: dueDate ? new Date(dueDate) : undefined,
                recordedBy: opts.cleanFrom,
                invoiceType: invoiceType || "billing",
                customerPhone: customerPhone || undefined,
                lifecycleStatus: "PENDING_DELIVERY"
            });
            await newSale.save();

            // Immediate feedback
            await MessageDispatcher.send(
                opts.from,
                `On it — generating Invoice #${newSale.invoiceNumber} for *${newSale.customerName}* now. I'll send you a copy as soon as it's delivered.`
            );

            // Log notification & activity
            await Notification.create({
                businessId: profile._id,
                title: "Invoice Created via Kreddy",
                message: `₦${totalAmount.toLocaleString()} invoice created for ${customerName}.`,
                type: "sale",
                saleId: newSale._id
            });
            await logActivity({
                businessId: profile._id,
                action: "SALE_CREATED_WHATSAPP",
                entityType: "SALE",
                entityId: newSale._id,
                details: `Invoice #${newSale.invoiceNumber} created for ${customerName} via Kreddy`
            });

            // Notify staff's Oga if staff created it
            if (opts.isStaff && profile.whatsappNumber) {
                await MessageDispatcher.send(
                    profile.whatsappNumber,
                    `📢 *Staff Activity:* ${opts.cleanFrom} created Invoice #${newSale.invoiceNumber} for ${customerName} (₦${totalAmount.toLocaleString()}).`
                );
            }

            if (customerPhone) {
                // Deliver asynchronously
                deliverInvoiceToCustomer(newSale._id, profile._id, { customerPhone })
                    .then(async (result) => {
                        if (!result.success) {
                            await MessageDispatcher.send(opts.from, `I had trouble delivering the invoice to ${newSale.customerName}'s WhatsApp. Check the number and try sending manually from the dashboard.`);
                        }
                    })
                    .catch(e => console.error("Async delivery error:", e));
            }
            return true;
        }

        // 2. Check for Cancel
        if (buttonId === "invoice_no" || this.isRejection(lowerText)) {
            await this.cancel(state, "merchant_cancelled");
            await MessageDispatcher.send(opts.from, messages.invoiceCancelled);
            return true;
        }

        // 3. Check for Edit request
        if (buttonId === "invoice_edit" || lowerText === "edit" || lowerText === "edit details") {
            const sd = state.data;
            const itemsDisplay = sd.items && sd.items.length > 0
                ? sd.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity || 1} — ₦${((i.unitPrice || 0) * (i.quantity || 1)).toLocaleString()}`).join("\n")
                : `${sd.item && sd.item !== "Item" ? sd.item : "Purchase"} — ₦${(sd.totalAmount || 0).toLocaleString()}`;

            const phoneLine = sd.customerPhone ? `- *Phone:* +${sd.customerPhone}` : "";
            const paidLine = sd.paidAmount > 0 ? `- *Paid:* ₦${sd.paidAmount.toLocaleString()}` : "";
            const bal = (sd.totalAmount || 0) - (sd.paidAmount || 0);
            const balLine = bal > 0 && sd.paidAmount > 0 ? `- *Balance:* ₦${bal.toLocaleString()}` : "";

            const prompt = messages.editInstructions
                .replace("{customerName}", sd.customerName || "Customer")
                .replace("{phoneLine}", phoneLine)
                .replace("{itemsDisplay}", itemsDisplay)
                .replace("{totalAmount}", (sd.totalAmount || 0).toLocaleString())
                .replace("{paidLine}", paidLine)
                .replace("{balLine}", balLine)
                .replace(/\n\n+/g, "\n\n");

            await MessageDispatcher.send(opts.from, prompt);
            return true;
        }

        // 4. Try parsing inline edit commands
        const edit = InvoiceEditParser.parse(text);
        if (edit) {
            state.data[edit.field] = edit.value;
            state.markModified("data");
            await state.save();

            // Re-render invoice summary with new details
            await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, profile, opts.isStaff, state.data, state);
            return true;
        }

        // 5. Check if they are typing a phone number to fill missing details
        const possiblePhone = InvoiceEditParser.parseSpokenPhoneNumber(text);
        if (possiblePhone.length >= 10 && !state.data.customerPhone) {
            let cp = possiblePhone;
            if (cp.startsWith("0") && cp.length === 11) cp = "234" + cp.slice(1);
            state.data.customerPhone = cp;
            state.markModified("data");
            await state.save();

            await MessageDispatcher.send(opts.from, `Got it — I'll deliver the invoice to *+${cp}*. Tap *Send Invoice* to confirm, or *Cancel* to discard.`);
            return true;
        }

        // Guide them back
        await MessageDispatcher.send(opts.from, messages.unknownDuringConfirmation);
        return true;
    }

    /**
     * Step: awaiting_multi_invoice_decision
     */
    async handleMultiInvoiceDecision(buttonId, state, profile, opts) {
        if (buttonId && buttonId.startsWith("multi_inv_continue:")) {
            // Retrieve pending data, advance step, and proceed to summary
            const pendingInvoiceData = state.data.pendingInvoiceData || state.data;
            await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, profile, opts.isStaff, pendingInvoiceData, state);
            return true;
        }

        if (buttonId && buttonId.startsWith("multi_inv_view:")) {
            const saleId = buttonId.split(":")[1];
            const existingSale = await Sale.findById(saleId);
            await this.cancel(state, "merchant_viewed_existing");

            if (existingSale) {
                const bal = existingSale.totalAmount - existingSale.payments.reduce((s, p) => s + p.amount, 0);
                const link = `${process.env.FRONTEND_URL || "https://usekredibly.com"}/i/${existingSale.invoiceNumber}`;
                const infoMsg = `Here is that existing invoice details for *${existingSale.customerName}*:\n\n*Invoice #${existingSale.invoiceNumber}*\nTotal: ₦${existingSale.totalAmount.toLocaleString()}\nOwes: *₦${bal.toLocaleString()}*\n\nView here: ${link}`;
                await MessageDispatcher.send(opts.from, infoMsg);
            } else {
                await MessageDispatcher.send(opts.from, "I couldn't locate that existing invoice anymore.");
            }
            return true;
        }

        return false;
    }

    /**
     * proceedToInvoiceSummary
     * Shared helper to show the summary or check for phone details & multi-invoice alerts.
     */
    async proceedToInvoiceSummary(from, cleanFrom, profile, isStaff, pendingData, state) {
        const { customerName, totalAmount, paidAmount, items, item, dueDate, invoiceType, customerPhone } = pendingData;
        const resolvedName = customerName || "Customer";

        // 1. Missing phone -> transition step
        if (!customerPhone) {
            state.step = "awaiting_customer_phone";
            state.data = { pendingSaleData: pendingData };
            state.markModified("data");
            await state.save();

            await MessageDispatcher.send(from, `What's ${resolvedName}'s WhatsApp number so I can deliver the invoice?`);
            return;
        }

        let cleanPhone = String(customerPhone).replace(/\D/g, "");
        if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = "234" + cleanPhone.slice(1);

        // 2. Check for Multi-Invoice warning
        const existingUnpaid = await Sale.find({
            businessId: profile._id,
            customerPhone: cleanPhone,
            status: { $in: ["unpaid", "partial"] }
        }).sort({ createdAt: -1 }).limit(1);

        if (existingUnpaid.length > 0 && state.step !== "awaiting_multi_invoice_decision") {
            const existing = existingUnpaid[0];
            const existingBal = existing.totalAmount - (existing.payments || []).reduce((s, p) => s + p.amount, 0);
            const daysOld = Math.floor((Date.now() - new Date(existing.createdAt)) / (1000 * 60 * 60 * 24));

            state.step = "awaiting_multi_invoice_decision";
            state.data = { pendingInvoiceData: pendingData };
            state.markModified("data");
            await state.save();

            await MessageDispatcher.sendButtons(
                from,
                "Heads Up",
                `*${resolvedName}* already has an open invoice with you.\n\nInvoice *#${existing.invoiceNumber}* — *₦${existingBal.toLocaleString()}* outstanding (${daysOld} day${daysOld !== 1 ? "s" : ""} old).\n\nWould you like to create a separate invoice anyway, or view the existing one?`,
                "Every invoice stays independent",
                [
                    { id: `multi_inv_continue:${existing._id}`, title: "Create New Invoice" },
                    { id: `multi_inv_view:${existing._id}`, title: "View Existing" }
                ]
            );
            return;
        }

        // 3. Show Invoice Confirmation
        const effectivePaid = paidAmount || 0;
        const bal = totalAmount - effectivePaid;

        const itemsDisplay = items && items.length > 0
            ? items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity || 1} — ₦${((i.unitPrice || 0) * (i.quantity || 1)).toLocaleString()}`).join("\n")
            : `${item && item !== "Item" ? item : "Purchase"} — ₦${totalAmount.toLocaleString()}`;

        const summaryLines = [
            `Here's the invoice summary:`,
            ``,
            `Customer: *${resolvedName}*`,
            `Phone: +${cleanPhone}`,
            ``,
            itemsDisplay,
            ``,
            effectivePaid > 0 ? `Subtotal: ₦${totalAmount.toLocaleString()}` : null,
            effectivePaid > 0 ? `Paid: ₦${effectivePaid.toLocaleString()}` : null,
            `Total: ₦${totalAmount.toLocaleString()}`,
            bal > 0 && effectivePaid > 0 ? `Balance due: ₦${bal.toLocaleString()}` : null,
            ``,
            `Ready to send. Shall I go ahead?`
        ].filter(v => v !== null).join("\n");

        state.step = "awaiting_confirmation";
        state.data = pendingData;
        state.markModified("data");
        await state.save();

        await MessageDispatcher.sendButtons(
            from,
            "Invoice Summary",
            summaryLines,
            "",
            buttons.invoiceConfirmation
        );

        if (isStaff && profile.whatsappNumber) {
            await MessageDispatcher.send(
                profile.whatsappNumber,
                `📢 *Staff Activity:* ${cleanFrom} is creating an invoice for ${resolvedName} (₦${totalAmount.toLocaleString()}).`
            );
        }
    }
}

module.exports = InvoiceWorkflow;
