require("dotenv").config(); // ✅ MUST be first — loads env before anything else reads it

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const violationRoutes = require("./routes/violationRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/violation", violationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// Start server AFTER DB connection
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();