const mongoose = require("mongoose");

const requestCallSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    category: { type: String, required: true }, // buyer, seller, agent, builder
    preferredTime: { type: String, required: true },
    preferred_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RequestCall", requestCallSchema);
