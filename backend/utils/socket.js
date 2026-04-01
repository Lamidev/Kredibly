let io;

module.exports = {
    init: (server) => {
        const { Server } = require("socket.io");
        io = new Server(server, {
            cors: {
                origin: ["http://localhost:5173", "https://usekredibly.com", "https://www.usekredibly.com"],
                methods: ["GET", "POST"]
            }
        });

        io.on("connection", (socket) => {
            console.log("🔌 Socket connected:", socket.id);

            // Join a private room for a specific business
            socket.on("join_business", (businessId) => {
                if (businessId) {
                    socket.join(businessId);
                    console.log(`🏢 Socket ${socket.id} joined business room: ${businessId}`);
                }
            });

            socket.on("disconnect", () => {
                console.log("🔌 Socket disconnected:", socket.id);
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
