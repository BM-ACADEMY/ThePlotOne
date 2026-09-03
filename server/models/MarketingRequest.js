const mongoose = require("mongoose");

const marketingRequestSchema = new mongoose.Schema(
    {
        seller_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        plan_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MarketingPlan",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "contacted", "completed", "cancelled"],
            default: "pending",
        },
        notes: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MarketingRequest", marketingRequestSchema);
