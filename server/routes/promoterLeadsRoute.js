// Promoter-facing lead routes — mounted at /api/leads.
// Distinct from routes/leadRoutes.js (mounted at /api/shared-leads), which
// serves the legacy SharedLead broadcast system, not campaign-delivered leads.
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isPromoter } = require("../middleware/promoterMiddleware");
const leadController = require("../controllers/leadController");

// Task 5.1 — all of the logged-in promoter's own leads, across their projects
router.get("/my-leads", protect, isPromoter, leadController.getMyLeads);

// Task 5.2 — update a lead's promoterStatus/promoterNotes, following the allowed transitions
router.put("/:leadId/status", protect, isPromoter, leadController.updateMyLeadStatus);

module.exports = router;
