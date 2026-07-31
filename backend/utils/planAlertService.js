const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require("../controllers/whatsapp/whatsappController");

/**
 * Sends a plan alert (TRIAL_EXPIRY) based on the provided context.
 * @param {Object} data - Context data { type, profileId, whatsappNumber }
 * @returns {Promise<Object>} - Status of the operation.
 */
const sendIndividualPlanAlert = async (data) => {
    try {
        const { type, profileId, whatsappNumber } = data;
        const profile = await BusinessProfile.findById(profileId);
        if (!profile) return { status: "failed", error: "Profile not found" };

        let alertType = type;

        // If no specific subtype is passed (from Cron), calculate it based on profile state
        if (!alertType || alertType === "TRIAL_EXPIRY") {
            const now = new Date();
            const expiry = profile.trialExpiresAt;
            if (!expiry) return { status: "skipped", reason: "No expiry date set" };

            const diffTime = expiry - now;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysLeft === 3) alertType = "trial_warning";
            else if (daysLeft === 0) alertType = "trial_ended_grace";
            else if (daysLeft === -3) alertType = "final_lockout";
            else return { status: "skipped", reason: `Notification not due (Days left: ${daysLeft})` };
        }

        const bossTitle = profile.assistantSettings?.preferredName || profile.displayName || "Partner";
        let msg = "";

        switch (alertType) {
            case "trial_warning":
                msg = `Your 14-day free trial on Kredibly ends in 3 days. To keep recording sales and tracking receivables without interruption, choose a plan from your web dashboard when you're ready.`;
                break;

            case "trial_ended_grace":
                profile.planStatus = 'past_due';
                await profile.save();
                msg = `Your free trial has ended. I'm keeping your workspace active for 72 more hours so your records remain intact. Choose a plan from your dashboard whenever you're ready.`;
                break;

            case "final_lockout":
                profile.planStatus = 'inactive';
                await profile.save();
                msg = `Your trial period has ended and AI services are now paused. All your saved business records and customer balances are safe. You can reactivate your account anytime from your dashboard.`;

                // 🔔 IN-APP NOTIFICATION: Also ring the dashboard bell so the merchant
                // sees the lockout even if they missed the WhatsApp message.
                try {
                    const Notification = require("../models/Notification");
                    await Notification.create({
                        businessId: profile._id,
                        title: "Plan Ended 🔒",
                        message: "Your plan has ended. Your existing records and invoice payments are safe. Reactivate to create new records.",
                        type: "system"
                    });
                } catch (notifErr) {
                    console.error("Plan Alert: Failed to create lockout notification:", notifErr.message);
                }
                break;

            default:
                return { status: "failed", error: "Invalid plan alert type" };
        }

        if (whatsappNumber) {
            const { sendWhatsAppAlert } = require("../controllers/whatsapp/whatsappController");
            // sendWhatsAppAlert automatically handles Window Open (Free) vs Window Closed (Template)
            await sendWhatsAppAlert(whatsappNumber, bossTitle, msg);
            console.log(`✅ Plan Alert [${alertType}] sent to ${profile.displayName} on WhatsApp.`);
        }
        
        return { status: "completed" };

    } catch (err) {
        console.error("Plan Alert Service Error:", err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { sendIndividualPlanAlert };
