const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    plan: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "SubscriptionPlan", 
      required: true 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["active", "expired", "cancelled"], 
      default: "active" 
    },
    leadsUsed: {
      type: Number,
      default: 0
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "pending" 
    },
    amountPaid: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
