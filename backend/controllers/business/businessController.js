const BusinessProfile = require("../../models/BusinessProfile");
const ActivityLog = require("../../models/ActivityLog");
const { logActivity } = require("../../utils/activityLogger");

const cleanPhone = (num) => {
    if (!num) return num;
    let clean = num.replace(/\D/g, ''); // Remove all non-digits
    if (clean.startsWith('0') && clean.length === 11) {
        clean = '234' + clean.slice(1);
    }
    return clean;
};

exports.updateProfile = async (req, res) => {
    try {
        const { displayName, entityType, sellMode, logoUrl, phoneNumber, whatsappNumber, address, assistantSettings, bankDetails } = req.body;

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
            await profile.save();
        } else {
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
                bankDetails
            });
            await profile.save();
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
