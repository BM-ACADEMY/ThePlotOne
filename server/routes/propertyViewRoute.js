// routes/propertyViewRoute.js
const express = require("express");
const router = express.Router();
const {
    recordPropertyView,
    getPropertyViewAnalytics,
} = require("../controllers/propertyViewController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");

// Record a view (works for both authenticated and guest users)
router.post("/:property_id", optionalProtect, recordPropertyView);

// Get view analytics (protected - admin only ideally)
router.get("/:property_id/analytics", protect, getPropertyViewAnalytics);

module.exports = router;
