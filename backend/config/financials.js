/**
 * 💰 KREDIBLY FINANCIAL CONFIGURATION
 * Centralized source of truth for all gateway fees and settlement logic.
 * Update these values if Nomba or the Government changes their pricing.
 */

const FINANCIAL_CONFIG = {
    NOMBA: {
        DVA_PERCENTAGE: 0.01,         // 1% collection fee (adjusted from 0.75% based on live observations)
        SWEEP_FEE_FLAT: 0,           // ₦0 (Kredibly absorbs the transfer fee for pioneers)
        TRANSFER_FEES: {
            SMALL: 10,               // < ₦5,000
            MEDIUM: 25,              // ₦5,001 - ₦50,000
            LARGE: 50                // > ₦50,000
        },
        EMTL_STAMP_DUTY: 50,         // Government Electronic Money Transfer Levy
        MIN_INSTANT_SWEEP: 0,        // All payments swept instantly
        DVA_FEE_CAP: 150             // Maximum Nomba will charge on DVA collection (capped at ₦150)
    },
    
    getTransferFee: (amount) => {
        if (amount < 5000) return 10;
        if (amount <= 50000) return 25;
        return 50;
    },
    
    // All payments are swept instantly to the merchant.
    calculateGrossAmount: (netAmount, absorbFees = false) => {
        if (absorbFees) return netAmount;
        
        let gross;
        // Nomba charges MAX(10, MIN(150, 1% of Gross))
        if (netAmount <= 990) {
            gross = netAmount + 10;
        } else if (netAmount >= 14850) {
            gross = netAmount + 150;
        } else {
            gross = netAmount / (1 - FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE);
        }

        // 🎯 PROFESSIONAL ROUNDING: Round UP to the nearest ₦5 to keep numbers clean and attractive (ends in 0 or 5)
        return Math.ceil(gross / 5) * 5;
    },

    // Helper to calculate how much lands in the merchant's virtual wallet after DVA fees
    calculateNetAmount: (grossAmount) => {
        // Nomba takes MAX(10, MIN(150, 1% of gross))
        const percentageFee = grossAmount * FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE;
        const actualDvaFee = Math.min(FINANCIAL_CONFIG.NOMBA.DVA_FEE_CAP, Math.max(10, percentageFee));
        
        // This is what lands in the Kredibly wallet and is swept instantly.
        const net = grossAmount - actualDvaFee;
        
        // Use round instead of floor to prevent ₦999.9 becoming ₦999
        return Math.round(net);
    }
};

module.exports = FINANCIAL_CONFIG;
