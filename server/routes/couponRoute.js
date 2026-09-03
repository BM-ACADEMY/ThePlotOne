const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { protect, admin } = require("../middleware/authMiddleware");

// User routes
router.post("/validate", protect, couponController.validateCoupon);
router.get("/get-valid", protect, couponController.getValidCoupons);

// Admin routes
router.get("/", protect, admin, couponController.getAllCoupons);
router.post("/", protect, admin, couponController.createCoupon);
router.put("/:id", protect, admin, couponController.updateCoupon);
router.delete("/:id", protect, admin, couponController.deleteCoupon);

module.exports = router;
