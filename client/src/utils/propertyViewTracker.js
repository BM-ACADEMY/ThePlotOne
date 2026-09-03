// utils/propertyViewTracker.js
import axios from "axios";

/**
 * Record a property view
 * Automatically prevents duplicate views from same user on same day
 * @param {string} propertyId - The ID of the property being viewed
 * @returns {Promise<Object>} Response indicating if view was recorded
 */
export const recordPropertyView = async (propertyId) => {
    try {
        const token = localStorage.getItem("token");

        const config = token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {};

        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/property-views/${propertyId}`,
            {},
            config
        );

        return response.data;
    } catch (error) {
        console.error("Error recording property view:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Failed to record view",
        };
    }
};

/**
 * Get view analytics for a property
 * @param {string} propertyId - The ID of the property
 * @returns {Promise<Object>} View analytics data
 */
export const getPropertyViewAnalytics = async (propertyId) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/property-views/${propertyId}/analytics`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching view analytics:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Failed to fetch analytics",
        };
    }
};
