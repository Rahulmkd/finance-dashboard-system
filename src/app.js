import express from "express";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Initialize express app
const app = express();
app.use(express.urlencoded({ extended: true }));

// ─── RATE LIMITING ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // limit each IP
  message: "Too many requests, please try again later",
});

app.use(express.json());
app.use("/api", limiter);

// ─── HEALTH CHECK ROUTE ────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Finance API is running" });
});

// ─── ROUTES ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
// 404 handler — for undefined routes

// ─── 404 HANDLER ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────
app.use(errorHandler);

export default app;
