const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional: if user is logged in
    },
    enquirer_name: { type: String, required: false }, // Optional for click leads
    enquirer_email: { type: String, required: false },
    enquirer_phone: { type: String, required: false },
    visitor_info: {
      // Basic info if not logged in
      ip: String,
      userAgent: String,
    },
    message: {
      type: String,
      default: "I'm interested in this property",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
    property_title: { type: String }, // Snapshot of title at the time of enquiry
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

console.log("Enquiry Model Loaded");
module.exports = mongoose.model("Enquiry", enquirySchema);
