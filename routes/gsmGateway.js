const express = require("express");
const axios = require("axios");
const router = express.Router();

const MAIN_SERVER = process.env.MAIN_SERVER_URL;

// 📍 Endpoint chính cho GSM
router.post("/gsm-data", async (req, res) => {
  try {
    const gsmData = req.body;

    console.log("📨 Nhận data từ GSM:", gsmData.deviceId);

    // Lấy petId từ deviceId
    let petId;
    try {
      const deviceResponse = await axios.get(
        `${MAIN_SERVER}/api/devices/pet/${gsmData.deviceId}`
      );
      petId = deviceResponse.data.petId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Device not registered",
      });
    }

    // Chuẩn hóa data
    const normalizedData = {
      petId: petId,
      latitude: parseFloat(gsmData.lat),
      longitude: parseFloat(gsmData.lng),
      batteryLevel: parseInt(gsmData.batt) || 100,
      timestamp: gsmData.time || new Date(),
      deviceId: gsmData.deviceId,
    };

    // Gửi đến server chính
    await axios.post(`${MAIN_SERVER}/api/petData`, normalizedData);

    res.json({
      success: true,
      message: "Data saved",
    });
  } catch (error) {
    console.error("❌ Gateway error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
