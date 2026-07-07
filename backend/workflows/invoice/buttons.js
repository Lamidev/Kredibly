/**
 * Invoice Creation Workflow Buttons
 */

module.exports = {
    // Shown at the bottom of the invoice summary card
    invoiceConfirmation: [
        { id: "invoice_yes", title: "Send Invoice" },
        { id: "invoice_no", title: "Cancel" },
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
