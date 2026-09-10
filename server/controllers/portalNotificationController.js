const Notification = require("../models/Notification");

// GET /api/portal-notifications — recent notifications + unread count, for the bell icon
//
// 'new_lead' is the only high-volume notification type (one per imported CSV
// row) — a single large import can create dozens of them, which would push
// an older-but-important notification (lead_limit_reached, campaign_activated,
// etc.) outside a plain "N most recent" window. Important types get a
// reserved slot instead of having to out-compete recency for one: fetch them
// first, then fill whatever capacity is left with the next-newest items of
// any type. Total returned still never exceeds `limit`, and when there's no
// flooding (the common case — e.g. Admin's own notification list) this
// produces the exact same result as a plain recent-first query.
exports.getMyNotifications = async (req, res) => {
  try {
    const recipientId = req.user._id;
    const limitNum = (req.query.limit || 20) * 1;

    const [importantNotifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: recipientId, type: { $ne: "new_lead" } })
        .sort({ createdAt: -1 })
        .limit(limitNum),
      Notification.countDocuments({ recipient: recipientId, isRead: false }),
    ]);

    const remainingSlots = Math.max(0, limitNum - importantNotifications.length);
    const fillerNotifications = remainingSlots > 0
      ? await Notification.find({
          recipient: recipientId,
          _id: { $nin: importantNotifications.map((n) => n._id) },
        })
          .sort({ createdAt: -1 })
          .limit(remainingSlots)
      : [];

    const notifications = [...importantNotifications, ...fillerNotifications].sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Get My Notifications Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/portal-notifications/:id/read — mark one as read
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/portal-notifications/read-all — mark all of this user's notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
