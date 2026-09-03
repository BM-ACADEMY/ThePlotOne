const mongoose = require("mongoose");

const sellerRequestSchema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    business_type: { type: String },
    status: {
      type: String,
      enum: ["pending", "contacted", "resolved"],
      default: "pending",
    },
    message: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SellerRequest", sellerRequestSchema);
