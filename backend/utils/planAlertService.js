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

            // Logic to determine subtype
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft === 3) alertType = "grace_choice";
            else if (daysLeft === 0) alertType = "active_expiry";
            else if (daysLeft < -3) alertType = "benefit_lock";
            else return { status: "skipped", reason: `Notification not due (Days left: ${daysLeft})` };
        }

        const bossTitle = profile.assistantSettings?.preferredName || (profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss"));
        let msg = "";

        switch (alertType) {
            case "trial_lock":
                profile.planStatus = 'inactive';
                profile.plan = 'hustler';
                await profile.save();
                msg = `Your trial has ended and the grace period is over. I've moved you to the *Hustler Plan* (Basic Text Only).\n\nScan and Voice features are now locked.`;
                break;

            case "grace_choice":
                msg = `Your trial is over! Choose your plan now to keep your Scan and Voice powers at the **50% Launch Discount**: \n\n1️⃣ *Stay Chairman* (₦4,250/mo)\n2️⃣ *Switch to Oga* (₦2,500/mo)`;
                break;

            case "active_expiry":
                profile.planStatus = 'past_due';
                await profile.save();
                msg = `Your premium features have paused. Renew now to continue tracking debt with AI without limits! 💰`;
                break;

            case "benefit_lock":
                profile.planStatus = 'inactive';
                profile.plan = 'hustler';
                await profile.save();
                msg = `Your premium features have been locked because your plan is overdue. I've moved you back to the *Hustler Plan*.`;
                break;

            default:
                return { status: "failed", error: "Invalid plan alert type" };
        }

        if (whatsappNumber) {
            const isInsideWindow = profile.lastInboundAt && (new Date() - new Date(profile.lastInboundAt)) < (24 * 60 * 60 * 1000);

            if (isInsideWindow) {
                // 🟢 FREE-FORM (Inside Window)
                await sendWhatsAppMessage(whatsappNumber, `Hey ${bossTitle}! 🔔\n\n${msg}\n\n_Check your dashboard for more details._`);
            } else {
                // 🔴 EMAIL FALLBACK (Window Closed)
                const { sendEmail } = require("./emailService");
                const user = await require("../models/User").findById(profile.ownerId);
                
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: `🔔 Subscription Update from Kredibly`,
                        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2>Hello ${bossTitle},</h2>
                                <p>${msg}</p>
                                <hr />
                                <p style="font-size: 12px; color: #777;">Kredibly Assistant: Helping you stay organized and profitable.</p>
                               </div>`
                    });
                    console.log(`📪 Plan Alert for ${profile.displayName} sent to EMAIL.`);
                }
            }
        }
        return { status: "completed" };

    } catch (err) {
        console.error("Plan Alert Service Error:", err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { sendIndividualPlanAlert };
