const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
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
    planName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    finalAmount: { type: Number },
    originalPrice: { type: Number },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    paymentStatus: { 
      type: String, 
      enum: ["completed", "failed", "refunded"], 
      default: "completed" 
    },
    transactionDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentHistory", paymentHistorySchema);
