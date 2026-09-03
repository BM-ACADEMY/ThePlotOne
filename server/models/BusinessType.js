// models/BusinessType.js
const mongoose = require("mongoose");

const businessTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: "active" }, // active, inactive
  },
  { timestamps: true },
);

module.exports = mongoose.model("BusinessType", businessTypeSchema);
