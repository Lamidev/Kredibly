const EscrowPayment = require("../models/EscrowPayment");
const { initiateTransfer } = require("./nomba");
const { sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");
const BusinessProfile = require("../models/BusinessProfile");

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

        // 2. Initiate Transfer via Nomba
        const transfer = await initiateTransfer({
            amount: escrow.amount,
            bankCode: profile.bankDetails.bankCode,
            accountNumber: profile.bankDetails.accountNumber,
            accountName: profile.bankDetails.accountName || profile.displayName,
            narration: `Escrow Release: ${escrow.reference}`
        });

        // 3. Update Status
        escrow.status = "released";
        escrow.transferReference = transfer?.data?.transactionId || `REL-${Date.now()}`;
        await escrow.save();

        // 4. Update Wallet UI (Since it was already credited to wallet on receipt, we now decrement it as it's moved to bank)
        await BusinessProfile.findByIdAndUpdate(profile._id, { $inc: { walletBalance: -escrow.amount } });

        // 5. Notify Merchant
        const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
        const msg = `🔓 *Escrow Released, ${bossTitle}!*\n\nYour security lock has expired, and I've just pushed *₦${escrow.amount.toLocaleString()}* to your bank account (${profile.bankDetails.bankName}).\n\n_Ref: ${escrow.transferReference}_`;
        await sendWhatsAppAlert(profile.whatsappNumber, bossTitle, msg).catch(e => console.error("Escrow Notify Fail:", e));

        console.log(`✅ Released Escrow ${escrow.reference} to ${profile.displayName}`);
        return { status: "completed", reference: escrow.transferReference };

    } catch (err) {
        console.error(`❌ Payout Error for escrow ${escrowId}:`, err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { processIndividualEscrowPayout };
