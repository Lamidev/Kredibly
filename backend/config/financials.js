/**
 * 💰 KREDIBLY FINANCIAL CONFIGURATION
 * Centralized source of truth for all gateway fees and settlement logic.
 * Update these values if Nomba or the Government changes their pricing.
 */

const FINANCIAL_CONFIG = {
    NOMBA: {
        DVA_PERCENTAGE: 0.0075,       // 0.75% collection fee
        SWEEP_FEE_FLAT: 50,          // ₦50 covering transfer fee + safety buffer
        TRANSFER_FEES: {
            SMALL: 10,               // < ₦5,000
            MEDIUM: 25,              // ₦5,001 - ₦50,000
            LARGE: 50                // > ₦50,000
        },
        EMTL_STAMP_DUTY: 50,         // Government Electronic Money Transfer Levy
        MIN_INSTANT_SWEEP: 20000,    // Min amount to trigger immediate bank transfer
        DVA_FEE_CAP: 1000            // Maximum Nomba will charge on DVA collection
    },
    
    // Helper to calculate how much to charge a customer to ensure merchant gets 'A'
    calculateGrossAmount: (netAmount, absorbFees = false) => {
        if (absorbFees) return netAmount;
        
        // Formula: Gross = (Net + FixedFees) / (1 - Percentage)
        // We use 50 as a safe flat fee to cover both transfer and stamp duty
        const fixedFees = FINANCIAL_CONFIG.NOMBA.SWEEP_FEE_FLAT;
        const percentage = FINANCIAL_CONFIG.NOMBA.DVA_PERCENTAGE;
        
        const gross = (netAmount + fixedFees) / (1 - percentage);
        return Math.ceil(gross);
    }
};

module.exports = FINANCIAL_CONFIG;
