const mongoose = require("mongoose");

const approvalTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: "active" }, // active, inactive
    visible_to_seller: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ApprovalType", approvalTypeSchema);
