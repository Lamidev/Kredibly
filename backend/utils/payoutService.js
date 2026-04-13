const EscrowPayment = require("../models/EscrowPayment");
const { createTransferRecipient, initiateTransfer } = require("./paystack");
const { sendWhatsAppMessage, sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");

/**
 * Processes an individual escrow payout.
 * @param {Object} escrowId - The ID of the EscrowPayment to process.
 * @returns {Promise<Object>} - Status of the operation.
 */
const processIndividualEscrowPayout = async (escrowId) => {
    try {
        const escrow = await EscrowPayment.findById(escrowId).populate("businessId");
        if (!escrow) return { status: "failed", error: "Escrow not found" };
        if (escrow.status !== "pending") return { status: "skipped", reason: "Already processed" };

        const profile = escrow.businessId;

        // 🛑 SAFETY VALVE
        if (!profile || profile.isCompromised) {
            console.warn(`🛑 Skipping Escrow Release for ${profile?.displayName || 'Unknown'}: Account Flagged or Missing.`);
            escrow.status = "frozen";
            await escrow.save();
            return { status: "failed", error: "Account compromised or missing" };
        }

        // 1. Ensure we have a bank to send to
        if (!profile.bankDetails?.accountNumber || !profile.bankDetails?.bankCode) {
            return { status: "failed", error: "Missing bank details" };
        }

        // 2. Create Transfer Recipient
        const recipient = await createTransferRecipient(
            profile.bankDetails.accountName || profile.displayName,
            profile.bankDetails.accountNumber,
            profile.bankDetails.bankCode
        );

        // 3. Initiate Transfer
        const transfer = await initiateTransfer(
            escrow.amount,
            recipient.recipient_code,
            `Escrow Release: ${escrow.reference}`
        );

        // 4. Update Status
        escrow.status = "released";
        escrow.transferReference = transfer.reference;
        await escrow.save();

        // 5. Notify Merchant
        const msg = `🔓 *Escrow Released, Chairman!*\n\nYour security lock has expired, and I've just pushed *₦${escrow.amount.toLocaleString()}* to your bank account (${profile.bankDetails.bankName}).\n\n_Ref: ${transfer.reference}_`;
        await sendWhatsAppAlert(profile.whatsappNumber, "Chairman", msg).catch(e => console.error("Escrow Notify Fail:", e));

        console.log(`✅ Released Escrow ${escrow.reference} to ${profile.displayName}`);
        return { status: "completed", reference: transfer.reference };

    } catch (err) {
        console.error(`❌ Payout Error for escrow ${escrowId}:`, err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { processIndividualEscrowPayout };
