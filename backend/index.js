require("./instrument");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config({ override: true });

// 1. Process Protection: Register these FIRST to catch early setup errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Kreddy is staying alive...", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION! Keeping the lights on...", reason);
});

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
const { startBackupScheduler } = require("./utils/backupService");
const { setupSentryErrorHandler } = require("./utils/sentry");
const { scheduleMorningSummary } = require("./utils/cronJobs");

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss");

const app = express();
const PORT = process.env.PORT || 7050;

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Security Middleware: Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many login/auth attempts. Please wait 15 minutes." },
});

// Apply rate limiting
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/business/payout-settings", authLimiter);

// 3. Data Sanitization
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "10kb",
  })
);

// NoSQL & XSS Protection (Custom for Express 5/getter compatibility)
const sanitizeAll = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  
  Object.keys(obj).forEach((key) => {
    // 1. NoSQL Injection Protection: Remove keys starting with $
    if (key.startsWith("$")) {
      delete obj[key];
      return;
    }

    const value = obj[key];

    // 2. XSS Protection: Sanitize strings
    if (typeof value === "string") {
      obj[key] = xss(value);
    } 
    // Recursive check for nested objects
    else if (typeof value === "object" && value !== null) {
      sanitizeAll(value);
    }
  });
  return obj;
};

app.use((req, res, next) => {
  // We sanitize body, query and params as much as Express 5 allows
  // Body is usually a plain object we can modify
  if (req.body) sanitizeAll(req.body);
  
  // For query/params, we sanitize values inside without re-assigning the whole object
  if (req.query) sanitizeAll(req.query);
  if (req.params) sanitizeAll(req.params);
  
  next();
});

// 4. CORS & Cookies
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "https://usekredibly.com",
        "https://www.usekredibly.com",
      ];

      const isAllowed =
        allowedOrigins.includes(origin) ||
        (origin && origin.includes("ngrok-free.dev"));

      if (isAllowed) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);

app.use(cookieParser());

// 3. Health Check
app.get("/api/health-check", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    status: "alive",
    database: dbStatus,
    timestamp: new Date(),
  });
});

// 4. Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/common", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/stats", require("./routes/admin/statsRoutes"));
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/coupons", require("./routes/common/couponRoutes"));

// 5. Sentry Error Handler (Must be before any other error middleware)
setupSentryErrorHandler(app);

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 Global Error Catch:", err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Something went wrong inside Kreddy's brain!",
  });
});

// 6. Database Connection
if (!process.env.MONGODB_URL) {
  console.error("❌ MONGODB_URL is missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    startProactiveAssistant();
    startTicketCleanup();
    startBackupScheduler();
    scheduleMorningSummary();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });

// 7. Start Server
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

