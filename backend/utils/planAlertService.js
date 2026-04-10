const BusinessProfile = require("../models/BusinessProfile");
const { sendWhatsAppMessage } = require("../controllers/whatsapp/whatsappController");

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

        const bossTitle = profile.assistantSettings?.preferredName || (profile.plan === "chairman" ? "Chairman" : (profile.plan === "oga" ? "Oga" : "Boss"));
        let msg = "";

        switch (type) {
            case "trial_lock":
                profile.planStatus = 'inactive';
                profile.plan = 'hustler';
                await profile.save();
                msg = `🛑 *Trial Over, ${bossTitle}.* \n\nYour trial has ended and the grace period is over. I've moved you to the *Hustler Plan* (Basic Text Only). \n\nScan and Voice features are now locked. Upgrade anytime to get them back! 🛡️`;
                break;

            case "grace_choice":
                msg = `📢 *Last Call, ${bossTitle}!* \n\nYour trial is over. Choose your plan now to keep your Scan and Voice powers at the **50% Launch Discount**: \n\n1️⃣ *Stay Chairman* (₦4,250/mo)\n2️⃣ *Switch to Oga* (₦2,500/mo)\n\nJust say _"Pay for Oga"_ or _"Pay for Chairman"_ right here! 🛡️`;
                break;

            case "active_expiry":
                profile.planStatus = 'past_due';
                await profile.save();
                msg = `🚨 *Plan Expired, ${bossTitle}!* \n\nYour premium features have paused. Renew now to continue tracking debt with AI without limits! 💰\n\n🔗 *Renew:* Just say _"Pay for ${profile.plan}"_`;
                break;

            case "benefit_lock":
                profile.planStatus = 'inactive';
                profile.plan = 'hustler';
                await profile.save();
                msg = `🛑 *Benefit Lock, ${bossTitle}.* \n\nYour premium features have been locked because your plan is overdue. I've moved you back to the *Hustler Plan*. \n\n_Upgrade anytime to restore your Scan & Voice powers!_ 🦁`;
                break;

            default:
                return { status: "failed", error: "Invalid plan alert type" };
        }

        if (whatsappNumber) {
            await sendWhatsAppMessage(whatsappNumber, msg);
        }
        return { status: "completed" };

    } catch (err) {
        console.error("Plan Alert Service Error:", err.message);
        return { status: "failed", error: err.message };
    }
};

module.exports = { sendIndividualPlanAlert };
