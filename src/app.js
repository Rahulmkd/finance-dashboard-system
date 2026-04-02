import express from "express";
import authRoutes from "./routes/auth.routes.js";
// Initialize express app
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Finace API is running" });
});

// Mount routes
app.use("/api/auth", authRoutes);

export default app;
