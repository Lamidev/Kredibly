const BusinessProfile = require("../../models/BusinessProfile");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");
const { logActivity } = require("../../utils/activityLogger");

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
        const { displayName, entityType, sellMode, logoUrl, phoneNumber, whatsappNumber, address, assistantSettings, bankDetails, staffNumbers } = req.body;

        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (profile) {
            profile.displayName = displayName || profile.displayName;
            profile.entityType = entityType || profile.entityType;
            profile.sellMode = sellMode || profile.sellMode;
            profile.logoUrl = logoUrl || profile.logoUrl;
            profile.phoneNumber = phoneNumber || profile.phoneNumber;
            profile.whatsappNumber = whatsappNumber ? cleanPhone(whatsappNumber) : profile.whatsappNumber;
            profile.address = address || profile.address;
            if (assistantSettings) profile.assistantSettings = assistantSettings;
            if (bankDetails) profile.bankDetails = bankDetails;
            if (staffNumbers) {
                profile.staffNumbers = staffNumbers.map(n => cleanPhone(n)).filter(n => n);
            }
            await profile.save();
        } else {
            // New Profile Creation: Check if user is from Waitlist
            const waitlistEntry = await Waitlist.findOne({ email: req.user.email });
            const isWaitlistUser = !!waitlistEntry;

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
                bankDetails,
                staffNumbers: staffNumbers ? staffNumbers.map(n => cleanPhone(n)).filter(n => n) : [],
                // Founding Member Benefits
                // Everyone starts with a 7-day trial of the OGA PLAN to see its power
                plan: 'oga',
                planStatus: 'trialing',
                trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
                isFoundingMember: isWaitlistUser,
                discountActiveUntil: isWaitlistUser ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null
            });

            await profile.save();

            // Update Waitlist status
            if (waitlistEntry) {
                waitlistEntry.status = 'active';
                await waitlistEntry.save();
            }
        }

        await logActivity({
            businessId: profile._id,
            action: "PROFILE_UPDATED",
            entityType: "PROFILE",
            details: `Updated business profile for ${profile.displayName}`
        });

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Profile not found" });
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
