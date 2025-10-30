require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 Main backend URL từ environment variable
const MAIN_BACKEND =
  process.env.MAIN_BACKEND_URL || "https://pettracking2.onrender.com";
const TIMEOUT = parseInt(process.env.MIDDLEWARE_TIMEOUT) || 10000;

console.log("🔧 Middleware Configuration:");
console.log("   Port:", PORT);
console.log("   Main Backend:", MAIN_BACKEND);
console.log("   Timeout:", TIMEOUT + "ms");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==================== LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n=== 📨 [${timestamp}] ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`IP: ${req.ip}`);
  console.log(`User-Agent: ${req.get("User-Agent")}`);

  if (req.method === "POST" && req.body) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }

  next();
});

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🐾 Pet Tracker Middleware is running!",
    timestamp: new Date().toISOString(),
    main_backend: MAIN_BACKEND,
    endpoints: [
      "GET  /",
      "POST /api/petData",
      "GET  /api/devices/pet/:deviceId",
      "POST /api/devices/register",
    ],
  });
});

// ==================== PROXY: PET DATA ====================
app.post("/api/petData", async (req, res) => {
  try {
    console.log("📍 Nhận pet data từ ESP32");

    const response = await axios.post(`${MAIN_BACKEND}/api/petData`, req.body, {
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Pet-Tracker-Middleware/1.0.0",
      },
    });

    console.log("✅ Forward pet data thành công");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Lỗi forward pet data:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "Backend timeout - please try again",
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(502).json({
      success: false,
      message: "Cannot connect to main backend",
      error: error.message,
    });
  }
});

// ==================== PROXY: GET PET BY DEVICE ====================
app.get("/api/devices/pet/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log(`📱 ESP32 hỏi pet cho device: ${deviceId}`);

    const response = await axios.get(
      `${MAIN_BACKEND}/api/devices/pet/${deviceId}`,
      {
        timeout: TIMEOUT,
        headers: {
          "User-Agent": "Pet-Tracker-Middleware/1.0.0",
        },
      }
    );

    console.log("✅ Device lookup thành công");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Lỗi device lookup:", error.message);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(502).json({
      success: false,
      message: "Cannot get pet info from main backend",
      error: error.message,
    });
  }
});

// ==================== PROXY: REGISTER DEVICE ====================
app.post("/api/devices/register", async (req, res) => {
  try {
    console.log("📝 Đăng ký device mới:", req.body);

    const response = await axios.post(
      `${MAIN_BACKEND}/api/devices/register`,
      req.body,
      {
        timeout: TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Pet-Tracker-Middleware/1.0.0",
        },
      }
    );

    console.log("✅ Device registration thành công");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Lỗi device registration:", error.message);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(502).json({
      success: false,
      message: "Cannot register device with main backend",
      error: error.message,
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    requested_url: req.originalUrl,
    available_endpoints: [
      "GET  /",
      "POST /api/petData",
      "GET  /api/devices/pet/:deviceId",
      "POST /api/devices/register",
    ],
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║    🐾 PET TRACKER MIDDLEWARE SERVER      ║");
  console.log("║              🚀 STARTED!                 ║");
  console.log("╠════════════════════════════════════════════╣");
  console.log("║ Port: " + PORT + "                                  ║");
  console.log(
    "║ Environment: " +
      (process.env.NODE_ENV || "development") +
      "                      ║"
  );
  console.log("║ Main Backend: " + MAIN_BACKEND + "   ║");
  console.log("╚════════════════════════════════════════════╝\n");

  console.log("📡 Endpoints:");
  console.log("   GET  /");
  console.log("   POST /api/petData");
  console.log("   GET  /api/devices/pet/:deviceId");
  console.log("   POST /api/devices/register");
});
