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
            case "awaiting_edit_field":
                return await this.handleEditField(buttonId, state, opts);
            case "awaiting_edit_value":
                return await this.handleEditValue(text, state, opts);
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
     * Handles: Send Invoice | Cancel | Review & Edit
     */
    async handleConfirmation(text, buttonId, message, state, profile, opts) {
        const lowerText = text.toLowerCase().trim();

        // 1. Send Invoice / Send Receipt
        if (buttonId === "invoice_yes" || this.isConfirmation(lowerText)) {
            const { customerName, totalAmount, paidAmount, items, item, dueDate, invoiceType, customerPhone } = state.data;

            await this.complete(state);

            const hasBank = !!(profile.bankDetails?.accountNumber && profile.bankDetails?.bankCode);
            const User = require("../../models/User");
            const ownerId = profile.ownerId?._id || profile.ownerId;
            const ownerUser = await User.findById(ownerId);
            const isVerified = (ownerUser && ownerUser.bankVerified) || hasBank;

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
                lifecycleStatus: isVerified ? "PENDING_DELIVERY" : "AWAITING_BANK_SETUP"
            });
            await newSale.save();

            if (!isVerified) {
                if (ownerUser) {
                    ownerUser.pendingAction = {
                        type: "SEND_INVOICE",
                        saleId: newSale._id,
                        from: opts.from,
                        customerPhone: customerPhone || null
                    };
                    await ownerUser.save();
                }

                await MessageDispatcher.send(
                    opts.from,
                    `Invoice #${newSale.invoiceNumber} for *${newSale.customerName}* (₦${newSale.totalAmount.toLocaleString()}) is ready.\n\nBefore I deliver it, where should customer payments be deposited?\n\nReply with your Bank Name & Account Number (e.g. GTBank 0123456789).`
                );
                return true;
            }

            const isSettled = (paidAmount || 0) >= totalAmount;
            await MessageDispatcher.send(
                opts.from,
                `On it — generating ${isSettled ? "Receipt" : "Invoice"} #${newSale.invoiceNumber} for *${newSale.customerName}* now. I'll send you a copy as soon as it's delivered.`
            );

            const WorkflowEventBus = require("../../conversation/WorkflowEventBus");
            WorkflowEventBus.publish("InvoiceCreated", {
                saleId: newSale._id,
                businessId: profile._id,
                from: opts.from,
                cleanFrom: opts.cleanFrom,
                isStaff: opts.isStaff,
                customerPhone: customerPhone || null,
                totalAmount: totalAmount,
                customerName: customerName || "Customer"
            });
            return true;
        }

        // 2. 1-Tap Toggle: Mark as Paid
        if (buttonId === "invoice_mark_paid" || lowerText === "mark as paid" || lowerText === "paid") {
            state.data.paidAmount = state.data.totalAmount;
            state.markModified("data");
            await state.save();
            await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, profile, opts.isStaff, state.data, state);
            return true;
        }

        // 3. 1-Tap Toggle: Switch to Unpaid
        if (buttonId === "invoice_switch_unpaid" || lowerText === "switch to unpaid" || lowerText === "unpaid") {
            state.data.paidAmount = 0;
            state.markModified("data");
            await state.save();
            await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, profile, opts.isStaff, state.data, state);
            return true;
        }

        // 4. Internal Bookkeeping Only (Save to Ledger without WhatsApp Message to Customer)
        if (buttonId === "invoice_save_internal" || lowerText === "just log for me" || lowerText === "save to ledger") {
            const { customerName, totalAmount, paidAmount, items, item, dueDate, invoiceType } = state.data;
            await this.complete(state);

            const newSale = new Sale({
                businessId: profile._id,
                customerName: customerName || "Walk-in Customer",
                description: items && items.length > 0 ? items.map(i => `${i.name} x${i.quantity}`).join(", ") : (item || "Purchase"),
                items: items || [],
                totalAmount,
                payments: (paidAmount && paidAmount > 0) ? [{ amount: paidAmount, method: "WhatsApp" }] : [],
                dueDate: dueDate ? new Date(dueDate) : undefined,
                recordedBy: opts.cleanFrom,
                invoiceType: invoiceType || "billing",
                lifecycleStatus: "DELIVERED"
            });
            await newSale.save();

            await MessageDispatcher.send(
                opts.from,
                `Done! 💼 Recorded ₦${totalAmount.toLocaleString()} for *${customerName || "Walk-in Customer"}* in your ledger.`
            );
            return true;
        }

        // 5. Memory Phone Safeguard: Different Person / Different Number
        if (buttonId === "invoice_diff_person" || lowerText === "different number" || lowerText === "new person") {
            delete state.data.customerPhone;
            delete state.data.autofilledFromMemory;
            state.step = "awaiting_customer_phone";
            state.markModified("data");
            await state.save();
            await MessageDispatcher.send(opts.from, `Got it! What's the customer's WhatsApp number?`);
            return true;
        }

        // 6. Cancel
        if (buttonId === "invoice_no" || this.isRejection(lowerText)) {
            await this.cancel(state, "merchant_cancelled");
            await MessageDispatcher.send(opts.from, messages.invoiceCancelled);
            return true;
        }

        // 7. Review & Edit — enter V2 guided edit flow
        if (buttonId === "invoice_edit" || lowerText === "edit" || lowerText === "review & edit" || lowerText === "edit details") {
            state.step = "awaiting_edit_field";
            state.markModified("data");
            await state.save();

            await MessageDispatcher.sendButtons(
                opts.from,
                "Review & Edit",
                messages.editFieldPrompt,
                "",
                buttons.editFieldSelection
            );
            return true;
        }

        // 8. After-edit "Edit Something Else" tap — re-enter field selection
        if (buttonId === "edit_more") {
            state.step = "awaiting_edit_field";
            delete state.data.editingField;
            state.markModified("data");
            await state.save();

            await MessageDispatcher.sendButtons(
                opts.from,
                "Review & Edit",
                messages.editFieldPrompt,
                "",
                buttons.editFieldSelection
            );
            return true;
        }

        // 9. Guide them back
        await MessageDispatcher.send(opts.from, messages.unknownDuringConfirmation);
        return true;
    }

    /**
     * Step: awaiting_edit_field
     * The merchant has tapped one of the field selection buttons.
     * Store which field they want to edit, transition to awaiting_edit_value,
     * and ask the specific guided question for that field.
     */
    async handleEditField(buttonId, state, opts) {
        const fieldMap = {
            "edit_field:customer": { field: "customerName", prompt: messages.askCustomerName, label: "Customer Name" },
            "edit_field:item":     { field: "item",         prompt: messages.askItem,         label: "Item / Description" },
            "edit_field:amount":   { field: "totalAmount",  prompt: messages.askAmount,        label: "Amount" },
            "edit_field:deposit":  { field: "paidAmount",   prompt: messages.askDeposit,       label: "Deposit" },
            "edit_field:duedate":  { field: "dueDate",      prompt: messages.askDueDate,       label: "Due Date" },
            "edit_field:phone":    { field: "customerPhone", prompt: messages.askPhone,        label: "Phone Number" }
        };

        const chosen = fieldMap[buttonId];
        if (!chosen) {
            // Unknown button — re-show the field selection
            await MessageDispatcher.sendButtons(
                opts.from,
                "Review & Edit",
                messages.editFieldPrompt,
                "",
                buttons.editFieldSelection
            );
            return true;
        }

        // Store which field is being edited so handleEditValue knows what to do
        state.data.editingField = chosen.field;
        state.step = "awaiting_edit_value";
        state.markModified("data");
        await state.save();

        await MessageDispatcher.send(opts.from, chosen.prompt);
        return true;
    }

    /**
     * Step: awaiting_edit_value
     * The merchant has typed the new value for the field stored in state.data.editingField.
     * Validate, apply, confirm, and ask "Anything else?".
     */
    async handleEditValue(text, state, opts) {
        const field = state.data.editingField;
        if (!field) {
            // Safety: no active edit field — bounce back to confirmation
            state.step = "awaiting_confirmation";
            state.markModified("data");
            await state.save();
            await this.proceedToInvoiceSummary(opts.from, opts.cleanFrom, null, false, state.data, state);
            return true;
        }

        let newValue = null;
        let displayValue = "";
        let validationError = null;

        // ── Validate per field ────────────────────────────────────────────────
        if (field === "customerName") {
            const trimmed = text.trim();
            if (trimmed.length < 2) {
                validationError = "That name seems too short. Please enter the customer's full name.";
            } else {
                newValue = trimmed.replace(/\b\w/g, c => c.toUpperCase());
                displayValue = newValue;
            }

        } else if (field === "item") {
            const trimmed = text.trim();
            if (trimmed.length < 2) {
                validationError = "That description seems too short. Please enter the item or service name.";
            } else {
                newValue = trimmed;
                displayValue = newValue;
            }

        } else if (field === "totalAmount" || field === "paidAmount") {
            const parsed = InvoiceEditParser.parseAmountFromText(text);
            if (parsed === null || parsed <= 0) {
                validationError = messages.invalidAmount;
            } else {
                newValue = parsed;
                displayValue = `₦${parsed.toLocaleString()}`;
            }

        } else if (field === "dueDate") {
            try {
                const chrono = require("chrono-node");
                const parsed = chrono.parseDate(text, new Date(), { forwardDate: true });
                if (!parsed) {
                    validationError = messages.invalidDate;
                } else {
                    newValue = parsed.toISOString();
                    displayValue = parsed.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                }
            } catch {
                validationError = messages.invalidDate;
            }

        } else if (field === "customerPhone") {
            const digits = InvoiceEditParser.parseSpokenPhoneNumber(text);
            if (digits.length < 10) {
                validationError = messages.invalidPhone;
            } else {
                let phone = digits;
                if (phone.startsWith("0") && phone.length === 11) phone = "234" + phone.slice(1);
                newValue = phone;
                displayValue = `+${phone}`;
            }
        }

        // ── Validation failed — re-prompt, stay on awaiting_edit_value ────────
        if (validationError) {
            await MessageDispatcher.send(opts.from, validationError);
            return true;
        }

        // ── Apply the change to state.data ────────────────────────────────────
        state.data[field] = newValue;
        delete state.data.editingField;

        // If editing total amount, validate paidAmount doesn't exceed it
        if (field === "totalAmount" && state.data.paidAmount > newValue) {
            state.data.paidAmount = 0; // reset deposit if it now exceeds new total
        }

        state.step = "awaiting_confirmation";
        state.markModified("data");
        await state.save();

        // ── Human-readable field label for confirmation message ────────────────
        const fieldLabels = {
            customerName:  "Customer name",
            item:          "Item description",
            totalAmount:   "Invoice amount",
            paidAmount:    "Deposit",
            dueDate:       "Due date",
            customerPhone: "Phone number"
        };
        const label = fieldLabels[field] || field;

        // ── Confirm the update and offer next steps (no summary re-render yet) ─
        const confirmMsg = messages.editConfirmed
            .replace("{field}", label)
            .replace("{value}", displayValue);

        await MessageDispatcher.sendButtons(
            opts.from,
            "Updated ✓",
            confirmMsg,
            "",
            buttons.afterEditActions
        );
        return true;
    }

    /**
     * Step: awaiting_multi_invoice_decision
     */
    async handleMultiInvoiceDecision(buttonId, state, profile, opts) {
        if (buttonId && buttonId.startsWith("multi_inv_continue:")) {
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
                // V2: Removed browser invoice page link
                const infoMsg = `Here is that existing invoice details for *${existingSale.customerName}*:\n\n*Invoice #${existingSale.invoiceNumber}*\nTotal: ₦${existingSale.totalAmount.toLocaleString()}\nOwes: *₦${bal.toLocaleString()}*`;
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
     * Shared helper to show the final summary or check for phone details & multi-invoice alerts.
     */
    async proceedToInvoiceSummary(from, cleanFrom, profile, isStaff, pendingData, state) {
        const { customerName, totalAmount, paidAmount, items, item, dueDate, invoiceType, customerPhone } = pendingData;
        const resolvedName = customerName || "Customer";

        // 1. Missing phone -> check memory or transition step
        if (!customerPhone) {
            let memoryPhone = null;
            let matchedName = null;
            try {
                const ConversationMemory = require("../../models/ConversationMemory");
                const memory = await ConversationMemory.findOne({ businessId: profile._id });
                if (memory) {
                    const matches = memory.findMatchingCustomers(resolvedName);
                    // Only auto-fill if there is a single high-confidence match or exact match
                    if (matches.length === 1 && matches[0].score >= 60) {
                        memoryPhone = matches[0].customer.phone;
                        matchedName = matches[0].customer.name;
                    } else if (matches.length > 1 && matches[0].score === 100 && matches[1].score < 100) {
                        // Exact match overrides other partial matches
                        memoryPhone = matches[0].customer.phone;
                        matchedName = matches[0].customer.name;
                    }
                }
            } catch (err) {
                console.error("🚨 Error querying conversation memory in proceedToInvoiceSummary:", err);
            }

            if (memoryPhone) {
                pendingData.customerPhone = memoryPhone;
                pendingData.autofilledFromMemory = true;
                pendingData.matchedMemoryName = matchedName;
                return await this.proceedToInvoiceSummary(from, cleanFrom, profile, isStaff, pendingData, state);
            }

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

        // 3. Render final Invoice Summary
        const effectivePaid = paidAmount || 0;
        const bal = totalAmount - effectivePaid;
        const isFullyPaid = bal <= 0 && effectivePaid > 0;
        const isPartial = effectivePaid > 0 && bal > 0;

        const itemsDisplay = items && items.length > 0
            ? items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity || 1} — ₦${((i.unitPrice || 0) * (i.quantity || 1)).toLocaleString()}`).join("\n")
            : `${item && item !== "Item" ? item : "Purchase"} — ₦${totalAmount.toLocaleString()}`;

        let statusText = "💳 Unpaid (Requesting Payment)";
        if (isFullyPaid) {
            statusText = "✅ Fully Paid (Receipt Mode)";
        } else if (isPartial) {
            statusText = `⏳ Partial (₦${effectivePaid.toLocaleString()} paid, ₦${bal.toLocaleString()} balance due)`;
        }

        let dueDateText = null;
        if (dueDate) {
            const d = new Date(dueDate);
            dueDateText = `Due Date: ${d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} 📅`;
        }

        const summaryLines = [
            `Here's the summary:`,
            ``,
            `Customer: *${resolvedName}*`,
            `Phone: +${cleanPhone}${pendingData.autofilledFromMemory ? ` (Matched: ${pendingData.matchedMemoryName || "memory"})` : ""}`,
            ``,
            itemsDisplay,
            ``,
            effectivePaid > 0 ? `Subtotal: ₦${totalAmount.toLocaleString()}` : null,
            effectivePaid > 0 ? `Paid: ₦${effectivePaid.toLocaleString()}` : null,
            `Total: ₦${totalAmount.toLocaleString()}`,
            bal > 0 && effectivePaid > 0 ? `Balance due: ₦${bal.toLocaleString()}` : null,
            dueDateText,
            ``,
            `Type: ${statusText}`,
            ``,
            `Ready to proceed. Shall I go ahead?`
        ].filter(v => v !== null).join("\n");

        state.step = "awaiting_confirmation";
        state.data = pendingData;
        state.markModified("data");
        await state.save();

        let actionButtons = buttons.invoiceConfirmationUnpaid;
        if (isFullyPaid) {
            actionButtons = buttons.invoiceConfirmationPaid;
        } else if (pendingData.autofilledFromMemory) {
            actionButtons = buttons.invoiceMemoryConfirmation;
        }

        await MessageDispatcher.sendButtons(
            from,
            isFullyPaid ? "Receipt Summary" : "Invoice Summary",
            summaryLines,
            "",
            actionButtons
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
