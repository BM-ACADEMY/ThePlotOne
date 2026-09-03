const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true 
    },
    discountType: { 
      type: String, 
      enum: ["percentage", "fixed"], 
      default: "percentage" 
    },
    discountValue: { 
      type: Number, 
      required: true, 
      min: 0
    },
    maxUsageTotal: { 
      type: Number, 
      default: null 
    }, // null means unlimited total uses
    maxUsagePerUser: { 
      type: Number, 
      default: 1 
    }, // How many times a single user can use it
    minSpend: { 
      type: Number, 
      default: 0 
    },
    termsAndConditions: { 
      type: String 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    endDate: { 
      type: Date 
    },
    usedCount: { 
      type: Number, 
      default: 0 
    },
    status: { 
      type: String, 
      enum: ["active", "inactive"], 
      default: "active" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
