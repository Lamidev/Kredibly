const ActivityLog = require("../models/ActivityLog");

/**
 * Utility to log user actions for auditing and analytics
 */
const logActivity = async ({ businessId, userId, action, entityType, entityId, details }) => {
    try {
        const log = new ActivityLog({
            businessId,
            userId,
            action,
            entityType,
            entityId,
            details
        });
        await log.save();
    } catch (err) {
        console.error("Activity Logging Error:", err);
    }
};

module.exports = { logActivity };
