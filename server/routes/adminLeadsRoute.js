// Admin-facing campaign leads route — mounted at /api/admin/leads.
// Distinct from routes/promoterLeadsRoute.js (promoter-facing, /api/leads).
const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const leadController = require("../controllers/leadController");

// Admin Module Task 5.1 — all campaign-delivered leads, platform-wide
router.get("/", protect, admin, leadController.getAllLeads);

module.exports = router;
