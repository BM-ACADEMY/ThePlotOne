// controllers/advertisementController.js
const Property = require("../models/Property");

/**
 * Get all properties that have advertiseOnSocialMedia enabled
 * with populated seller details
 */
exports.getAdvertisedProperties = async (req, res) => {
    try {
        const advertisedProperties = await Property.find({
            advertiseOnSocialMedia: true,
        })
            .populate({
                path: "seller",
                select: "name phone business_type customId",
            })
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: advertisedProperties.length,
            data: advertisedProperties,
        });
    } catch (error) {
        console.error("Error fetching advertised properties:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching advertised properties",
            error: error.message,
        });
    }
};
