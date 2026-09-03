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
