const BusinessProfile = require("../../models/BusinessProfile");
const ActivityLog = require("../../models/ActivityLog");
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
        const { LAUNCH_DATE } = require('../../config/pricing');
        const now = new Date();

        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (profile) {
            // 🛡️ IDENTITY LOCK: Prevent name changes if already verified to stop account hijacking
            if (profile.kyc?.status === 'verified' && displayName && displayName !== profile.displayName) {
                return res.status(403).json({ success: false, message: "You cannot change your business name after verification for security reasons. Please contact support." });
            }

            const oldOnboardingStep = profile.onboardingStep; // Track for email trigger

            profile.displayName = displayName || profile.displayName;
            profile.entityType = entityType || profile.entityType;
            profile.sellMode = sellMode || profile.sellMode;
            profile.logoUrl = logoUrl || profile.logoUrl;
            profile.phoneNumber = phoneNumber || profile.phoneNumber;
            profile.whatsappNumber = whatsappNumber ? cleanPhone(whatsappNumber) : profile.whatsappNumber;
            profile.address = address || profile.address;
            if (prefersGatewayFeeAbsorption !== undefined) profile.prefersGatewayFeeAbsorption = prefersGatewayFeeAbsorption;
            
            // 🚀 LAUNCH PROMO: Auto-upgrade to Chairman for everyone until June 1st
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

            // 📧 ONBOARDING SUCCESS EMAIL: Send if they just finished onboarding (step 4)
            if (req.body.onboardingStep === 4 && oldOnboardingStep < 4) {
                const { sendOnboardingSuccessEmail } = require("../../emailLogic/emails");
                const planTitle = profile.plan === 'chairman' ? 'Chairman' : (profile.plan === 'oga' ? 'Oga' : 'Boss');
                sendOnboardingSuccessEmail(req.user.email, req.user.name, profile.displayName, planTitle)
                  .catch(err => console.error("Onboarding Email Fail:", err.message));
                
                profile.onboardingStep = 4;
            }

            await profile.save();
        } else {
            
            // 🚀 SUBACCOUNT INIT: Removed Paystack logic, using Nomba Auto-sweep instead.
            let subaccountCode = null;

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
                kyc: kyc || { status: 'pending', method: 'none' },
                onboardingStep: req.body.onboardingStep || 0
            });

            await profile.save();
            console.log(`🚀 PROFILE CREATED: ${profile.displayName} (${req.user.email})`);


            // 📧 SEND ONBOARDING SUCCESS EMAIL (only if created at step 4)
            if (profile.onboardingStep === 4) {
                const { sendOnboardingSuccessEmail } = require("../../emailLogic/emails");
                const planTitle = profile.plan === 'chairman' ? 'Chairman' : (profile.plan === 'oga' ? 'Oga' : 'Boss');
                sendOnboardingSuccessEmail(req.user.email, req.user.name, displayName, planTitle)
                  .catch(err => console.error("Onboarding Email Fail:", err.message));
            }

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
        const Sale = require("../../models/Sale");
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        const [logs, sales] = await Promise.all([
            ActivityLog.find({ businessId: profile._id }).sort({ createdAt: -1 }).limit(20),
            Sale.find({ 
                businessId: profile._id, 
                "payments.0": { $exists: true } 
            }).sort({ "payments.date": -1 }).limit(20)
        ]);

        const unified = [];
        
        // 1. Add generic logs
        logs.forEach(l => unified.push({
            _id: l._id,
            action: l.action,
            details: l.details,
            createdAt: l.createdAt,
            type: 'LOG'
        }));

        // 2. Add payment events from Sales
        sales.forEach(s => {
            s.payments.forEach(p => {
                unified.push({
                    _id: s._id + (p.reference || p.date),
                    action: 'PAYMENT_RECEIVED',
                    details: `Payment of ₦${p.amount.toLocaleString()} received for Invoice #${s.invoiceNumber} (${s.customerName || 'Customer'})`,
                    createdAt: p.date,
                    type: 'SALE'
                });
            });
        });

        // 3. Sort by date (Newest First)
        unified.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: unified.slice(0, 15) });
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
        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        console.log(`🛡️ KYC Verification Started: ${profile.displayName} (${profile.bankDetails.bankName}) via BVN Match`);
        if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
        if (profile.kyc?.status === 'verified') return res.status(400).json({ success: false, message: "You are already verified!" });

        // 🛡️ SECURITY: Must have bank details to match against
        if (!profile.bankDetails?.accountNumber || !profile.bankDetails?.bankCode) {
            return res.status(400).json({ success: false, message: "Please set your payout bank account in 'Payout Settings' before verifying your identity." });
        }

        const kycMethod = type?.toUpperCase() === 'NONE' || !type ? 'BVN Match' : type.toUpperCase();
        console.log(`🛡️ KYC Verification Started: ${profile.displayName} (${profile.bankDetails.bankName}) via ${kycMethod}`);
        console.log(`💡 Details: Account ${profile.bankDetails.accountNumber}, Nomba Code: ${profile.bankDetails.bankCode}`);

        let isMatch = false;
        let matchMessage = "";

        // 🧪 SIMULATION MODE (For development or if Paystack Identity isn't active yet)
        if (process.env.SIMULATE_KYC === 'true' || idNumber === '00000000000') {
            console.log("🧪 KYC Simulation Active");
            isMatch = true;
            matchMessage = "BVN match successful (Simulated)";
        } else {
            // 🚀 REAL IDENTITY VERIFICATION ENGINE (Multi-Provider)
            const { matchBVN, getPaystackBankCode, resolveAccount } = require("../../utils/paystack");
            const { lookupBVN } = require("../../utils/dojah");
            
            try {
                // Layer 0: Dojah Primary Lookup (if keys exist)
                // Dojah is the best because it returns legal names directly for comparison.
                if (process.env.DOJAH_PRIVATE_KEY && process.env.DOJAH_APP_ID) {
                    try {
                        console.log(`🕵️‍♂️ KYC Layer 0: Verifying via Dojah BVN Lookup...`);
                        const dojahData = await lookupBVN(idNumber);
                        
                        const legalName = `${dojahData.first_name} ${dojahData.last_name} ${dojahData.middle_name || ''}`.trim();
                        console.log(`✅ Dojah Resolved Name: "${legalName}"`);

                        // Get User's registered name
                        const user = await User.findById(req.user._id);
                        const registeredName = user?.name || profile.displayName;

                        // fuzzy match logic
                        const cleanLegal = legalName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const nameParts = registeredName.toLowerCase().split(' ').filter(p => p.length > 2);
                        const matchedParts = nameParts.filter(part => cleanLegal.includes(part));
                        const requiredMatches = Math.min(nameParts.length, 2);

                        if (matchedParts.length >= requiredMatches && matchedParts.length > 0) {
                            isMatch = true;
                            matchMessage = "Identity verified via Dojah Full BVN Match";
                            console.log(`✅ Dojah Match Success: ${matchedParts.length}/${nameParts.length} parts matched.`);
                        } else {
                            console.warn(`❌ Dojah Name Mismatch: "${legalName}" vs "${registeredName}"`);
                            throw new Error(`Name mismatch. The BVN belongs to ${legalName}, but your Kredibly account is registered to ${registeredName}.`);
                        }
                    } catch (dojahErr) {
                        console.error("⚠️ Dojah Layer Failed, falling back to Paystack:", dojahErr.message);
                        // If it's a name mismatch error we already threw, rethrow it so we don't fall back to less secure methods
                        if (dojahErr.message.includes("Name mismatch")) throw dojahErr;
                    }
                }

                // Layer 1: Paystack Strict Match (if Dojah didn't already verify)
                if (!isMatch) {
                    const paystackCode = getPaystackBankCode(profile.bankDetails.bankCode);
                    console.log(`🚀 KYC Layer 1: Calling Paystack Match BVN with code: ${paystackCode}`);
                    
                    try {
                        const result = await matchBVN(
                            profile.bankDetails.accountNumber,
                            paystackCode,
                            idNumber,
                            dob || null
                        );
                        
                        console.log(`✅ Paystack Match Result:`, JSON.stringify(result));
                        isMatch = result === true || (result && result.account_number === true);
                        matchMessage = "BVN verification successful via Paystack";
                    } catch (bvnErr) {
                        console.error(`❌ Paystack Match Error:`, bvnErr.message);
                        
                        if (bvnErr.message.toLowerCase().includes('bank code is invalid') || 
                            bvnErr.message.toLowerCase().includes('does not match')) {
                            
                            // Layer 2: Smart Resolution Fallback (Paystack + Nomba Resolution)
                            const resolutionCode = profile.bankDetails.bankCode;
                            const accountNumber = profile.bankDetails.accountNumber;
                            let accountName = "";

                            try {
                                console.log(`🧠 KYC Layer 2: Resolving via Paystack [${resolutionCode}]...`);
                                const paystackResData = await resolveAccount(accountNumber, paystackCode);
                                accountName = paystackResData.account_name;
                            } catch (paystackResErr) {
                                console.warn(`⚠️ Paystack Resolution Failed: ${paystackResErr.message}. Trying Nomba...`);
                                const { resolveAccount: resolveNombaAccount } = require("../../utils/nomba");
                                const nombaResData = await resolveNombaAccount(accountNumber, resolutionCode);
                                accountName = nombaResData.account_name;
                            }

                            if (!accountName) throw new Error("Could not resolve account name from any provider.");
                            
                            const user = await User.findById(req.user._id);
                            const registeredName = user?.name || profile.displayName;
                            const cleanAccount = accountName.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const nameParts = registeredName.toLowerCase().split(' ').filter(p => p.length > 2);
                            const matchedParts = nameParts.filter(part => cleanAccount.includes(part));
                            const requiredMatches = Math.min(nameParts.length, 2);

                            if (matchedParts.length >= requiredMatches && matchedParts.length > 0) {
                                isMatch = true;
                                matchMessage = "Identity verified via Multi-Layer Account Name Match";
                            } else {
                                throw new Error(`Account name mismatch. The bank account name "${accountName}" must closely match your registered owner name "${registeredName}".`);
                            }
                        } else {
                            throw bvnErr;
                        }
                    }
                }
            } catch (err) {
                console.error("❌ KYC ENGINE FINAL ERROR:", err.message);
                return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
            }
        }

        if (isMatch) {
            profile.kyc = {
                status: 'verified',
                tier: 2,
                method: kycMethod,
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
                details: `Identity verified via ${kycMethod} (Tier 2)`
            });

            // 💸 TRIGGER ESCROW RELEASE (Moves held funds to bank account instantly)
            const { releaseMerchantEscrow } = require("../../utils/payouts");
            // Run in background to keep UI fast
            releaseMerchantEscrow(profile._id).catch(e => console.error("Escrow Release Post-KYC Fail:", e.message));

            // 📢 NOTIFY MERCHANT VIA WHATSAPP (Real-time alert)
            const { sendWhatsAppAlert } = require("../whatsapp/whatsappController");
            // 📱 WhatsApp Alert: Smart Messaging based on escrow status
            const bossTitle = profile.assistantSettings?.preferredName || profile.displayName.split(' ')[0];
            let successMsg = `🛡️ Boss, your identity has been successfully verified via ${kycMethod}.\n\nYou are now on **Tier 2** with a ₦500,000 daily limit. Keep winning! 🦁💎`;
            
            if (profile.heldBalance > 0) {
                successMsg = `🛡️ Boss, you are VERIFIED!\n\nI've recognized your identity and I'm releasing your ₦${profile.heldBalance.toLocaleString()} held funds to your bank account right now. \n\nYou are now on **Tier 2**. Let's go! 🚀💰`;
            }

            sendWhatsAppAlert(profile.whatsappNumber, bossTitle, successMsg).catch(e => console.error("KYC WA Alert Fail:", e.message));

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

