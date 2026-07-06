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
            // Mark as bank_error so the hourly queuer never re-queues it
            escrow.status = "bank_error";
            await escrow.save();
            // Notify merchant to update their bank details
            try {
                const Notification = require("../models/Notification");
                await Notification.create({
                    businessId: profile._id,
                    title: "Payout Failed ❌",
                    message: `Your escrow payout (${escrow.reference}) could not be processed — your bank details are incomplete. Please update them in Settings > Bank Account.`,
                    type: "system"
                });
            } catch (notifErr) {
                console.error("Escrow Notify (Missing Bank): Failed to create notification:", notifErr.message);
            }
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
        const preferredName = profile.assistantSettings?.preferredName || profile.displayName || "Partner";
        const msg = `🔓 *Escrow Released, ${preferredName}!*\n\nYour security lock has expired, and I've just pushed *₦${escrow.amount.toLocaleString()}* to your bank account (${profile.bankDetails.bankName}).\n\n_Ref: ${escrow.transferReference}_`;
        await sendWhatsAppAlert(profile.whatsappNumber, preferredName, msg).catch(e => console.error("Escrow Notify Fail:", e));

        console.log(`✅ Released Escrow ${escrow.reference} to ${profile.displayName}`);
        return { status: "completed", reference: escrow.transferReference };

    } catch (err) {
        console.error(`❌ Payout Error for escrow ${escrowId}:`, err.message);

        // 🛑 PERMANENT FAILURE: Mark escrow as "bank_error" for specific Nomba errors
        // so the hourly queuer never re-queues this escrow again. The admin can
        // manually retry via Mission Control once the merchant fixes their bank details.
        const permanentErrorSignals = ['account not found', 'invalid account', 'invalid bank'];
        const isPermanent = permanentErrorSignals.some(sig => err.message?.toLowerCase().includes(sig));

        if (isPermanent) {
            try {
                const escrow = await EscrowPayment.findById(escrowId);
                if (escrow && escrow.status === 'pending') {
                    escrow.status = "bank_error";
                    await escrow.save();
                    console.warn(`⚠️ Escrow ${escrowId} marked as bank_error — invalid bank account. Admin retry required.`);

                    // Notify the merchant
                    const Notification = require("../models/Notification");
                    await Notification.create({
                        businessId: escrow.businessId,
                        title: "Payout Failed — Bank Error ❌",
                        message: `Your escrow payout could not be sent to your bank account: "${err.message}". Please verify your bank details in Settings > Bank Account and contact support.`,
                        type: "system"
                    }).catch(() => {});
                }
            } catch (markErr) {
                console.error("Failed to mark escrow as bank_error:", markErr.message);
            }
        }

        return { status: "failed", error: err.message };
    }
};

module.exports = { processIndividualEscrowPayout };
