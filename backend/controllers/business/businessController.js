const BusinessProfile = require("../../models/BusinessProfile");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");
const { logActivity } = require("../../utils/activityLogger");
const { getBanks, resolveAccount, createSubaccount } = require("../../utils/paystack");
const { getIO } = require("../../utils/socket");

const cleanPhone = (num) => {
    if (!num) return num;
    if (typeof num !== 'string') num = num.toString();
    let clean = num.replace(/\D/g, ''); // Remove all non-digits
    if (clean.startsWith('0') && clean.length === 11) {
        clean = '234' + clean.slice(1);
    }
    return clean;
};

exports.updateProfile = async (req, res) => {
    try {
        const { displayName, entityType, sellMode, logoUrl, phoneNumber, whatsappNumber, address, assistantSettings, bankDetails, staffNumbers, prefersGatewayFeeAbsorption } = req.body;

        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (profile) {
            profile.displayName = displayName || profile.displayName;
            profile.entityType = entityType || profile.entityType;
            profile.sellMode = sellMode || profile.sellMode;
            profile.logoUrl = logoUrl || profile.logoUrl;
            profile.phoneNumber = phoneNumber || profile.phoneNumber;
            profile.whatsappNumber = whatsappNumber ? cleanPhone(whatsappNumber) : profile.whatsappNumber;
            profile.address = address || profile.address;
            if (prefersGatewayFeeAbsorption !== undefined) profile.prefersGatewayFeeAbsorption = prefersGatewayFeeAbsorption;
            if (assistantSettings) {
                profile.assistantSettings = {
                    ...profile.assistantSettings,
                    ...assistantSettings
                };
            }
            if (bankDetails) profile.bankDetails = bankDetails;
            if (staffNumbers) {
                const planLimit = profile.plan === 'chairman' ? Infinity : (profile.plan === 'oga' ? 1 : 0);
                if (staffNumbers.length > planLimit) {
                    return res.status(403).json({ 
                        success: false, 
                        message: `Staff limit exceeded. Your ${profile.plan.toUpperCase()} plan allows only ${planLimit} staff member. Upgrade to Chairman for unlimited staff.` 
                    });
                }
                profile.staffNumbers = staffNumbers.map(n => cleanPhone(n)).filter(n => n);
            }
            await profile.save();
        } else {
            // New Profile Creation: Check if user is from Waitlist
            const waitlistEntry = await Waitlist.findOne({ email: req.user.email });
            
            // 🚀 SUBACCOUNT INIT: If bank details are provided during onboarding, set up Paystack immediately
            let subaccountCode = null;
            if (bankDetails && bankDetails.accountNumber && bankDetails.bankCode) {
                try {
                    const subaccount = await createSubaccount(
                        displayName, 
                        bankDetails.bankCode, 
                        bankDetails.accountNumber,
                        0 
                    );
                    subaccountCode = subaccount.subaccount_code;
                } catch (err) {
                    console.error("Onboarding Subaccount Error:", err.message);
                    // We don't fail the whole onboarding if Paystack is down, but we log it
                }
            }

            const { LAUNCH_DATE } = require('../../config/pricing');
            const now = new Date();

            profile = new BusinessProfile({
                ownerId: req.user._id,
                displayName,
                entityType,
                sellMode,
                logoUrl,
                phoneNumber,
                whatsappNumber: cleanPhone(whatsappNumber),
                address,
                assistantSettings,
                bankDetails: bankDetails ? {
                    ...bankDetails,
                    lastBankChangeAt: new Date(),
                    bankDetailsLockUntil: null // No lock for the very first setup!
                } : {},
                paystackSubaccountCode: subaccountCode,
                staffNumbers: staffNumbers ? staffNumbers.map(n => cleanPhone(n)).filter(n => n) : [],
                
                // 🚀 PRE-LAUNCH STRATEGY: 
                // Everyone is an Oga during pre-launch. Paid plans active from Launch Day (May 1st).
                plan: 'oga', 
                planStatus: 'trialing',
                trialExpiresAt: now < LAUNCH_DATE ? LAUNCH_DATE : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Till launch, then 14d thereafter
                hasUsedTrial: true,
                isLaunchPromo: true, 
                walletBalance: 0 
            });

            await profile.save();

            // Update Waitlist status
            if (waitlistEntry) {
                waitlistEntry.status = 'active';
                await waitlistEntry.save();
            }

            // 📧 SEND ONBOARDING SUCCESS EMAIL (fires once, when profile is first created)
            const { sendOnboardingSuccessEmail } = require("../../emailLogic/emails");
            sendOnboardingSuccessEmail(req.user.email, req.user.name, displayName)
              .catch(err => console.error("Onboarding Email Fail:", err.message));

            await logActivity({
                userId: req.user._id,
                businessId: profile._id,
                action: "PROFILE_CREATED",
                details: "Completed merchant onboarding"
            });
            
            return res.status(201).json({ success: true, data: profile });
        }

        await logActivity({
            businessId: profile._id,
            action: "PROFILE_UPDATED",
            entityType: "PROFILE",
            details: `Updated business profile for ${profile.displayName}`
        });

        // 🔌 Real-time update for all open pages (like public invoices)
        const io = getIO();
        if (io) {
            io.to(String(profile._id).toLowerCase()).emit("merchant_updated", {
                businessId: profile._id,
                updatedFields: { prefersGatewayFeeAbsorption }
            });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuccessFeeByPlan = (plan) => {
    switch (plan) {
        case "chairman": return 0;   // 0% Platform Fee
        case "oga": return 0;        // 0% Platform Fee
        case "hustler": return 0;     // 0% Platform Fee
        default: return 0;
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Ensure successFee is synced with current plan
        const expectedFee = getSuccessFeeByPlan(profile.plan);
        if (profile.successFeePercentage !== expectedFee) {
            profile.successFeePercentage = expectedFee;
            await profile.save();
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getActivityLogs = async (req, res) => {
    try {
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        const logs = await ActivityLog.find({ businessId: profile._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// -----------------------------------------------------
// PAYOUT SETTINGS (Just-in-Time Subaccounts)
// -----------------------------------------------------

/**
 * Get List of Banks for Dropdown
 */
exports.getBankList = async (req, res) => {
    try {
        const banks = await getBanks();
        res.status(200).json({ success: true, data: banks });
    } catch (error) {
        console.error("Bank List Error:", error);
        res.status(500).json({ success: false, message: "Could not fetch banks" });
    }
};

/**
 * Resolve Account Number for UI Feedback
 */
exports.resolveAccountDetails = async (req, res) => {
    try {
        const { bankCode, accountNumber } = req.params;
        const details = await resolveAccount(accountNumber, bankCode);
        res.status(200).json({ success: true, data: details });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Save Bank Details & Create Subaccount
 */
exports.saveBankDetails = async (req, res) => {
    try {
        const { bankCode, accountNumber, bankName, password } = req.body;
        
        if (!password) {
             return res.status(400).json({ success: false, message: "Password is required to change bank details." });
        }

        // 1. Verify Password (Security Guard)
        const User = require("../../models/User");
        const user = await User.findById(req.user._id).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
             return res.status(401).json({ success: false, message: "Incorrect password. Changes not saved." });
        }
        
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Business profile not found" });

        // 2. Resolve Account (Verify Name)
        let resolvedDetails;
        try {
            resolvedDetails = await resolveAccount(accountNumber, bankCode);
            
            // SECURITY: Basic Name Match Check
            // We ensure at least one word from the business OR user's legal name exists in the bank account name
            const bizWords = profile.displayName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const userWords = user.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const allWords = [...new Set([...bizWords, ...userWords])];
            
            const bankNameLower = resolvedDetails.account_name.toLowerCase();
            const isMatch = allWords.some(w => bankNameLower.includes(w));
            
            if (!isMatch && !profile.isFoundingMember) { 
                 console.warn(`💳 Bank Name Mismatch: Business "${profile.displayName}", User "${user.name}" vs Bank "${resolvedDetails.account_name}"`);
                 return res.status(400).json({ success: false, message: `Bank account name (${resolvedDetails.account_name}) does not seem to match your business name (${profile.displayName}) or legal name (${user.name}).` });
            }
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid account number. Please check and try again." });
        }

        // 3. Create Paystack Subaccount (ALWAYS New for Fresh Details)
        // We create a new subaccount for every change to ensure the money goes to the right place immediately.
        let subaccountCode;
        try {
            const subaccount = await createSubaccount(
                profile.displayName, 
                bankCode, 
                accountNumber,
                0 // Zero Platform Fee
            );
            subaccountCode = subaccount.subaccount_code;
        } catch (err) {
            console.error("Paystack Subacct Create Error:", err.message);
            return res.status(500).json({ success: false, message: "Could not set up automatic payouts. Please try again later." });
        }
        // 4. Save to Profile + SECURITY LOCK (Smart Check)
        // Only lock if an account already existed AND it wasn't empty (This is a CHANGE, not first setup)
        const isInitialSetup = !profile.bankDetails?.accountNumber || profile.bankDetails.accountNumber === "";
        const lockUntil = isInitialSetup ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

        profile.bankDetails = {
            bankName: bankName,
            accountNumber: accountNumber,
            accountName: resolvedDetails.account_name,
            bankCode: bankCode,
            lastBankChangeAt: new Date(),
            bankDetailsLockUntil: lockUntil
        };
        profile.paystackSubaccountCode = subaccountCode;
        
        await profile.save();

        // 5. SEND SECURITY NOTIFICATION (Only for Changes)
        if (!isInitialSetup) {
            const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
            const securityMsg = `Your payout bank account was just updated to ${resolvedDetails.account_name} (${bankName}).\n\n🛡️ *Safety Lock:* For your security, instant payouts are paused for 24 hours. They will resume automatically tomorrow.\n\n_If you did not make this change, please contact support immediately!_`;
            
            const { sendWhatsAppAlert } = require("../whatsapp/whatsappController");
            await sendWhatsAppAlert(profile.whatsappNumber, bossTitle, securityMsg).catch(e => console.error("Security WA Fail:", e.message));

            const { sendSecurityAlertEmail } = require("../../emailLogic/emails");
            await sendSecurityAlertEmail(user.email, user.name, `${resolvedDetails.account_name} (${bankName})`).catch(e => console.error("Security Email Fail:", e.message));
        }

        await logActivity({
            userId: req.user._id,
            businessId: profile._id,
            action: "PAYOUT_UPDATED",
            entityType: "SYSTEM",
            details: `Updated payout account to ${resolvedDetails.account_name} (${bankName})`
        });

        res.status(200).json({ 
            success: true, 
            message: "Payout account active! Your money will now go directly to this bank.",
            data: {
                bankDetails: profile.bankDetails,
                isSet: true
            }
        });

    } catch (error) {
        console.error("Save Bank Details Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
