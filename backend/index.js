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
const { startProactiveAssistant } = require("./utils/proactiveAssistant");

const app = express();
const PORT = process.env.PORT || 7050;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
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

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/common", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
    });
    startProactiveAssistant();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
  });
