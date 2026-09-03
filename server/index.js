require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const connectDB = require("./config/db");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const compression = require("compression");

// Import all routes
const roleRoutes = require("./routes/roleRoute");
const userRoutes = require("./routes/userRoute");
const propertyRoutes = require("./routes/propertyRoute");
const propertyAttributeRoutes = require("./routes/propertyAttributeRoute");
const reviewRoutes = require("./routes/reviewRoute");
const whatsappLeadRoutes = require("./routes/whatsappLeadRoute");
const websiteSettingRoutes = require("./routes/websiteSettingRoute");
const socialMediaRoutes = require("./routes/socialMediaRoute");
const testimonialRoutes = require("./routes/testimonialRoute");
const enquiryRoutes = require("./routes/enquiryRoute");
const businessTypeRoutes = require("./routes/businessTypeRoute");
const approvalTypeRoutes = require("./routes/approvalTypeRoute");
const sellerRequestRoutes = require("./routes/sellerRequestRoute");
const advertisementRoutes = require("./routes/advertisementRoute");
const propertyViewRoutes = require("./routes/propertyViewRoute");
const marketingRoutes = require("./routes/marketingRoute");
const propertyTypeRoutes = require("./routes/propertyTypeRoute");
const bannerAdRoutes = require("./routes/bannerAdRoute");
const formRoutes = require("./routes/formRoutes");
const requirementRoutes = require("./routes/requirementRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const leadRoutes = require("./routes/leadRoutes");
const couponRoutes = require("./routes/couponRoute");

const supportTicketRoutes = require("./routes/supportTicketRoute");
const notificationRoutes = require("./routes/notificationRoute");


const app = express();
app.set("trust proxy", true);


/* ===============================
   Middleware (order matters)
================================ */

// Logging first (fast feedback)
app.use(morgan("dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Compression (must be before static files and routes)
app.use(compression());

// Serve Static Files with caching (1 day)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: '1d',
  immutable: true
}));

// Cookies
app.use(cookieParser());

// CORS (after parsers)
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
  }),
);

// COOP header for Google One Tap / Sign-in popup communication
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

/* ===============================
   Routes
================================ */

// Root & Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    db: "connected", // you can make this dynamic later if needed
  });
});

// API Routes (versioned under /api)
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/property-attributes", propertyAttributeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/whatsapp-leads", whatsappLeadRoutes);
app.use("/api/website-settings", websiteSettingRoutes);
app.use("/api/social-media", socialMediaRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/business-types", businessTypeRoutes);
app.use("/api/property-types", propertyTypeRoutes);
app.use("/api/approval-types", approvalTypeRoutes);
app.use("/api/seller-requests", sellerRequestRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/property-views", propertyViewRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/banner-ads", bannerAdRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/shared-leads", leadRoutes);
app.use("/api/coupons", couponRoutes);

app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/notifications", notificationRoutes);


/* ===============================
   404 Handler (must be last route)
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ===============================
   Global Error Handler
================================ */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* ===============================
   Server + DB Bootstrap
================================ */
const PORT = process.env.PORT || 5000;

const { initCronJobs } = require("./utils/cronJobs");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Store io instance in app for access in controllers
app.set("socketio", io);

// Basic Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 New websocket connection:", socket.id);

  socket.on("join-seller-room", (sellerId) => {
    socket.join(`seller-${sellerId}`);
    console.log(`👤 Seller joined room: seller-${sellerId}`);
  });

  socket.on("join-admin-room", () => {
    socket.join("admin-room");
    console.log("👑 Admin joined room: admin-room");
  });

  socket.on("disconnect", () => {
    console.log("🔌 Websocket disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await connectDB(); // Wait for DB connection

    // Initialize scheduled tasks with io instance
    initCronJobs(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
 
