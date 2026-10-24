const mongoose = require("mongoose");

// Backs the promoter commitment "replacement of any invalid lead reported
// within 48 hours" — a promoter claims a delivered lead is invalid, and a
// telecaller or admin reviews the claim.
const invalidLeadClaimSchema = new mongoose.Schema(
  {
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvalidLeadClaim", invalidLeadClaimSchema);
