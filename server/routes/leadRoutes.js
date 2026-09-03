const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const { protect } = require("../middleware/authMiddleware");

// @route   GET /api/shared-leads/my-leads
// @desc    Get leads shared with the seller's active plan
// @access  Private (Seller/Authenticated)
router.get("/my-leads", protect, leadController.getSharedLeads);

// @route   POST /api/shared-leads/:id/accept
// @desc    Accept a shared lead
// @access  Private (Seller/Authenticated)
router.post("/:id/accept", protect, leadController.acceptLead);
router.post("/:id/reject", protect, leadController.rejectLead);
router.patch("/:id/status", protect, leadController.updateLeadStatus);

module.exports = router;
