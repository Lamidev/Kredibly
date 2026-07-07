/**
 * WorkflowRegistry — V2 Workflow State Engine
 *
 * Central registry of all workflows. Workflows register their manifest
 * and handler here on startup. WorkflowRouter uses this to find the
 * correct handler for any active context.
 *
 * Usage:
 *   const registry = require('./WorkflowRegistry');
 *   registry.register('invoice_creation', manifest, handler);
 *   const handler = registry.getHandler('invoice_creation');
 */

class WorkflowRegistry {
    constructor() {
        /** @type {Map<string, Object>} workflowId → validated manifest */
        this._manifests = new Map();
        /** @type {Map<string, Object>} workflowId → handler instance */
        this._handlers = new Map();
    }

    /**
     * Register a workflow.
     *
     * @param {string} workflowId  - Unique workflow identifier e.g. "invoice_creation"
     * @param {Object} manifest    - Validated manifest object (from WorkflowManifest.validate)
     * @param {Object} [handler]   - Handler instance with handle(step, message, state, profile, opts) method
     */
    register(workflowId, manifest, handler = null) {
        if (!workflowId) throw new Error("[WorkflowRegistry] workflowId is required");
        if (!manifest)   throw new Error("[WorkflowRegistry] manifest is required");

        this._manifests.set(workflowId, manifest);
        if (handler) {
            this._handlers.set(workflowId, handler);
        }
        console.log(`[WorkflowRegistry] ✅ Registered workflow: ${workflowId} (${manifest.priority || "MEDIUM"} priority)`);
    }

    /**
     * Get the manifest for a workflow.
     * Returns null if not registered.
     */
    getManifest(workflowId) {
        return this._manifests.get(workflowId) || null;
    }

    /**
     * Get the handler for a workflow.
     * Returns null if not registered (Phase 1: all return null).
     */
    getHandler(workflowId) {
        return this._handlers.get(workflowId) || null;
    }

    /**
     * Check if a workflow is registered.
     */
    has(workflowId) {
        return this._manifests.has(workflowId);
    }

    /**
     * List all registered workflow IDs.
     */
    list() {
        return Array.from(this._manifests.keys());
    }

    /**
     * Get the cancel keywords for a workflow.
     * Convenience helper used by WorkflowRouter.
     */
    getCancelKeywords(workflowId) {
        const manifest = this.getManifest(workflowId);
        if (!manifest || manifest.cancel.behaviour === "disabled") return [];
        return manifest.cancel.keywords || ["cancel", "stop", "abort"];
    }

    /**
     * Check if a message text matches a cancel keyword for a workflow.
     */
    isCancelMessage(workflowId, text) {
        if (!text) return false;
        const keywords = this.getCancelKeywords(workflowId);
        const lower = text.toLowerCase().trim();
        return keywords.some(kw => lower === kw || lower.startsWith(kw + " "));
    }
}

// Export as a singleton — one registry shared across the whole app
module.exports = new WorkflowRegistry();
