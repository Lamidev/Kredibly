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
// const { startProactiveAssistant } = require("./utils/proactiveAssistant"); // Redundant legacy queue worker, superseded by startBackgroundJobRunner
const { startTicketCleanup } = require("./utils/ticketScheduler");
const { startBackupScheduler } = require("./utils/backupService");
const { setupSentryErrorHandler } = require("./utils/sentry");
const { 
  scheduleMorningSummary, 
  scheduleRemindersWorker, 
  schedulePlanExpiryReminders, 
  scheduleProactiveFollowUps, 
  schedulePastDueEscalations, 
  scheduleEscrowPayouts, 
  scheduleMonthlyUsageReset,
  scheduleQueueHousekeeping,
  scheduleUpcomingNudges,
  scheduleBankLockChecker,
  scheduleDailySettlements,
  schedulePaymentSessionExpiry,
  scheduleAbandonedTasksFollowUp,
  startBackgroundJobRunner
} = require("./utils/cronJobs");

// Initialize V2 Workflow Registry
require("./conversation/bootstrap");

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize"); 
const xss = require("xss");

const app = express();
app.set('trust proxy', 1); // 🛡️ TRUST RENDER PROXY for rate-limiting
const PORT = process.env.PORT || 7050;

// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://*.cloudinary.com"],
      "connect-src": ["'self'", "https://api.usekredibly.com", "https://*.usekredibly.com", "http://localhost:7050"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 2. Security Middleware: Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, 
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, 
  message: { message: "Too many auth attempts. Please wait 15 minutes." },
});

app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 3. Data Sanitization
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "10kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 🛑 FIX: Express 4.x/5.x req.query getter issue with express-mongo-sanitize
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: req.query,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

app.use(mongoSanitize());

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
      const isAllowed = allowedOrigins.includes(origin) || (origin && origin.includes("ngrok-free.dev"));
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
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({ status: "alive", database: dbStatus, timestamp: new Date() });
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
app.use("/api/admin/feedback", require("./routes/admin/feedbackRoutes"));
app.use("/api/coupons", require("./routes/common/couponRoutes"));

// 5. Sentry Error Handler
setupSentryErrorHandler(app);

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 Global Error Catch:", err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Something went wrong inside Kreddy's brain!",
  });
});

const http = require("http");
const socketUtils = require("./utils/socket");

// 6. Database Connection
if (!process.env.MONGODB_URL) {
  console.error("❌ MONGODB_URL is missing in .env");
  process.exit(1);
}

const server = http.createServer(app);
socketUtils.init(server);

mongoose
  .connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    // 🛡️ PM2 CLUSTER PROTECTION: Only register cron schedulers on the primary instance
    const isPrimaryInstance = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
    if (isPrimaryInstance) {
        startTicketCleanup();
        startBackupScheduler();
        scheduleMorningSummary();
        scheduleRemindersWorker();
        schedulePlanExpiryReminders();
        scheduleProactiveFollowUps();
        schedulePastDueEscalations();
        scheduleEscrowPayouts();
        scheduleMonthlyUsageReset();
        scheduleQueueHousekeeping();
        scheduleUpcomingNudges();
        scheduleBankLockChecker();
        scheduleDailySettlements();
        schedulePaymentSessionExpiry();
        scheduleAbandonedTasksFollowUp();
    } else {
        console.log(`ℹ️ [PM2] Non-primary instance (${process.env.NODE_APP_INSTANCE}). Skipping scheduler registration to prevent duplicate triggers.`);
    }

    // Always start the worker on all instances to process the queue in parallel using atomic locks
    startBackgroundJobRunner();

    // 7. Start Server
    server.listen(PORT, () => {
      console.log(`🔥 Server + Sockets running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
