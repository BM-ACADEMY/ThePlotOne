const mongoose = require("mongoose");

const propertyTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        usageType: {
            type: String,
            enum: ["Residential", "Commercial"],
            required: true
        },
        hasRooms: {
            type: Boolean,
            default: false
        },
        hasFloor: {
            type: Boolean,
            default: false
        },
        hasPlot: {
            type: Boolean,
            default: false
        },
        hasCommercial: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        imageUrl: {
            type: String,
            required: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PropertyType", propertyTypeSchema);
