const Sentry = require("@sentry/node");

/**
 * setupSentryErrorHandler
 * In v8+, this must be called AFTER all controllers but BEFORE other error middleware.
 */
const setupSentryErrorHandler = (app) => {
    if (!process.env.SENTRY_DSN) return;
    
    // The Express integration automatically handles many things, 
    // but this ensures the specific error handler is active.
    Sentry.setupExpressErrorHandler(app);
};

module.exports = { setupSentryErrorHandler };
