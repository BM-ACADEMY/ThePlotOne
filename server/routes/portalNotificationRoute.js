// Portal (in-app) notification routes — mounted at /api/portal-notifications.
// NOT /api/notifications — that path is already taken by routes/notificationRoute.js
// (push-subscription subscribe/unsubscribe/vapid-key, a different concern).
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const portalNotificationController = require("../controllers/portalNotificationController");

router.get("/", protect, portalNotificationController.getMyNotifications);
router.put("/:id/read", protect, portalNotificationController.markNotificationRead);
router.put("/read-all", protect, portalNotificationController.markAllNotificationsRead);

module.exports = router;
