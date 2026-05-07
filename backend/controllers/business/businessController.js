const BusinessProfile = require("../../models/BusinessProfile");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");
const { logActivity } = require("../../utils/activityLogger");
const { getBanks, resolveAccount } = require("../../utils/nomba");
const { getIO } = require("../../utils/socket");
const User = require("../../models/User");

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
        const { displayName, entityType, sellMode, logoUrl, phoneNumber, whatsappNumber, address, assistantSettings, bankDetails, staffNumbers, prefersGatewayFeeAbsorption, kyc } = req.body;

        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (profile) {
            // 🛡️ IDENTITY LOCK: Prevent name changes if already verified to stop account hijacking
            if (profile.kyc?.status === 'verified' && displayName && displayName !== profile.displayName) {
                return res.status(403).json({ success: false, message: "You cannot change your business name after verification for security reasons. Please contact support." });
            }

            profile.displayName = displayName || profile.displayName;
            profile.entityType = entityType || profile.entityType;
            profile.sellMode = sellMode || profile.sellMode;
            profile.logoUrl = logoUrl || profile.logoUrl;
            profile.phoneNumber = phoneNumber || profile.phoneNumber;
            profile.whatsappNumber = whatsappNumber ? cleanPhone(whatsappNumber) : profile.whatsappNumber;
            profile.address = address || profile.address;
            if (prefersGatewayFeeAbsorption !== undefined) profile.prefersGatewayFeeAbsorption = prefersGatewayFeeAbsorption;
            if (now < LAUNCH_DATE) {
                profile.trialExpiresAt = LAUNCH_DATE;
                profile.plan = 'chairman';
                profile.planStatus = 'trialing';
                profile.isLaunchPromo = true; 
            }
            if (assistantSettings) {
                profile.assistantSettings = {
                    ...profile.assistantSettings,
                    ...assistantSettings
                };
            }
            if (bankDetails) profile.bankDetails = bankDetails;
            if (kyc) {
                profile.kyc = {
                    ...profile.kyc,
                    ...kyc
                };
            }
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
            
            // 🚀 SUBACCOUNT INIT: Removed Paystack logic, using Nomba Auto-sweep instead.
            let subaccountCode = null;

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
                // Everyone is a Chairman during the extended pre-launch (May).
                plan: 'chairman', 
                planStatus: 'trialing',
                trialExpiresAt: now < LAUNCH_DATE ? LAUNCH_DATE : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Till launch, then 14d thereafter
                hasUsedTrial: true,
                isLaunchPromo: true, 
                walletBalance: 0,
                kyc: kyc || { status: 'pending', method: 'none' }
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

        // 3. Payout Strategy: Using Nomba Auto-sweep instead of Paystack Subaccounts.
        // We no longer create Paystack subaccounts here.
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
        
        // 5. SECURITY RESET: If identity was already verified, we RESET it.
        // The merchant MUST re-verify their BVN against the NEW bank account.
        // This prevents attackers from "waiting out" the 24h lock.
        if (!isInitialSetup && profile.kyc?.status === 'verified') {
            console.log(`🛡️ SECURITY RESET: ${profile.displayName} changed bank. KYC reverted to pending.`);
            profile.kyc.status = 'pending';
            profile.kyc.tier = 1; // Back to basic
            profile.kyc.rejectionReason = "Bank details changed. Re-verification required for safety.";
        }

        await profile.save();

        // 6. SEND SECURITY NOTIFICATION (Only for Changes)
        if (!isInitialSetup) {
            const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
            const securityMsg = `Your payout bank account was just updated to ${resolvedDetails.account_name} (${bankName}).\n\n🛡️ *Safety Lock:* For your security, instant payouts are paused for 24 hours. Your identity verification has also been reset—you must re-verify your BVN against this new account to resume instant settlements.\n\n_If you did not make this change, please contact support immediately!_`;
            
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

/**
 * 🛡️ KYC VERIFICATION ENGINE (Paystack BVN-Match Edition)
 * Verifies that the provided BVN matches the registered bank account.
 */
exports.verifyKYC = async (req, res) => {
    try {
        const { type, idNumber, dob } = req.body;
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
        if (profile.kyc?.status === 'verified') return res.status(400).json({ success: false, message: "You are already verified!" });

        // 🛡️ SECURITY: Must have bank details to match against
        if (!profile.bankDetails?.accountNumber || !profile.bankDetails?.bankCode) {
            return res.status(400).json({ success: false, message: "Please set your payout bank account in 'Payout Settings' before verifying your identity." });
        }

        console.log(`🛡️ KYC Verification Started: ${profile.displayName} (${profile.bankDetails.bankName}) via ${type.toUpperCase()}`);
        console.log(`💡 Details: Account ${profile.bankDetails.accountNumber}, Nomba Code: ${profile.bankDetails.bankCode}`);

        let isMatch = false;
        let matchMessage = "";

        // 🧪 SIMULATION MODE (For development or if Paystack Identity isn't active yet)
        if (process.env.SIMULATE_KYC === 'true' || idNumber === '00000000000') {
            console.log("🧪 KYC Simulation Active");
            isMatch = true;
            matchMessage = "BVN match successful (Simulated)";
        } else {
            // 🚀 REAL PAYSTACK BVN MATCH
            const { matchBVN, getPaystackBankCode, resolveAccount } = require("../../utils/paystack");
            try {
                // Map the bank code to Paystack-specific version if needed (e.g. OPay 305 -> 999992)
                const paystackCode = getPaystackBankCode(profile.bankDetails.bankCode);
                console.log(`🚀 Calling Paystack Match BVN with code: ${paystackCode}`);
                
                try {
                    const result = await matchBVN(
                        profile.bankDetails.accountNumber,
                        paystackCode,
                        idNumber,
                        dob || null // Optional Date of Birth (YYYY-MM-DD)
                    );
                    // Paystack returns { status: true, message: "...", data: { account_number: true, ... } }
                    isMatch = result === true || (result && result.account_number === true);
                    matchMessage = "BVN verification successful";
                } catch (bvnErr) {
                    // 🛡️ SMART FINTECH FALLBACK
                    // If the bank code is rejected (common for fintechs like OPay/PalmPay), 
                    // we verify the account name manually via Account Resolution.
                    if (bvnErr.message.toLowerCase().includes('bank code is invalid')) {
                        console.log(`🧠 Smart Fallback: Bank ${profile.bankDetails.bankName} doesn't support direct BVN match. Resolving account name instead...`);
                        
                        const resolvedData = await resolveAccount(profile.bankDetails.accountNumber, paystackCode);
                        const accountName = resolvedData.account_name; // e.g. "SAMUEL OLAMIDE"
                        
                        // Get the User's registered name for comparison
                        const user = await User.findById(req.user._id);
                        const registeredName = user?.name || profile.displayName;

                        // fuzzy match: Require at least 2 significant name parts (length > 2) to match
                        const cleanAccount = accountName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const nameParts = registeredName.toLowerCase().split(' ').filter(p => p.length > 2);
                        
                        // Count how many parts of the registered name appear in the bank account name
                        const matchedParts = nameParts.filter(part => cleanAccount.includes(part));

                        // 🛡️ SECURITY: Require at least 2 names to match (e.g. Surname and First Name)
                        // If they only have one name registered, we match that one.
                        const requiredMatches = Math.min(nameParts.length, 2);
                        const isSmartMatch = matchedParts.length >= requiredMatches && matchedParts.length > 0;

                        if (isSmartMatch) {
                            console.log(`✅ Smart Match Success: ${matchedParts.length}/${nameParts.length} parts matched. "${accountName}" vs "${registeredName}"`);
                            isMatch = true;
                            matchMessage = "Identity verified via Smart Multi-Part Name Match (Fintech Fallback)";
                        } else {
                            console.warn(`❌ Smart Match Fail: Only ${matchedParts.length}/${nameParts.length} parts matched. Account: "${accountName}" vs Registered: "${registeredName}"`);
                            throw new Error("Account name mismatch. The bank account name must closely match your registered owner name.");
                        }
                    } else {
                        throw bvnErr;
                    }
                }
            } catch (err) {
                console.error("❌ Paystack KYC Error:", err.message);
                return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
            }
        }

        if (isMatch) {
            profile.kyc = {
                status: 'verified',
                tier: 2,
                method: type,
                bvn: idNumber.substring(0, 4) + '****' + idNumber.slice(-2),
                verifiedAt: new Date()
            };

            // 🛡️ SECURITY UNLOCK: If there was a bank change lock, clear it now
            // since the BVN Match proves the merchant owns the new account.
            if (profile.bankDetails?.bankDetailsLockUntil) {
                profile.bankDetails.bankDetailsLockUntil = null;
                console.log(`🔓 Security Lock Cleared for ${profile.displayName} via KYC Match`);
            }
            
            await profile.save();

            await logActivity({
                userId: req.user._id,
                businessId: profile._id,
                action: "KYC_VERIFIED",
                entityType: "BusinessProfile",
                entityId: profile._id,
                details: `Identity verified via ${type.toUpperCase()} (Tier 2)`
            });

            // 💸 TRIGGER ESCROW RELEASE (Moves held funds to bank account instantly)
            const { releaseMerchantEscrow } = require("../../utils/payouts");
            // Run in background to keep UI fast
            releaseMerchantEscrow(profile._id).catch(e => console.error("Escrow Release Post-KYC Fail:", e.message));

            // 📢 NOTIFY MERCHANT VIA WHATSAPP (Real-time alert)
            const { sendWhatsAppAlert } = require("../whatsapp/whatsappController");
            const bossTitle = profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss");
            const successMsg = `✅ *Account Verified!* Your identity match was successful. We've unlocked your instant settlements and released any held funds to your bank account. High power! 🚀`;
            sendWhatsAppAlert(profile.whatsappNumber, bossTitle, successMsg).catch(e => console.error("KYC Success WA Fail:", e.message));

            return res.status(200).json({ 
                success: true, 
                message: "Identity Verified! Your instant payouts are now active and any held funds are being released.",
                data: profile.kyc
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "BVN Mismatch: The identity details provided do not match your payout bank account. Please ensure you are using your own BVN." 
            });
        }

    } catch (error) {
        console.error("KYC Controller Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  updateProfile: exports.updateProfile,
  getProfile: exports.getProfile,
  getActivityLogs: exports.getActivityLogs,
  getBankList: exports.getBankList,
  resolveAccountDetails: exports.resolveAccountDetails,
  saveBankDetails: exports.saveBankDetails,
  verifyKYC: exports.verifyKYC
};
