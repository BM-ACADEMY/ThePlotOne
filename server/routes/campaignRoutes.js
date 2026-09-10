// Promoter-facing campaign routes — mounted at /api/campaigns.
// Distinct from the (not yet built) admin-facing campaign management routes,
// which will mount separately at /api/admin/campaigns.
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isPromoter } = require("../middleware/promoterMiddleware");
const subscriptionController = require("../controllers/subscriptionController");

// Backend-derived campaign count/discount status — used by SelectPlan.jsx so
// the UI matches what create-order will actually enforce (Task 4.1 fix)
router.get("/my-campaign-status", protect, isPromoter, subscriptionController.getMyCampaignStatus);

// Task 4.2 — create a campaign order for one project
router.post("/create-order", protect, isPromoter, subscriptionController.createCampaignOrder);

// Task 4.3 — verify payment, campaign lands on 'payment_received' (admin activates separately)
router.post("/verify-payment", protect, isPromoter, subscriptionController.verifyCampaignPayment);

// 100%-coupon path — mirrors verify-payment's side effects without a real
// Razorpay transaction. Only succeeds if the server itself recomputes the
// final amount as <= 0.
router.post("/activate-free", protect, isPromoter, subscriptionController.activateFreeCampaign);

// Task 4.5 (backend support) — per-project active plans + campaign payment history
router.get("/my-billing", protect, isPromoter, subscriptionController.getMyCampaignBilling);

module.exports = router;
