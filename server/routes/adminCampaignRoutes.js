// Admin-facing campaign routes — mounted at /api/admin/campaigns.
// Distinct from routes/campaignRoutes.js (promoter-facing, /api/campaigns).
const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const campaignController = require("../controllers/campaignController");
const csvImportController = require("../controllers/csvImportController");
const csvUpload = require("../middleware/csvUploadMiddleware");

// Task 7.1 — Campaigns Overview (list + filters)
router.get("/", protect, admin, campaignController.getAllCampaigns);

// Task 7.5 — Pending Campaigns Queue. MUST come before GET /:id below —
// otherwise Express matches "pending" against the :id param first and this
// handler is never reached.
router.get("/pending", protect, admin, campaignController.getPendingCampaigns);

// Task 9.2 — Campaign Status widget for the Admin Dashboard. Same
// route-ordering requirement as /pending above — must come before GET /:id.
router.get("/stats", protect, admin, campaignController.getCampaignStats);

// Task 9.1 — Promoter Detail View campaign summary. Keyed by promoter id, not
// campaign id — a distinct 2-segment path, so no ordering conflict with /:id.
router.get("/by-promoter/:id", protect, admin, campaignController.getPromoterCampaigns);

// Task 7.3 — Campaign Detail View
router.get("/:id", protect, admin, campaignController.getCampaignDetail);

// Task 7.2 — Activate a campaign (payment_received -> active)
router.put("/:id/activate", protect, admin, campaignController.activateCampaign);

// Task 7.4 — Pause / Extend / Complete
router.put("/:id/pause", protect, admin, campaignController.pauseCampaign);
router.put("/:id/extend", protect, admin, campaignController.extendCampaign);
router.put("/:id/complete", protect, admin, campaignController.completeCampaign);

// Task 8.1 — CSV Lead Import
router.post(
  "/:id/import-leads",
  protect,
  admin,
  csvUpload.single("file"),
  csvImportController.importLeads,
);

module.exports = router;
