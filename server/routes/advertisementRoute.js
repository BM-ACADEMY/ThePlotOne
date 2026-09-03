// routes/advertisementRoute.js
const express = require("express");
const router = express.Router();
const { getAdvertisedProperties } = require("../controllers/advertisementController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin-only route to get all advertised properties
router.get(
    "/",
    protect,
    admin,
    getAdvertisedProperties
);

module.exports = router;
