let io;

module.exports = {
    init: (server) => {
        const { Server } = require("socket.io");
        io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    const allowedOrigins = [
                        "http://localhost:5173",
                        "https://usekredibly.com",
                        "https://www.usekredibly.com"
                    ];
                    if (!origin || allowedOrigins.includes(origin) || origin.includes("ngrok-free.dev")) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                methods: ["GET", "POST"]
            }
        });

        io.on("connection", (socket) => {
            const isDev = process.env.NODE_ENV !== 'production';
            if (isDev) console.log("🔌 Socket connected:", socket.id);

            // Join a private room for a specific business
            socket.on("join_business", (businessId) => {
                if (businessId) {
                    socket.join(businessId);
                    if (isDev) console.log(`🏢 Socket ${socket.id} joined business room: ${businessId}`);
                }
            });

            // Join a per-invoice room (for public invoice pages with no auth)
            socket.on("join_invoice", (invoiceId) => {
                if (invoiceId) {
                    const normalizedId = String(invoiceId).toLowerCase();
                    socket.join(`invoice:${normalizedId}`);
                    if (isDev) console.log(`📄 Socket ${socket.id} joined invoice room: invoice:${normalizedId}`);
                }
            });

            socket.on("disconnect", () => {
                if (isDev) console.log("🔌 Socket disconnected:", socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            console.warn("⚠️ Socket.io not initialized!");
        }
        return io;
    }
};
