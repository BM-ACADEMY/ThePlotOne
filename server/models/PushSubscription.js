const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  deviceType: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
}, { timestamps: true });

// Avoid duplicate subscriptions for the same user and endpoint
pushSubscriptionSchema.index({ user: 1, "subscription.endpoint": 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
