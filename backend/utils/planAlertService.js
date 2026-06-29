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
                msg = `Only 3 days left on your trial! Don't lose access to your Digital Chief of Staff. Subscribe now to keep your Scan and Voice powers at the **50% Launch Discount**. 🛡️`;
                break;

            case "trial_ended_grace":
                profile.planStatus = 'past_due';
                await profile.save();
                msg = `Your trial has ended, but I'm staying on duty for **72 more hours** as a favor so your records stay sharp. Subscribe now to prevent any service interruption! 💰`;
                break;

            case "final_lockout":
                profile.planStatus = 'inactive';
                await profile.save();
                msg = `Your Digital Chief of Staff is now *On Leave*. My automated services (Summaries & Voice Recording) are paused until your plan is active. Let's get back to work.`;

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
