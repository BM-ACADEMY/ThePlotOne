// controllers/propertyViewController.js
const PropertyView = require("../models/PropertyView");
const Property = require("../models/Property");

/**
 * Record a property view
 * Only increments view_count if user hasn't viewed this property today
 */
exports.recordPropertyView = async (req, res) => {
    try {
        const { property_id } = req.params;
        const user_id = req.user ? req.user._id : null;
        const ip_address = req.ip || req.connection.remoteAddress;

        console.log(`[ViewRecord] Property: ${property_id}, User: ${user_id}, IP: ${ip_address}`);

        // Get start and end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Check if this user/IP already viewed this property today
        const query = {
            property_id,
            viewed_at: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        };

        if (user_id) {
            query.user_id = user_id;
        } else {
            query.ip_address = ip_address;
        }

        const existingView = await PropertyView.findOne(query);

        if (existingView) {
            console.log(`[ViewRecord] Already viewed today: ${property_id}`);
            return res.status(200).json({
                success: true,
                message: "View already recorded today",
                alreadyViewed: true,
            });
        }

        // Record new view
        await PropertyView.create({
            property_id,
            user_id,
            ip_address,
        });

        // Increment property view count by 50
        const updated = await Property.findByIdAndUpdate(property_id, {
            $inc: { view_count: 50 },
        }, { new: true });

        console.log(`[ViewRecord] Success! New view_count: ${updated?.view_count}`);

        res.status(200).json({
            success: true,
            message: "View recorded successfully",
            alreadyViewed: false,
            view_count: updated?.view_count
        });
    } catch (error) {
        console.error("Error recording property view:", error);
        res.status(500).json({
            success: false,
            message: "Error recording view",
            error: error.message,
        });
    }
};

/**
 * Get view analytics for a property
 */
exports.getPropertyViewAnalytics = async (req, res) => {
    try {
        const { property_id } = req.params;

        const totalViews = await PropertyView.countDocuments({ property_id });

        const uniqueUsers = await PropertyView.distinct("user_id", {
            property_id,
            user_id: { $ne: null },
        });

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentViews = await PropertyView.countDocuments({
            property_id,
            viewed_at: { $gte: last7Days },
        });

        res.status(200).json({
            success: true,
            analytics: {
                totalViews,
                uniqueUsers: uniqueUsers.length,
                last7DaysViews: recentViews,
            },
        });
    } catch (error) {
        console.error("Error fetching view analytics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching analytics",
            error: error.message,
        });
    }
};
