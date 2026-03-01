import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import config from "./src/config/config.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

// Routes
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import stockRoutes from "./routes/stockRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import threadRoutes from "./routes/threadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import masterRoutes from "./modules/master/master.routes.js";
import { getCategories } from "./controllers/productController.js";
import { protect } from "./src/middleware/auth.middleware.js";

console.log("🎬 Booting server...");

const app = express();

// --- Security & Production Middleware ---
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows loading images from other origins (S3/Local)
  }),
);
app.use(compression()); // Compress all responses
app.use(express.json({ limit: "10mb" })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging: Combined format for production, dev format for development
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// CORS: Configurable whitelist from environment
const allowedOrigins = [
  "https://boonraksa-phase1.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isVercel = origin.includes("vercel.app");
    const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");

    if (isVercel || isLocal || config.NODE_ENV === "development") {
      callback(null, true);
    } else {
      console.log("CORS Blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// --- API Routes ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/products", productRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/master", masterRoutes);

app.use("/api/upload", uploadRoutes);

// Serves static files in development (fallback for NIPA/S3)
if (config.NODE_ENV === "development") {
  app.use("/uploads", express.static("uploads"));
}

app.get("/api/categories", protect, getCategories);

// --- 404 & Error Handling ---

// Catch-all for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global Error Handler (Production-safe)
app.use(errorHandler);

// --- Server Startup ---
const PORT = process.env.PORT || config.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server is running in ${config.NODE_ENV} mode
  🔗 Access Port: ${PORT}
  🛠️  Health Check: /health
  `);
});

// Graceful Shutdown for PM2
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.info("HTTP server closed");
  });
});
