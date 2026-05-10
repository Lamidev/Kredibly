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
        DVA_FEE_CAP: 1000            // Maximum Nomba will charge on DVA collection
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
        // Nomba charges MAX(10, MIN(1000, 1% of Gross))
        if (netAmount <= 1000) {
            gross = netAmount + 10;
        } else if (netAmount >= 100000) {
            gross = netAmount + 1000;
        } else {
            gross = netAmount / (1 - FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE);
        }

        // 🎯 PROFESSIONAL ROUNDING: Always end with '0' for a clean invoice look (e.g., 5052 -> 5050)
        // Any tiny deficit caused by rounding down is covered by Akinbyte's main balance.
        return Math.round(gross / 10) * 10;
    },

    // Helper to calculate how much lands in the merchant's virtual wallet after DVA fees
    calculateNetAmount: (grossAmount) => {
        // Nomba takes MAX(10, MIN(1000, 1% of gross))
        const percentageFee = grossAmount * FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE;
        const actualDvaFee = Math.min(1000, Math.max(10, percentageFee));
        
        // This is what lands in the Kredibly wallet and is swept instantly.
        const net = grossAmount - actualDvaFee;
        return Math.floor(net);
    }
};

module.exports = FINANCIAL_CONFIG;
