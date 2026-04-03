import express from "express";
import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Initialize express app
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Finace API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// 404 handler — for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
