// Telecaller-facing routes — mounted at /api/telecaller.
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isTelecaller } = require("../middleware/telecallerMiddleware");
const telecallerController = require("../controllers/telecallerController");

// Telecaller Module Task 3.1 — qualification submit
router.put("/requirements/:id/qualify", protect, isTelecaller, telecallerController.qualifyRequirement);

// Telecaller Module Task 3.4 — in-house pitch outcome
router.put("/requirements/:id/pitch-outcome", protect, isTelecaller, telecallerController.submitPitchOutcome);

// Telecaller Module Task 4.1 — Tier 2 in-house catch-all queue
router.get("/requirements/tier2-catchall", protect, isTelecaller, telecallerController.getTier2CatchAllQueue);

// Telecaller Module Task 5.1 — site visit verification list (promoter side)
router.get("/verification/site-visits", protect, isTelecaller, telecallerController.getSiteVisitVerifications);

module.exports = router;
