/**
 * WorkflowRouter — V2 Workflow State Engine
 *
 * Decides if a message belongs to an active workflow or a free conversation.
 * Intercepts cancel keywords and routes active workflow steps to their handlers.
 */

const WorkflowRegistry = require("./WorkflowRegistry");
const MessageDispatcher = require("./MessageDispatcher");

class WorkflowRouter {
    /**
     * Intercept and process message if a workflow is active.
     *
     * @param {Object} message         - Raw WhatsApp message
     * @param {Object} profile         - BusinessProfile document
     * @param {Object} workflowContext - The active owning ConversationContext
     * @param {Object} opts            - Sanitized options (msgType, text, cleanFrom, bossTitle, isStaff)
     * @returns {Promise<boolean>}     - True if message was handled/routed, false otherwise
     */
    static async route(message, profile, workflowContext, opts) {
        const text = opts.text || "";
        const workflowId = workflowContext.workflowId;

        // Check if workflow has a registered manifest/handler
        const manifest = WorkflowRegistry.getManifest(workflowId);
        const handler = WorkflowRegistry.getHandler(workflowId);

        if (!manifest || !handler) {
            // No handler registered yet (Phase 1). Fallback to false.
            return false;
        }

        // Cancel keyword intercept check
        if (manifest.cancel.behaviour !== "disabled" && WorkflowRegistry.isCancelMessage(workflowId, text)) {
            if (manifest.cancel.behaviour === "immediate") {
                await workflowContext.cancelWorkflow("merchant_cancelled");
                await workflowContext.save();
                
                const cancelMsg = manifest.cancel.message || "Workflow cancelled.";
                await MessageDispatcher.send(opts.from, cancelMsg);
                return true;
            } else if (manifest.cancel.behaviour === "confirm") {
                // Set step to await cancel confirmation
                workflowContext.data._pendingCancel = true;
                workflowContext.step = "awaiting_cancel_confirm";
                await workflowContext.save();

                await MessageDispatcher.send(opts.from, "Are you sure you want to cancel? Reply 'yes' to cancel or 'no' to keep going.");
                return true;
            }
        }

        // Handle confirmation of cancellation if we are in that state
        if (workflowContext.step === "awaiting_cancel_confirm") {
            const lower = text.toLowerCase().trim();
            if (["yes", "y", "confirm", "sure"].includes(lower)) {
                await workflowContext.cancelWorkflow("merchant_cancelled");
                await workflowContext.save();
                const cancelMsg = manifest.cancel.message || "Workflow cancelled.";
                await MessageDispatcher.send(opts.from, cancelMsg);
                return true;
            } else {
                // Resume previous step
                workflowContext.step = workflowContext.data._prevStep || manifest.steps[0];
                delete workflowContext.data._pendingCancel;
                delete workflowContext.data._prevStep;
                workflowContext.markModified("data");
                await workflowContext.save();
                await MessageDispatcher.send(opts.from, "Continuing where we left off!");
                return true;
            }
        }

        // Validate input before handler runs
        const stepConfig = manifest.stepConfigs ? manifest.stepConfigs[workflowContext.step] : null;
        if (stepConfig) {
            const buttonId = message.interactive?.button_reply?.id || 
                             message.interactive?.list_reply?.id || 
                             message.button?.payload || 
                             null;
            
            const WorkflowValidator = require("./WorkflowValidator");
            const validation = WorkflowValidator.validate(text, buttonId, stepConfig);
            if (!validation.isValid) {
                const feedback = stepConfig.validation?.errorMessage || validation.feedback || "Invalid input. Please try again.";
                await MessageDispatcher.send(opts.from, feedback);
                return true; // Intercepted and handled
            }
        }

        // Normal route to step handler
        try {
            const handled = await handler.handle(workflowContext.step, message, workflowContext, profile, opts);
            return !!handled;
        } catch (err) {
            console.error(`🚨 Error in workflow ${workflowId} step ${workflowContext.step}:`, err);
            // On crash, tell merchant, cancel workflow, fallback to free conversation
            await workflowContext.cancelWorkflow("handler_crash");
            await workflowContext.save();
            await MessageDispatcher.send(opts.from, "Oops! Something went wrong in my brain while processing that request. I've cancelled this flow so you can try again.");
            return true;
        }
    }
}

module.exports = WorkflowRouter;
