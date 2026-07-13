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
        if (normalizedText === "start" || normalizedText === "restart" || normalizedText.includes("how kredibly works") || normalizedText.includes("how kreddy works") || normalizedText === "hello" || normalizedText === "hi kreddy") {
            prospect.demoState = "welcome";
            await prospect.save();
        }

        // Cancel/exit keyword handler
        const isCancelPhrase = ["exit", "cancel", "stop", "quit", "leave"].includes(normalizedText);
        if (isCancelPhrase) {
            prospect.demoState = "nurture";
            await prospect.save();

            if (opts.profile) {
                const exitText = `Demo exited. Welcome back, *${opts.bossTitle || "Boss"}*!\n\nHow can I help you manage your business today?`;
                await MessageDispatcher.send(from, exitText);
                return true;
            } else {
                const nurtureText = `No worries.\n\nWhenever you're ready, just type *Start* and I'll help you launch your business.`;
                await MessageDispatcher.send(from, nurtureText);
                return true;
            }
        }

        // 2. Button Action overrides (Global button handlers for prospects)
        if (buttonId === "prospect_demo_register" || normalizedText === "create workspace") {
            prospect.demoState = "waiting_for_signup";
            await prospect.save();

            const registerUrl = `${process.env.FRONTEND_URL || "https://usekredibly.com"}/auth/register`;
            const { sendInteractiveCTAUrlButton } = require("../utils/customerInvoiceService");
            const bodyText = `Fantastic! Ready to run your business with Kreddy? 🚀\n\nTap the button below to create your free account on the browser and activate your workspace in 30 seconds:`;
            
            await sendInteractiveCTAUrlButton(from, "Create Workspace", bodyText, "", "Launch Workspace", registerUrl);
            return true;
        }

        if (buttonId === "prospect_demo_notnow" || normalizedText === "not now") {
            prospect.demoState = "nurture";
            await prospect.save();

            if (opts.profile) {
                const exitText = `Demo exited. Welcome back, *${opts.bossTitle || "Boss"}*!\n\nHow can I help you manage your business today?`;
                await MessageDispatcher.send(from, exitText);
                return true;
            }

            const nurtureText = `No worries.\n\nWhenever you're ready, just type *Start* and I'll help you launch your business.`;
            await MessageDispatcher.send(from, nurtureText);
            return true;
        }

        // Demo Start
        if (buttonId === "prospect_demo_start" || normalizedText === "see demo" || normalizedText === "demo") {
            prospect.demoState = "demo_ask_phone";
            prospect.lastInteraction = new Date();
            await prospect.save();

            const promptText = `👤 *You:*\n_Rebecca bought shoes for ₦25,000._\n\n🤖 *Kreddy:*\n_Invoice created._\n\n_Let's deliver it._`;
            
            await MessageDispatcher.sendButtons(
                from,
                "Demo - Step 1 of 3",
                promptText,
                "",
                [
                    { id: "prospect_demo_provide_num", title: "Deliver Invoice" },
                    { id: "prospect_demo_notnow", title: "Cancel" }
                ]
            );
            return true;
        }

        // Demo Step 2: Deliver Invoice
        if (buttonId === "prospect_demo_provide_num" || (prospect.demoState === "demo_ask_phone" && normalizedText !== "")) {
            prospect.demoState = "demo_confirm_send";
            prospect.lastInteraction = new Date();
            await prospect.save();

            const promptText = `📲 *Rebecca (Customer)*\n_WhatsApp Number: +234 803 000 1234_\n\n_Ready to send?_`;

            await MessageDispatcher.sendButtons(
                from,
                "Demo - Step 2 of 3",
                promptText,
                "",
                [
                    { id: "prospect_demo_send_goahead", title: "Yes, Send" },
                    { id: "prospect_demo_notnow", title: "Cancel" }
                ]
            );
            return true;
        }

        // Demo Step 3: Yes, Send
        if (buttonId === "prospect_demo_send_goahead" || (prospect.demoState === "demo_confirm_send" && normalizedText !== "")) {
            const now = new Date();
            const demoStart = prospect.lastInteraction || now;
            const diffSec = Math.max(1, Math.round((now - demoStart) / 1000));

            prospect.demoState = "demo_completed";
            prospect.demoCompleted = true;
            prospect.demoCompletedAt = now;
            prospect.timeSpent = (prospect.timeSpent || 0) + diffSec;
            await prospect.save();

            const completionText = `👤 *Rebecca:*\n_"Thanks! I've just paid."_\n\n🎉 *Payment Received*\n_₦25,000 verified._\n_Money swept to your bank._\n_Receipt delivered automatically._\n\n━━━━━━━━━━━━━━\n*Today's Business*\n\nCollected Today: *₦25,000*\nOutstanding: *₦0*\n━━━━━━━━━━━━━━\n\n_Imagine running every sale this way._`;
            
            if (opts.profile) {
                const welcomeBackMsg = `${completionText}\n\n━━━━━━━━━━━━━━\n*Demo Completed!* Welcome back to your workspace. How can I help you record sales or check records today?`;
                await MessageDispatcher.send(from, welcomeBackMsg);
                return true;
            }

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
                
                if (opts.profile) {
                    await MessageDispatcher.sendButtons(
                        from,
                        "Kreddy Demo",
                        welcomeText,
                        "No account required to try",
                        [
                            { id: "prospect_demo_start", title: "Start Demo" },
                            { id: "prospect_demo_notnow", title: "Cancel" }
                        ]
                    );
                    return true;
                }

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

            case "demo_ask_phone":
                const askPhoneGuide = `Tap "Deliver Invoice" to send the invoice to Rebecca.`;
                await MessageDispatcher.sendButtons(
                    from,
                    "Demo - Step 1 of 3",
                    askPhoneGuide,
                    "",
                    [
                        { id: "prospect_demo_provide_num", title: "Deliver Invoice" },
                        { id: "prospect_demo_notnow", title: "Cancel" }
                    ]
                );
                return true;

            case "demo_confirm_send":
                const confirmSendGuide = `Tap "Yes, Send" to deliver the invoice to Rebecca.`;
                await MessageDispatcher.sendButtons(
                    from,
                    "Demo - Step 2 of 3",
                    confirmSendGuide,
                    "",
                    [
                        { id: "prospect_demo_send_goahead", title: "Yes, Send" },
                        { id: "prospect_demo_notnow", title: "Cancel" }
                    ]
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
