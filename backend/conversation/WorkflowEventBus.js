const EventEmitter = require("events");

class WorkflowEventBus extends EventEmitter {
    constructor() {
        super();
        this.on("error", (err) => {
            console.error("🚨 [WorkflowEventBus] Error occurred:", err);
        });
    }

    publish(eventName, payload) {
        console.log(`📢 [WorkflowEventBus] Publishing event: "${eventName}"`, payload);
        this.emit(eventName, payload);
    }

    subscribe(eventName, listener) {
        this.on(eventName, async (payload) => {
            try {
                await listener(payload);
            } catch (err) {
                console.error(`🚨 [WorkflowEventBus] Subscriber failed for event "${eventName}":`, err);
            }
        });
    }
}

// Export singleton instance
module.exports = new WorkflowEventBus();
