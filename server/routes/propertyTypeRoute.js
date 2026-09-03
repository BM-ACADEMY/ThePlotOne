const express = require("express");
const router = express.Router();
const propertyTypeController = require("../controllers/propertyTypeController");
const { protect } = require("../middleware/authMiddleware");
const propertyTypeUpload = require("../middleware/propertyTypeUploadMiddleware");

// Admin only routes for CRUD
router.post("/", protect, propertyTypeUpload.single("image"), propertyTypeController.createPropertyType);
router.put("/:id", protect, propertyTypeUpload.single("image"), propertyTypeController.updatePropertyType);
router.delete("/:id", protect, propertyTypeController.deletePropertyType);

// Public route for fetching
router.get("/", propertyTypeController.getPropertyTypes);
router.get("/:id", propertyTypeController.getPropertyTypeById);

module.exports = router;
