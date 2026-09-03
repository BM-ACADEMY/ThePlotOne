const mongoose = require("mongoose");

const sharedLeadSchema = new mongoose.Schema(
  {
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "closed", "Deal Closed (Plan Level)"],
      default: "pending",
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    matchType: {
      type: String,
      enum: ["exact", "not-exact"],
      default: "not-exact",
    },
    matchPriority: {
      type: Number,
      default: 3, // 1: Builder Match, 2: Agent Match, 3: No Match
    },
    acceptedByMatchedSellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rejectedByMatchedSellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sellerStatuses: [
      {
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["not yet connected", "in process", "holded", "done"],
          default: "not yet connected",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Only one seller can accept a shared lead instance
sharedLeadSchema.index({ requirement: 1, plan: 1 }, { unique: true });

module.exports = mongoose.model("SharedLead", sharedLeadSchema);
