const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Auth Routes
router.get("/me", protect, userController.getMe);
router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/request-phone-update", protect, userController.requestPhoneUpdate);
router.post("/verify-phone-update", protect, userController.verifyPhoneUpdate);
router.get("/refresh-token", protect, userController.refreshToken);

// Public Routes
router.get("/public-users", userController.getPublicUsers);
router.get("/sellers-by-business-type/:businessTypeId", userController.getSellersByPropertyBusinessType);
router.get("/public-user/:id", userController.getPublicUserById);
router.get("/public-admins", userController.getPublicAdmins);

// User Management Routes (Protected)
router.get("/fetch-all-user", protect, userController.getUsers); // Legacy support
router.get("/get-all-users", protect, userController.getUsers);
router.get("/get-pending-badge-count", protect, userController.getPendingBadgeRequestsCount);
router.get("/fetch-notification-counts", protect, userController.getAdminNotificationCounts);

router.get("/fetch-user-by-id/:id", protect, userController.getUserById); // Legacy support
router.get("/get-user-by-id/:id", protect, userController.getUserById);

router.put(
  "/update-user-by-id/:id",
  protect,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "company_logo", maxCount: 1 },
  ]),
  userController.updateUser,
);
router.put("/upgrade-to-seller", protect, userController.upgradeToSeller);

router.delete("/delete-user-by-id/:id", protect, userController.deleteUser);

// Wishlist Routes
router.post("/add-to-wishlist", protect, userController.addToWishlist);
router.post(
  "/remove-from-wishlist",
  protect,
  userController.removeFromWishlist,
);
router.get("/wishlist", protect, userController.getWishlist);

// Admin Routes
router.post("/create-user-by-admin", protect, userController.createUserByAdmin);
router.put("/bulk-assign-admin", protect, userController.bulkAssignAdmin);

// Verification Request
router.post("/request-badge", protect, userController.requestBadgeVerification);

module.exports = router;
