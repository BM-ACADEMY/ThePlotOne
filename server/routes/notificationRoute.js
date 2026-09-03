const express = require("express");
const router = express.Router();
const PushSubscription = require("../models/PushSubscription");
const { protect } = require("../middleware/authMiddleware");

// Subscribe a user to push notifications
router.post("/subscribe", protect, async (req, res) => {

  try {
    const { subscription, deviceType } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: "Invalid subscription object" });
    }

    // Upsert the subscription
    await PushSubscription.findOneAndUpdate(
      { user: req.user._id, "subscription.endpoint": subscription.endpoint },
      { 
        user: req.user._id, 
        subscription, 
        deviceType: deviceType || "desktop" 
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: "Subscribed to push notifications" });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unsubscribe a user
router.post("/unsubscribe", protect, async (req, res) => {

  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ user: req.user._id, "subscription.endpoint": endpoint });
    res.status(200).json({ success: true, message: "Unsubscribed from push notifications" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get VAPID public key
router.get("/vapid-public-key", (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
