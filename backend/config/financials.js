/**
 * 💰 KREDIBLY FINANCIAL CONFIGURATION
 * Centralized source of truth for all gateway fees and settlement logic.
 * Update these values if Nomba or the Government changes their pricing.
 */

const FINANCIAL_CONFIG = {
    NOMBA: {
        DVA_PERCENTAGE: 0.01,         // 1% collection fee (adjusted from 0.75% based on live observations)
        SWEEP_FEE_FLAT: 50,          // ₦50 covering transfer fee + safety buffer
        TRANSFER_FEES: {
            SMALL: 10,               // < ₦5,000
            MEDIUM: 25,              // ₦5,001 - ₦50,000
            LARGE: 50                // > ₦50,000
        },
        EMTL_STAMP_DUTY: 50,         // Government Electronic Money Transfer Levy
        MIN_INSTANT_SWEEP: 5000,     // Wait until ₦5k to auto-sweep to avoid eating micro-transaction profits (1% max loss)
        DVA_FEE_CAP: 1000            // Maximum Nomba will charge on DVA collection
    },
    
    getTransferFee: (amount) => {
        if (amount < 5000) return 10;
        if (amount <= 50000) return 25;
        return 50;
    },
    
    // Helper to calculate how much to charge a customer to ensure merchant gets 'A'
    // Under the new model, we ONLY pass the DVA collection fee to the customer. 
    // The ₦50 bulk sweep fee is absorbed by the merchant when the threshold is hit.
    calculateGrossAmount: (netAmount, absorbFees = false) => {
        if (absorbFees) return netAmount;
        
        // Nomba charges MAX(10, MIN(1000, 1% of Gross))
        // 1. Minimum cap (₦10) applies when Gross <= 1010 (Net <= 1000)
        // 2. Maximum cap (₦1000) applies when Gross >= 101000 (Net >= 100000)
        if (netAmount <= 1000) {
            return Math.ceil(netAmount + 10);
        } else if (netAmount >= 100000) {
            return Math.ceil(netAmount + 1000);
        } else {
            return Math.ceil(netAmount / (1 - FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE));
        }
    },

    // Helper to calculate how much lands in the merchant's virtual wallet after DVA fees
    calculateNetAmount: (grossAmount) => {
        // Nomba takes MAX(10, MIN(1000, 1% of gross))
        const percentageFee = grossAmount * FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE;
        const actualDvaFee = Math.min(1000, Math.max(10, percentageFee));
        
        // This is what lands in the Kredibly wallet.
        // The ₦50 bulk sweep fee will be deducted from the *total* wallet balance at payout.
        const net = grossAmount - actualDvaFee;
        return Math.floor(net);
    }
};

module.exports = FINANCIAL_CONFIG;
