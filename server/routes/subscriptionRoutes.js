const express = require("express");
const router = express.Router();
const { 
  protect: authMiddleware, 
  admin: adminMiddleware, 
  optionalProtect: optionalAuth 
} = require("../middleware/authMiddleware");
const subscriptionPlanController = require("../controllers/subscriptionPlanController");
const subscriptionController = require("../controllers/subscriptionController");

// Public/Seller Routes
router.get("/plans", optionalAuth, subscriptionPlanController.getAllPlans);
router.get("/my-subscription", authMiddleware, subscriptionController.getUserSubscription);
router.post("/create-order", authMiddleware, subscriptionController.createOrder);
router.post("/verify-payment", authMiddleware, subscriptionController.verifyPayment);
router.post("/activate-free-plan", authMiddleware, subscriptionController.activateFreePlan);
router.get("/my-history", authMiddleware, subscriptionController.getMyPaymentHistory);

// Admin Routes
router.get("/admin/plans", authMiddleware, adminMiddleware, subscriptionPlanController.adminGetAllPlans);
router.post("/admin/plans", authMiddleware, adminMiddleware, subscriptionPlanController.savePlan);
router.delete("/admin/plans/:id", authMiddleware, adminMiddleware, subscriptionPlanController.deletePlan);
router.get("/admin/payments", authMiddleware, adminMiddleware, subscriptionController.getPaymentHistory);
router.get("/admin/expiring-soon", authMiddleware, adminMiddleware, subscriptionController.getExpiringSoonSubscriptions);

module.exports = router;
