/**
 * Invoice Creation Workflow Buttons
 */

module.exports = {
    // Shown when invoice is unpaid or partially paid
    invoiceConfirmationUnpaid: [
        { id: "invoice_yes", title: "Send Invoice" },
        { id: "invoice_mark_paid", title: "Mark as Paid" },
        { id: "invoice_edit", title: "Review & Edit" }
    ],

    // Shown when invoice is already fully paid (Receipt mode)
    invoiceConfirmationPaid: [
        { id: "invoice_yes", title: "Send Paid Receipt" },
        { id: "invoice_switch_unpaid", title: "Switch to Unpaid" },
        { id: "invoice_edit", title: "Review & Edit" }
    ],

    // Shown when customer phone was autofilled from conversation memory
    invoiceMemoryConfirmation: [
        { id: "invoice_yes", title: "Send to Customer" },
        { id: "invoice_diff_person", title: "Different Number" },
        { id: "invoice_save_internal", title: "Just Log for Me" }
    ],

    // Default confirmation fallback
    invoiceConfirmation: [
        { id: "invoice_yes", title: "Send Invoice" },
        { id: "invoice_mark_paid", title: "Mark as Paid" },
        { id: "invoice_edit", title: "Review & Edit" }
    ],

    // Shown when merchant enters edit mode — one button per editable field
    editFieldSelection: [
        { id: "edit_field:customer", title: "Customer Name" },
        { id: "edit_field:item",     title: "Item / Description" },
        { id: "edit_field:amount",   title: "Amount" },
        { id: "edit_field:deposit",  title: "Deposit Paid" },
        { id: "edit_field:duedate",  title: "Due Date" },
        { id: "edit_field:phone",    title: "Phone Number" }
    ],

    // Shown after a field is successfully updated
    afterEditActions: [
        { id: "edit_more",   title: "Edit Something Else" },
        { id: "invoice_yes", title: "Send Invoice" },
        { id: "invoice_no",  title: "Cancel" }
    ]
};
