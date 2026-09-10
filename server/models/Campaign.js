const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    promoter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    committedMinimum: { type: Number, required: true },
    deliveredCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "payment_received", "active", "paused", "completed", "expired"],
      default: "draft",
    },
    discountTier: { type: Number, enum: [1, 2, 3, 4] },
    goLiveAt: { type: Date },
    expiresAt: { type: Date },
    paceStatus: {
      type: String,
      enum: ["on_track", "behind", "ahead", "completed"],
      default: "on_track",
    },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cityId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

campaignSchema.index({ promoter: 1 });
campaignSchema.index({ project: 1 });
campaignSchema.index({ status: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);
