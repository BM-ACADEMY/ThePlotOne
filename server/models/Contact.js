
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    sellProperty: { type: Boolean, default: false },
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

module.exports = mongoose.model("Contact", contactSchema);
