/**
 * WorkflowManifest — V2 Workflow State Engine
 *
 * Schema definition and validator for workflow manifests.
 * Every workflow MUST declare a manifest before registering.
 *
 * A manifest answers:
 *   - What priority does this workflow have?
 *   - How long before it times out?
 *   - Can it be cancelled? How?
 *   - What happens if the merchant goes silent (timeout behaviour)?
 *   - Can it resume after a timeout window?
 */

const VALID_PRIORITIES        = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const VALID_CANCEL_BEHAVIOURS = ["immediate", "confirm", "disabled"];
const VALID_TIMEOUT_BEHAVIOURS = ["resume", "silent", "notify", "cancel"];
const VALID_RESUME_BEHAVIOURS  = ["resume", "restart", "expire"];
const VALID_OWNERS             = ["merchant", "customer", "system"];

class WorkflowManifest {
    /**
     * Validate and normalize a raw manifest object.
     * Throws a descriptive error if required fields are missing or invalid.
     *
     * @param {Object} raw - The raw manifest object from a workflow's manifest.js
     * @returns {Object}   - A fully normalized manifest with all defaults applied
     */
    static validate(raw) {
        if (!raw || typeof raw !== "object") {
            throw new Error("[WorkflowManifest] Manifest must be a plain object.");
        }
        if (!raw.id) {
            throw new Error("[WorkflowManifest] Missing required field: id");
        }
        if (!raw.category) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Missing required field: category`);
        }
        if (raw.priority && !VALID_PRIORITIES.includes(raw.priority)) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Invalid priority "${raw.priority}". ` +
                `Valid values: ${VALID_PRIORITIES.join(", ")}`);
        }
        if (raw.cancel?.behaviour && !VALID_CANCEL_BEHAVIOURS.includes(raw.cancel.behaviour)) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Invalid cancel behaviour "${raw.cancel.behaviour}". ` +
                `Valid values: ${VALID_CANCEL_BEHAVIOURS.join(", ")}`);
        }
        if (raw.timeout?.behaviour && !VALID_TIMEOUT_BEHAVIOURS.includes(raw.timeout.behaviour)) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Invalid timeout behaviour "${raw.timeout.behaviour}". ` +
                `Valid values: ${VALID_TIMEOUT_BEHAVIOURS.join(", ")}`);
        }
        if (raw.resume?.behaviour && !VALID_RESUME_BEHAVIOURS.includes(raw.resume.behaviour)) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Invalid resume behaviour "${raw.resume.behaviour}". ` +
                `Valid values: ${VALID_RESUME_BEHAVIOURS.join(", ")}`);
        }
        if (raw.owner && !VALID_OWNERS.includes(raw.owner)) {
            throw new Error(`[WorkflowManifest] ${raw.id}: Invalid owner "${raw.owner}". ` +
                `Valid values: ${VALID_OWNERS.join(", ")}`);
        }

        return WorkflowManifest._normalize(raw);
    }

    /**
     * Apply all default values to a manifest.
     * Called internally by validate().
     */
    static _normalize(raw) {
        return {
            id:           raw.id,
            category:     raw.category,
            owner:        raw.owner        || "merchant",
            priority:     raw.priority     || "MEDIUM",
            steps:        Array.isArray(raw.steps) ? raw.steps : [],
            interruptible: raw.interruptible !== false,  // default: true

            timeout: {
                minutes:   raw.timeout?.minutes   || 15,
                behaviour: raw.timeout?.behaviour || "silent",
                message:   raw.timeout?.message   || null
            },

            cancel: {
                behaviour: raw.cancel?.behaviour || "immediate",
                keywords:  Array.isArray(raw.cancel?.keywords)
                    ? raw.cancel.keywords
                    : ["cancel", "stop", "abort", "nevermind", "never mind", "forget it"],
                message: raw.cancel?.message || "Cancelled. Let me know when you're ready to continue."
            },

            resume: {
                behaviour: raw.resume?.behaviour || "expire"
            },

            analytics: {
                track: Array.isArray(raw.analytics?.track)
                    ? raw.analytics.track
                    : ["started", "completed", "cancelled", "timeout"]
            }
        };
    }

    /**
     * Convenience: validate and return, or throw.
     */
    static from(raw) {
        return WorkflowManifest.validate(raw);
    }
}

module.exports = WorkflowManifest;
