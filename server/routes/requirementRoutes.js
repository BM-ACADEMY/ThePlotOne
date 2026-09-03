const express = require("express");
const router = express.Router();
const requirementController = require("../controllers/requirementController");
const { protect, admin, optionalProtect } = require("../middleware/authMiddleware");

// @route   POST /api/requirements
// @desc    Submit a new requirement
// @access  Public/Optional Auth (to attach user ID)
router.post("/", optionalProtect, requirementController.createRequirement);

// @route   GET /api/requirements
// @desc    Get all requirements
// @access  Admin
router.get("/", protect, admin, requirementController.getRequirements);

// @route   PATCH /api/requirements/:id
// @desc    Update requirement status
// @access  Admin
router.patch("/:id", protect, admin, requirementController.updateRequirementStatus);

// @route   DELETE /api/requirements/:id
// @desc    Delete a requirement
// @access  Admin
router.delete("/:id", protect, admin, requirementController.deleteRequirement);

// @route   GET /api/requirements/subscription-stats
// @desc    Get subscription stats for lead sharing
// @access  Admin
router.get("/subscription-stats", protect, admin, requirementController.getSubscriptionStats);

// @route   POST /api/requirements/:id/trigger-timer
// @desc    Trigger automated lead sharing with timer
// @access  Admin
router.post("/:id/trigger-timer", protect, admin, requirementController.triggerLeadSharingTimer);

// @route   POST /api/requirements/:id/stop-timer
// @desc    Stop automated lead sharing timer
// @access  Admin
router.post("/:id/stop-timer", protect, admin, requirementController.stopLeadSharingTimer);

router.post("/:id/share", protect, admin, requirementController.shareRequirement);
router.post("/:id/check-expiry", protect, admin, requirementController.checkRequirementExpiry);

module.exports = router;
