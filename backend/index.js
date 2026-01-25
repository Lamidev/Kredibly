const express = require("express"); 
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth/authRoutes");
const businessRoutes = require("./routes/business/businessRoutes");
const saleRoutes = require("./routes/business/saleRoutes");
const uploadRoutes = require("./routes/common/uploadRoutes");
const whatsappRoutes = require("./routes/whatsapp/whatsappRoutes");
const notificationRoutes = require("./routes/business/notificationRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const supportRoutes = require("./routes/admin/supportRoutes");
const paymentRoutes = require("./routes/common/paymentRoutes");
const waitlistRoutes = require("./routes/common/waitlistRoutes");
const { startProactiveAssistant } = require("./utils/proactiveAssistant");
const { startTicketCleanup } = require("./utils/ticketScheduler");

const app = express();
const PORT = process.env.PORT || 7050;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:5173",
        "https://usekredibly.com",
        "https://www.usekredibly.com"
      ];
      
      const isAllowed = allowedOrigins.includes(origin) || (origin && origin.includes("ngrok-free.dev"));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept"
    ],
    credentials: true,
  })
);

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());

// Health Check
app.get("/api/health-check", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({ 
    status: "alive", 
    database: dbStatus,
    timestamp: new Date() 
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/common", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("🚨 Global Error Catch:", err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Something went wrong inside Kreddy's brain!",
  });
});

// Database Connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
    });
    startProactiveAssistant();
    startTicketCleanup();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
  });

// Process Protection: Prevent crash on unexpected errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Kreddy is trying to stay alive...", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION! Keeping the lights on...", reason);
});
