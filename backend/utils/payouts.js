const EscrowPayment = require('../models/EscrowPayment');
const BusinessProfile = require('../models/BusinessProfile');
const { initiateTransfer, getMerchantBalance } = require('./nomba');
const Notification = require('../models/Notification');

/**
 * 💸 RELEASE MERCHANT ESCROW
 * Sweeps all pending escrowed funds to the merchant's bank account.
 * Triggered after successful KYC verification or by the 24h security worker.
 */
const releaseMerchantEscrow = async (businessId) => {
    try {
        const business = await BusinessProfile.findById(businessId);
        if (!business) return { success: false, message: "Business not found" };

        const bankDetails = business.bankDetails;
        if (!bankDetails?.bankCode || !bankDetails?.accountNumber) {
            console.log(`⚠️ Release Escrow Skipped: No bank details for ${business.displayName}`);
            return { success: false, message: "No bank details configured" };
        }

        // Find all pending escrow payments that are ready for release
        // If releaseDate <= now, they are ready. 
        // NOTE: For KYC verification, we ignore releaseDate because KYC is the primary blocker.
        const pendingEscrows = await EscrowPayment.find({
            businessId: business._id,
            status: 'pending',
            $or: [
                { releaseDate: { $lte: new Date() } }, // 24h lock passed
                { businessId: business._id } // Explicit manual/KYC trigger
            ]
        });

        if (pendingEscrows.length === 0) return { success: true, message: "No pending escrow to release" };

        const totalAmount = pendingEscrows.reduce((sum, p) => sum + p.amount, 0);
        const threshold = 25; // ₦20 fee + ₦5 safety
        
        // Double check Main Wallet Balance first (Handle null for 403/Permission errors)
        const mainBalance = await getMerchantBalance();
        
        // 🛡️ FEARLESS PAYOUT: If we can't check the balance (null), we proceed with the transfer 
        // anyway as long as there is pending escrow.
        if (mainBalance !== null && mainBalance < threshold) {
            console.warn(`⚠️ Nomba Main Balance too low for threshold: ₦${mainBalance}`);
            return { success: false, message: "Main wallet balance low" };
        }

        const sweepAmount = Math.floor(Math.min(totalAmount, (mainBalance || totalAmount + threshold) - threshold));
        
        if (sweepAmount <= 0) return { success: true, message: "Nothing to sweep" };

        console.log(`⚡ Releasing Escrow: ₦${sweepAmount} for ${business.displayName}`);

        const transfer = await initiateTransfer({
            amount: sweepAmount,
            bankCode: bankDetails.bankCode,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName || business.displayName,
            narration: `Kredibly Release (Compliance)`
        });

        // Update all released records
        const transferRef = transfer?.data?.transactionId || `REL-${Date.now()}`;
        await EscrowPayment.updateMany(
            { _id: { $in: pendingEscrows.map(p => p._id) } },
            { status: 'released', transferReference: transferRef }
        );

        // Update Merchant Wallet UI (decrement since it was already added to wallet balance during webhook, 
        // but now it's physically moved to bank)
        // Actually, internalProcessNombaPayment adds it to wallet balance. 
        // When we sweep, we decrement it to show it's gone from Kredibly wallet to Bank.
        await BusinessProfile.findByIdAndUpdate(businessId, { $inc: { walletBalance: -sweepAmount, heldBalance: -sweepAmount } });

        // Notification
        await Notification.create({
            businessId: business._id,
            title: "Escrow Released",
            message: `₦${sweepAmount.toLocaleString()} has been released to your bank account following verification.`,
            type: "confirmation"
        });

        console.log(`✅ Escrow Released SUCCESSFULLY for ${business.displayName}`);
        return { success: true, amount: sweepAmount };

    } catch (err) {
        console.error('❌ releaseMerchantEscrow Error:', err.message);
        return { success: false, message: err.message };
    }
};

module.exports = {
    releaseMerchantEscrow
};
