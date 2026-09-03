const mongoose = require("mongoose");

const marketingPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        priceRange: { type: String, required: true },
        description: { type: String, required: true },
        isPopular: { type: Boolean, default: false },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

marketingPlanSchema.virtual("serviceName").get(function () {
    return this.name;
});

module.exports = mongoose.model("MarketingPlan", marketingPlanSchema);
