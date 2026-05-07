const Sale = require('../../models/Sale');
const BusinessProfile = require('../../models/BusinessProfile');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const { initializePayment, verifyTransaction } = require('../../utils/paystack');
const { FINANCIAL_CONFIG } = require('../../config/financials');

/**
 * 🔗 VERIFY PAYSTACK PAYMENT (Subscriptions & Upgrades)
 */
exports.verifyPayment = async (req, res) => {
    const { reference, plan } = req.body;
    
    try {
        const paystackData = await verifyTransaction(reference);
        if (paystackData.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business not found" });

        // Update plan and status
        business.plan = plan.toLowerCase();
        business.planStatus = 'active';
        business.subscriptionReference = reference;
        await business.save();

        // Log the upgrade
        await ActivityLog.create({
            businessId: business._id,
            action: 'PLAN_UPGRADE',
            entityType: 'PROFILE',
            details: `Successfully upgraded to ${plan.toUpperCase()} plan via Paystack.`
        });

        res.status(200).json({ success: true, message: 'Plan upgraded successfully' });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 📈 GET UPGRADE QUOTE (Prorated calculation)
 */
exports.getUpgradeQuote = async (req, res) => {
    try {
        const business = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!business) return res.status(404).json({ message: "Business not found" });

        // Logic for proration could go here if needed
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🎯 INITIALIZE VIRTUAL ACCOUNT PAYMENT (Paystack Fallback)
 */
exports.initializeVirtualAccountPayment = async (req, res) => {
    try {
        const { saleId } = req.body;
        const sale = await Sale.findById(saleId).populate('businessId');
        if (!sale) return res.status(404).json({ message: "Invoice not found" });

        const amount = sale.totalAmount;
        const reference = `KREDDY_INV_${sale.invoiceNumber}_${Date.now()}_${Math.random().toString(36).substring(7)}`.toUpperCase();
        const safeEmail = (sale.customerEmail && sale.customerEmail.includes('@')) ? sale.customerEmail : 'payments@kredibly.com';

        // Check for security lock
        const lockUntil = sale.businessId.bankDetails?.bankDetailsLockUntil;
        const isLocked = lockUntil && new Date() < new Date(lockUntil);
        
        const subaccountCode = isLocked ? null : sale.businessId.paystackSubaccountCode;
        
        // 🛡️ SUBACCOUNT STATUS SHIELD:
        // If it's locked by a recent bank details change, we force Escrow.
        // Otherwise, we always try to use the subaccount. If Paystack rejects it, the try/catch fallback kicks in.
        const effectiveSubaccount = isLocked ? null : subaccountCode;
        const effectiveBearer = effectiveSubaccount ? 'subaccount' : 'none';

        if (isLocked) {
            console.log(`🛡️ Escrow Active for ${sale.businessId.displayName}. Security Lock.`);
        }

        let paystackInit;
        try {
            paystackInit = await initializePayment(
                safeEmail, 
                amount, 
                reference, 
                { paymentType: 'invoice', invoiceNumber: sale.invoiceNumber, originalAmount: Number(amount) },
                effectiveSubaccount,
                effectiveBearer, 
                ['bank_transfer', 'bank']
            );
        } catch (initErr) {
            console.error("💡 Paystack Initialization Error (Subaccount Fail?):", initErr.message);
            // 🛡️ FALLBACK: If Subaccount fails, try standard payment to Kredibly Main Account (automatic Escrow)
            if (subaccountCode) {
                 console.log("🛡️ Falling back to ESCROW payment for", sale.invoiceNumber);
                 paystackInit = await initializePayment(
                    safeEmail, 
                    amount, 
                    reference, 
                    { paymentType: 'invoice', invoiceNumber: sale.invoiceNumber, originalAmount: Number(amount), subaccountError: true },
                    null, // No subaccount
                    'none', 
                    ['bank_transfer', 'bank']
                );
            } else {
                throw initErr; // Real error
            }
        }

        res.status(200).json({
            success: true,
            publicKey: process.env.PAYSTACK_PUBLIC_KEY,
            email: safeEmail,
            amount,
            accessCode: paystackInit.access_code,
            reference,
            metadata: { 
                paymentType: 'invoice', 
                invoiceNumber: sale.invoiceNumber, 
                originalAmount: Number(amount),
                isEscrowed: isLocked
            }
        });

    } catch (error) {
        console.error("Initialize Paystack Error:", error);
        res.status(500).json({ message: "Payment initialization failed" });
    }
};

/**
 * 🛡️ VERIFY INVOICE PAYMENT
 */
exports.verifyInvoicePayment = async (req, res) => {
    // This is handled by handlePaystackWebhook in webhookController,
    // but we can have a manual fallback here if needed.
    res.status(200).json({ success: true, message: "Webhook will handle verification shortly." });
};
exports.initializePaystackPayment = exports.initializeVirtualAccountPayment;
