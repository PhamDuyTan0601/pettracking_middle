const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép tất cả GSM devices
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/gsm", require("./routes/gsmGateway"));
app.use("/api/device", require("./routes/gsmDeviceRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "🐾 GSM Gateway Server is running (HTTP)",
    timestamp: new Date(),
    version: "1.0",
    endpoints: {
      gsmData: "POST /api/gsm/gsm-data",
      simpleLocation: "POST /api/gsm/location",
      health: "GET /api/device/health",
    },
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 GSM Gateway running on port ${PORT} (HTTP)`);
  console.log(`📱 Endpoint: http://localhost:${PORT}`);
});
