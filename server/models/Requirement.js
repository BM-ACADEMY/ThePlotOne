const mongoose = require("mongoose");

const requirementSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Rent", "Sell/Buy"],
      required: true,
    },
    usageType: {
      type: String,
      enum: ["Residential", "Commercial"],
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    preferredLocation: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    locationText: {
      type: String,
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
    },
    minBudget: {
      type: Number,
    },
    maxBudget: {
      type: Number,
    },
    propertyPreferences: {
      type: String,
      trim: true,
    },
    heardFrom: {
      type: String,
      enum: [
        "Social Media",
        "Facebook",
        "Instagram",
        "YouTube",
        "LinkedIn",
        "WhatsApp",
        "Google Search",
        "Reference",
        "Newspaper/Ad",
        "Others",
      ],
      required: false,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Closed"],
      default: "Pending",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sharingStatus: {
      type: String,
      enum: ["none", "in-progress", "completed", "unclaimed", "expired"],
      default: "none",
    },
    sharingConfig: {
      plans: [String], // e.g. ["Pro", "Premium", "Standard"]
      timer: Number, // in minutes
      currentPlanIndex: { type: Number, default: 0 },
      startTime: Date,
    },
    closureDate: {
      type: Date,
    },
    needTimeframe: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Requirement", requirementSchema);
