const BusinessProfile = require("../../models/BusinessProfile");

exports.updateProfile = async (req, res) => {
    try {
        const { displayName, entityType, sellMode, logoUrl, phoneNumber, address } = req.body;

        let profile = await BusinessProfile.findOne({ ownerId: req.user._id });

        if (profile) {
            profile.displayName = displayName || profile.displayName;
            profile.entityType = entityType || profile.entityType;
            profile.sellMode = sellMode || profile.sellMode;
            profile.logoUrl = logoUrl || profile.logoUrl;
            profile.phoneNumber = phoneNumber || profile.phoneNumber;
            profile.address = address || profile.address;
            await profile.save();
        } else {
            profile = new BusinessProfile({
                ownerId: req.user._id,
                displayName,
                entityType,
                sellMode,
                logoUrl,
                phoneNumber,
                address
            });
            await profile.save();
        }

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
