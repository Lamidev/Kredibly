const Prospect = require("../models/Prospect");
const MessageDispatcher = require("./MessageDispatcher");

class ProspectController {
    /**
     * Entry point for all unregistered user messages.
     * 
     * @param {Object} message - Raw message object from WhatsApp webhook
     * @param {string} cleanFrom - Normalized phone number of sender
     * @param {Object} opts - Additional options: { text, msgType, from }
     * @returns {Promise<boolean>} - True if handled, false otherwise
     */
    static async handle(message, cleanFrom, opts) {
        const text = opts.text || "";
        const msgType = opts.msgType;
        const from = opts.from;

        // 1. Get or create Prospect record
        let prospect = await Prospect.findOne({ phoneNumber: cleanFrom });
        if (!prospect) {
            prospect = new Prospect({
                phoneNumber: cleanFrom,
                source: "landing_page",
                status: "prospect",
                demoState: "welcome"
            });
            await prospect.save();
        }

        prospect.lastInteraction = new Date();
        prospect.interactionCount += 1;
        await prospect.save();

        const buttonId = message.interactive?.button_reply?.id || 
                         message.interactive?.list_reply?.id || 
                         message.button?.payload || 
                         null;

        const normalizedText = text.toLowerCase().trim();

        // Global Reset / Nurture trigger: Reset demo if they type "Start" or send the prefilled phrase
        if (normalizedText === "start" || normalizedText === "restart" || normalizedText.includes("how kredibly works") || normalizedText === "hello" || normalizedText === "hi kreddy") {
            prospect.demoState = "welcome";
            await prospect.save();
        }

        // 2. Button Action overrides (Global button handlers for prospects)
        if (buttonId === "prospect_demo_register" || normalizedText === "create workspace") {
            prospect.demoState = "waiting_for_signup";
            await prospect.save();

            // Send URL as an interactive button link (so it's not a naked link)
            await MessageDispatcher.sendButtons(
                from,
                "Create Workspace",
                "Tap the button below to register and start using Kreddy with your customers.",
                "",
                [{ id: "prospect_cta_register", title: "Open Signup Link" }]
            );
            return true;
        }

        if (buttonId === "prospect_demo_notnow" || normalizedText === "not now") {
            prospect.demoState = "nurture";
            await prospect.save();

            const nurtureText = `No worries.\n\nWhenever you're ready, just type *Start* and I'll help you launch your business.`;
            await MessageDispatcher.send(from, nurtureText);
            return true;
        }

        if (buttonId === "prospect_demo_start" || normalizedText === "see demo" || normalizedText === "demo") {
            prospect.demoState = "demo_running";
            // Save starting timestamp to lastInteraction for time spent calculation
            prospect.lastInteraction = new Date();
            await prospect.save();

            const promptText = `👤 *You:*\n_Rebecca bought shoes for ₦25,000._\n\n🤖 *Me (Kreddy):*\n_Perfect. Invoice created. Sending it to Rebecca..._`;
            
            await MessageDispatcher.sendButtons(
                from,
                "Demo - Step 1 of 2",
                promptText,
                "",
                [{ id: "prospect_demo_continue", title: "See What Happens Next" }]
            );
            return true;
        }

        if (buttonId === "prospect_demo_continue" || normalizedText === "see what happens next") {
            const now = new Date();
            const demoStart = prospect.lastInteraction || now;
            const diffSec = Math.max(1, Math.round((now - demoStart) / 1000));

            prospect.demoState = "demo_completed";
            prospect.demoCompleted = true;
            prospect.demoCompletedAt = now;
            prospect.timeSpent = (prospect.timeSpent || 0) + diffSec;
            await prospect.save();

            const completionText = `👤 *Rebecca (Customer):*\n_Payment made._\n\n🎉 *Payment Received!*\n_₦25,000 has been verified and swept to your bank. Rebecca has received her receipt._\n\nThat's how easy running your business can be. Ready to use Kreddy with your own customers?`;
            
            await MessageDispatcher.sendButtons(
                from,
                "Demo - Completed",
                completionText,
                "",
                [
                    { id: "prospect_demo_register", title: "Create Workspace" },
                    { id: "prospect_demo_notnow", title: "Not Now" }
                ]
            );
            return true;
        }

        // 3. State Machine Handling
        switch (prospect.demoState) {
            case "welcome":
                // Send the welcome message & options
                const welcomeText = `Welcome 👋\n\nI'm *Kreddy*, your AI business assistant.\n\nI help businesses record sales, send invoices, follow up on unpaid customers, and collect payments directly from WhatsApp.\n\nWould you like a quick demo?`;
                await MessageDispatcher.sendButtons(
                    from,
                    "Kreddy Demo",
                    welcomeText,
                    "No account required to try",
                    [
                        { id: "prospect_demo_start", title: "Start Demo" },
                        { id: "prospect_demo_register", title: "Create Workspace" }
                    ]
                );
                return true;

            case "demo_running":
                // If they type anything while demo is running, guide them to continue
                const runGuide = `Click the button below to see the rest of the magic, or type "Start" to reset.`;
                await MessageDispatcher.sendButtons(
                    from,
                    "Demo In Progress",
                    runGuide,
                    "",
                    [{ id: "prospect_demo_continue", title: "See What Happens Next" }]
                );
                return true;

            case "nurture":
                // Guidance for nurture state
                const nurtureGuide = `Whenever you're ready to see the demo again or start, just type *Start* to get going.`;
                await MessageDispatcher.send(from, nurtureGuide);
                return true;

            case "demo_completed":
            case "waiting_for_signup":
            default:
                const fallbackText = `I'm standing by to help you launch your business workspace on Kredibly.\n\nReady to get started?`;
                await MessageDispatcher.sendButtons(
                    from,
                    "Create Workspace",
                    fallbackText,
                    "",
                    [
                        { id: "prospect_demo_start", title: "Replay Demo" },
                        { id: "prospect_demo_register", title: "Create Workspace" }
                    ]
                );
                return true;
        }
    }
}

module.exports = ProspectController;
