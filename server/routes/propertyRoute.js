// routes/propertyRoutes.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const { protect, admin, optionalProtect } = require("../middleware/authMiddleware");
const propertyUpload = require("../middleware/propertyUploadMiddleware");

// Create a new property
router.post(
  "/create-property",
  protect,
  propertyUpload.fields([{ name: "images", maxCount: 10 }, { name: "floorPlans", maxCount: 10 }]),
  propertyController.createProperty,
);
// Get all properties
router.get("/fetch-all-property", optionalProtect, propertyController.getProperties);
// Get a property by ID
router.get("/fetch-property-by-id/:id", propertyController.getPropertyById);
// Get a property by Slug
router.get("/fetch-property-by-slug/:slug", propertyController.getPropertyBySlug);
// Get recommended properties
router.get("/fetch-recommended-properties/:id", propertyController.getRecommendedProperties);
// Get other properties by the same builder/promoter
router.get("/fetch-builder-other-properties/:id", propertyController.getBuilderOtherProperties);
// Update a property
router.put(
  "/update-property-by-id/:id",
  protect,
  propertyUpload.fields([{ name: "images", maxCount: 10 }, { name: "floorPlans", maxCount: 10 }]),
  propertyController.updateProperty,
);
// Delete a property
router.delete("/delete-property-by-id/:id", propertyController.deleteProperty);
// Increment view count
router.put("/increment-view-count/:id", propertyController.incrementViewCount);
// Verify property
router.put("/verify-property/:id", protect, admin, propertyController.verifyProperty);
// Reject pending property edit
router.put("/reject-edit/:id", protect, admin, propertyController.rejectPropertyEdit);
// Approve pending property edit
router.put("/approve-edit/:id", protect, admin, propertyController.approvePropertyEdit);
// Get property types
// router.get("/property-types", propertyController.getPropertyTypes); // Removed
// Get approval types
router.get("/approval-types", propertyController.getPropertyApprovals);
// Get all filters (types, approvals, locations, maxPrice)
router.get("/filters", propertyController.getFilters);
// Get amenities
router.get("/amenities", propertyController.getAmenities);

// Get suggestions for search bar
router.get("/suggestions", propertyController.getSuggestions);

// Get Seller Stats (Protected)
router.get("/seller-stats", protect, propertyController.getSellerStats);

// Update a property view count (Admin only)
router.put("/update-view-count/:id", protect, propertyController.updateViewCount);

// Get Admin Stats (Protected)
router.get("/admin-stats", protect, admin, propertyController.getAdminStats);

// Get Seller Overview Stats (Admin only)
router.get("/seller-overview-stats", protect, admin, propertyController.getSellerOverviewStats);

// Get Pending Seller Properties Count (Admin only)
router.get("/get-pending-seller-properties-count", protect, admin, propertyController.getPendingSellerPropertiesCount);

// Get specific property view stats (Admin only)
router.get("/property-view-stats/:id", protect, admin, propertyController.getPropertyViewStats);

module.exports = router;
