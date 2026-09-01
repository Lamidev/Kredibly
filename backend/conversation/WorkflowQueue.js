/**
 * WorkflowQueue — V2 Workflow State Engine
 *
 * Implements the priority-based multi-workflow manager.
 * Stores and manages active and queued workflows inside a single ConversationContext document per user.
 * Enforces the "One Thought Rule" by only allowing the highest priority active workflow to run.
 */

const ConversationContext = require("../models/ConversationContext");
const WorkflowRegistry = require("./WorkflowRegistry");

const PRIORITY_ORDER = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1
};

class WorkflowQueue {
    /**
     * Get the active owning context for a phone number.
     * Enforces the "One Thought Rule" by returning the ConversationContext if it has an active workflow.
     *
     * @param {string} whatsappNumber
     * @returns {Promise<Object|null>} The ConversationContext document, or null if none is active
     */
    static async getActiveContext(whatsappNumber) {
        const context = await ConversationContext.findOne({ whatsappNumber });
        if (!context || context.mode !== "active_workflow" || context.status !== "active") {
            return null;
        }

        // Apply One Thought Rule filter on LOW priority queues (growth tips, etc.)
        const activePriorityScore = PRIORITY_ORDER[context.priority] || 2;
        if (activePriorityScore >= 3 && context.queue && context.queue.length > 0) {
            // Silently mark queued LOW priority workflows as cancelled
            let modified = false;
            context.queue = context.queue.filter(item => {
                const itemPrio = PRIORITY_ORDER[item.priority] || 2;
                if (itemPrio === 1) {
                    modified = true;
                    return false; // drop
                }
                return true;
            });
            if (modified) {
                await context.save();
            }
        }

        return context;
    }

    /**
     * Enqueue or start a new workflow.
     * If a higher priority workflow is active, the new workflow is pushed to the queue array.
     */
    static async enqueue(whatsappNumber, businessId, workflowId, step, priority, data, timeoutMinutes) {
        let context = await ConversationContext.findOne({ whatsappNumber });
        if (!context) {
            context = new ConversationContext({
                whatsappNumber,
                businessId,
                mode: "free_conversation"
            });
        } else if (businessId && (!context.businessId || String(context.businessId) !== String(businessId))) {
            context.businessId = businessId;
        }

        const manifest = WorkflowRegistry.getManifest(workflowId);
        const category = manifest ? manifest.category : "system";
        const timeoutAt = timeoutMinutes ? new Date(Date.now() + timeoutMinutes * 60 * 1000) : null;

        const newWorkflow = {
            workflowId,
            workflowCategory: category,
            step,
            priority: priority || "MEDIUM",
            data: data || {},
            startedAt: new Date(),
            timeoutAt
        };

        const newPriorityScore = PRIORITY_ORDER[newWorkflow.priority] || 2;

        if (context.mode === "free_conversation") {
            // Start immediately
            context.enterWorkflow(workflowId, category, step, priority, data, timeoutMinutes);
        } else {
            // Compare priority with active workflow
            const activePriorityScore = PRIORITY_ORDER[context.priority] || 2;

            if (newPriorityScore > activePriorityScore) {
                // Preempt active workflow: push active workflow to the queue
                const preempted = {
                    workflowId: context.workflowId,
                    workflowCategory: context.workflowCategory,
                    step: context.step,
                    priority: context.priority,
                    data: context.data,
                    startedAt: context.startedAt || new Date(),
                    timeoutAt: context.timeoutAt
                };
                context.queue.push(preempted);

                // Start new workflow
                context.enterWorkflow(workflowId, category, step, priority, data, timeoutMinutes);
            } else {
                // Enqueue: check if already in queue or currently running
                if (context.workflowId === workflowId) {
                    // Update active workflow
                    context.step = step;
                    context.data = { ...(context.data || {}), ...data };
                    if (timeoutMinutes) {
                        context.timeoutAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
                    }
                } else {
                    const existingIdx = context.queue.findIndex(item => item.workflowId === workflowId);
                    if (existingIdx !== -1) {
                        context.queue[existingIdx].step = step;
                        context.queue[existingIdx].data = { ...(context.queue[existingIdx].data || {}), ...data };
                    } else {
                        context.queue.push(newWorkflow);
                    }
                }
            }
        }

        await context.save();
        return context;
    }
}

module.exports = WorkflowQueue;
