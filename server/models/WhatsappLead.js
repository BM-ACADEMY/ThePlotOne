// models/WhatsappLead.js
const mongoose = require("mongoose");

const whatsappLeadSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // Made optional
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enquirer_name: { type: String },
    enquirer_phone: { type: String },
    enquirer_email: { type: String },
    message: { type: String },
    status: { type: String, default: "new" }, // new, contacted, closed
    property_title: { type: String }, // Snapshot of title
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WhatsappLead", whatsappLeadSchema);
