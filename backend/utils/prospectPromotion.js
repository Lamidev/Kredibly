const Prospect = require("../models/Prospect");
const WorkflowEventBus = require("../conversation/WorkflowEventBus");

/**
 * Promotes a Prospect (if exists) to a full Merchant.
 * Fires ProspectPromoted event.
 * 
 * @param {Object} profile - BusinessProfile document
 */
async function promoteProspect(profile) {
    if (!profile || !profile.whatsappNumber) return;

    try {
        const cleanFrom = profile.whatsappNumber;

        // 1. Check if they are registered as a prospect
        const prospect = await Prospect.findOne({ phoneNumber: cleanFrom, status: "prospect" });
        if (prospect) {
            console.log(`🚀 [Promotion] Promoting prospect ${cleanFrom} to merchant workspace: ${profile._id}`);
            
            prospect.status = "promoted";
            prospect.promotedAt = new Date();
            prospect.promotedToId = profile._id;
            prospect.registeredAt = new Date();
            await prospect.save();
        }

        // 2. Initialize firstMerchantGreetingSent flag on profile
        profile.firstMerchantGreetingSent = false;
        await profile.save();

        // 3. Publish the ProspectPromoted event on the event bus
        WorkflowEventBus.publish("ProspectPromoted", { profile, prospect });

    } catch (err) {
        console.error("🚨 [Promotion] Error promoting prospect:", err.message);
    }
}

module.exports = { promoteProspect };
