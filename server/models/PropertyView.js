// models/PropertyView.js
const mongoose = require("mongoose");

const propertyViewSchema = new mongoose.Schema(
    {
        property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional for guest users
        },
        ip_address: {
            type: String,
            required: false, // Track IP for guests
        },
        viewed_at: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index to ensure efficient queries
propertyViewSchema.index({ property_id: 1, user_id: 1, viewed_at: 1 });

const PropertyView = mongoose.model("PropertyView", propertyViewSchema);

module.exports = PropertyView;
