/**
 * V2 Workflow State Engine Bootstrapper
 * Registers all manifests and handlers with the central WorkflowRegistry.
 */

const WorkflowRegistry = require("./WorkflowRegistry");

// ── Invoice Creation Workflow ───────────────────────────────────────────────
const invoiceManifest = require("../workflows/invoice/manifest");
const InvoiceWorkflow = require("../workflows/invoice/handlers");
const invoiceHandler = new InvoiceWorkflow(invoiceManifest);

WorkflowRegistry.register("invoice_creation", invoiceManifest, invoiceHandler);

// ── Extension Workflows ──────────────────────────────────────────────────────
const extensionManifests = require("../workflows/extension/manifest");
const extensionHandlers = require("../workflows/extension/handlers");

const merchantHandler = new extensionHandlers.merchant(extensionManifests.merchant);
const customerHandler = new extensionHandlers.customer(extensionManifests.customer);

WorkflowRegistry.register("merchant_extension", extensionManifests.merchant, merchantHandler);
WorkflowRegistry.register("customer_extension", extensionManifests.customer, customerHandler);

// Load event subscribers
require("./subscribers");

module.exports = {
    initialized: true
};
