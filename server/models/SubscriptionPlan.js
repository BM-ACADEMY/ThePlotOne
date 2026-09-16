const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
    },
    displayName: { 
      type: String, 
      required: false, // Fallback to name if not provided
    },
    businessType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessType",
      required: true
    },
    price: { type: Number, required: true },
    propertyLimit: { 
      type: Number, 
      required: true, 
      default: 3 
    }, // -1 or high number for unlimited
    leadsLimit: {
      type: Number,
      required: true,
      default: 2
    }, // Total leads the seller can receive/accept
    committedMinimum: {
      type: Number,
      default: 0
    }, // Campaign plans only — guaranteed lead count per Pricing V7 §2.1 (22/50/85).
       // 0/unset means this plan isn't configured for campaigns yet.
    tier2Minimum: {
      type: Number,
      default: 0
    }, // Campaign plans only — minimum ready-buyer (Tier 2) leads within committedMinimum.
    planCategory: {
      type: String,
      enum: ["promoter", "agent"],
      default: "agent"
    }, // Distinguishes promoter campaign plans from agent/owner listing plans.
    duration: {
      type: Number, 
      required: false, // Optional for lifetime plans
      default: 30 
    }, // Duration in days
    features: [{ type: String }],
    notIncluded: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["active", "inactive"], 
      default: "active" 
    },
  },
  { timestamps: true }
);

// Compound unique index for name and businessType
subscriptionPlanSchema.index({ name: 1, businessType: 1 }, { unique: true });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
