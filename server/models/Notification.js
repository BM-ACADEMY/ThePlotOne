const mongoose = require("mongoose");

// Portal (in-app) notifications — distinct from PushSubscription (browser push
// delivery mechanism) and email templates. This is the persisted, readable,
// markable-as-read record behind the bell icon. Fields per Admin Module Task 9.1.
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "new_lead",
        "lead_limit_reached",
        "campaign_activation_required",
        "admin_lead_limit",
        "campaign_completed",
        "campaign_behind_pace",
        "campaign_ahead_of_pace",
        "campaign_activated",
        "campaign_paused",
        "campaign_extended",
        "admin_campaign_extended",
        "admin_campaign_completed",
        "daily_self_audit",
      ],
      required: true,
    },
    link: { type: String }, // where to navigate on click
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g. Requirement/Campaign id
    relatedModel: { type: String }, // e.g. 'Requirement', 'Campaign'
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
