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
    email: {
      type: String,
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

    // Campaign linkage — set once, never changes (enforces lead ownership)
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      immutable: true,
    },
    matchedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    csvImportBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CsvImportBatch",
    },
    tier: {
      type: String,
      enum: ["tier1", "tier2"],
    },
    source: {
      type: String,
      enum: ["meta_ad", "reel", "website", "walkin", "call"],
    },

    // Promoter-side status tracking
    promoterStatus: {
      type: String,
      enum: [
        "pending",
        "contacted",
        "site_visit_scheduled",
        "visited",
        "interested",
        "not_interested",
        "closed_won",
        "closed_lost",
      ],
      default: "pending",
    },
    promoterStatusUpdatedAt: {
      type: Date,
    },
    promoterNotes: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Matching fields — used during CSV import to validate lead relevance:
//   preferredLocation   <-> Property.location.city + Property.location.locality
//   minBudget-maxBudget <-> Property.pricing.sell.minPrice - Property.pricing.sell.maxPrice
//   propertyType        <-> Property.basicInfo.propertyType
//   usageType           <-> Property.basicInfo.usageType

// campaignId is set once and must never change (lead ownership rule)
requirementSchema.pre("save", function () {
  if (!this.isNew && this.isModified("campaignId")) {
    throw new Error("campaignId is immutable once set");
  }
});

module.exports = mongoose.model("Requirement", requirementSchema);
