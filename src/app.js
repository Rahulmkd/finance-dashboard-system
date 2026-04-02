import express from "express";

// Initialize express app
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Finace API is running" });
});

export default app;
