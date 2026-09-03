const express = require("express");
const router = express.Router();
const {
  createPlan,
  getPlans,
  getAllPlansAdmin,
  updatePlan,
  deletePlan,
  createRequest,
  getSellerRequests,
  getAdminRequests,
  updateRequestStatus,
  deleteRequest,
} = require("../controllers/marketingController");
const { protect, admin } = require("../middleware/authMiddleware");

// Plans
router.get("/plans", getPlans); // Public: active plans for sellers to see
router.get("/plans/admin", protect, admin, getAllPlansAdmin);
router.post("/plans", protect, admin, createPlan);
router.put("/plans/:id", protect, admin, updatePlan);
router.delete("/plans/:id", protect, admin, deletePlan);

// Requests
router.post("/requests", protect, createRequest);
router.get("/requests/seller", protect, getSellerRequests);
router.get("/requests/admin", protect, admin, getAdminRequests);
router.put("/requests/:id", protect, admin, updateRequestStatus);
router.delete("/requests/:id", protect, admin, deleteRequest);

module.exports = router;
