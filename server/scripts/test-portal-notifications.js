const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Notification = require("../models/Notification");
const { sendPortalNotification } = require("../utils/notificationService");
const portalNotificationController = require("../controllers/portalNotificationController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, params = {}, query = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, query };
    const res = {
      _status: 200,
      status(code) {
        this._status = code;
        return this;
      },
      json(payload) {
        resolve({ status: this._status, body: payload });
      },
    };
    Promise.resolve(fn(req, res)).catch(reject);
  });
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const promoterId = ObjectId();
  const otherUserId = ObjectId();
  const leadId = ObjectId();
  const projectTitle = "TEST Villianur Layout";

  // 1. sendPortalNotification (exact usage shape from Task 6.1's own example)
  await sendPortalNotification({
    userId: promoterId,
    title: "New Lead Received",
    message: `You have a new lead for ${projectTitle}`,
    type: "new_lead",
    link: "/promoter/my-leads",
    leadId,
  });

  const created = await Notification.findOne({ recipient: promoterId });
  console.log(
    created &&
      created.title === "New Lead Received" &&
      created.message === `You have a new lead for ${projectTitle}` &&
      created.type === "new_lead" &&
      created.link === "/promoter/my-leads" &&
      String(created.relatedId) === String(leadId) &&
      created.relatedModel === "Requirement" &&
      created.isRead === false
      ? "PASS: sendPortalNotification creates a Notification with the exact spec'd shape"
      : `FAIL: notification wrong: ${JSON.stringify(created)}`
  );

  // Noise for another user — must never leak into the promoter's list
  await sendPortalNotification({
    userId: otherUserId,
    title: "Not yours",
    message: "This belongs to someone else",
    type: "new_lead",
  });

  // A second notification, already read, for unread-count testing
  await Notification.create({
    recipient: promoterId,
    title: "Lead Limit Reached",
    message: "Your Growth plan reached its limit",
    type: "lead_limit_reached",
    isRead: true,
  });

  // 2. getMyNotifications — list + unreadCount, scoped to this user only
  const rList = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: promoterId },
  });
  console.log(
    rList.status === 200 &&
      rList.body.success &&
      rList.body.notifications.length === 2 &&
      rList.body.unreadCount === 1
      ? "PASS: getMyNotifications returns only this user's notifications with correct unreadCount"
      : `FAIL: list wrong: ${JSON.stringify(rList.body)}`
  );

  // 3. markNotificationRead — only the owner can mark their own notification read
  const rMarkOther = await callController(portalNotificationController.markNotificationRead, {
    user: { _id: otherUserId },
    params: { id: String(created._id) },
  });
  console.log(
    rMarkOther.status === 404
      ? "PASS: a different user cannot mark someone else's notification as read"
      : `FAIL: ownership not enforced on markNotificationRead: ${JSON.stringify(rMarkOther)}`
  );

  const rMark = await callController(portalNotificationController.markNotificationRead, {
    user: { _id: promoterId },
    params: { id: String(created._id) },
  });
  console.log(
    rMark.status === 200 && rMark.body.notification.isRead === true
      ? "PASS: markNotificationRead marks the caller's own notification read"
      : `FAIL: markNotificationRead wrong: ${JSON.stringify(rMark)}`
  );

  const rListAfterMark = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: promoterId },
  });
  console.log(
    rListAfterMark.body.unreadCount === 0
      ? "PASS: unreadCount drops to 0 after marking the only unread notification read"
      : `FAIL: unreadCount did not update: ${rListAfterMark.body.unreadCount}`
  );

  // 4. markAllNotificationsRead
  await Notification.create({ recipient: promoterId, title: "Another", message: "Another one", type: "new_lead" });
  const rMarkAll = await callController(portalNotificationController.markAllNotificationsRead, {
    user: { _id: promoterId },
  });
  const rListAfterMarkAll = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: promoterId },
  });
  console.log(
    rMarkAll.status === 200 && rListAfterMarkAll.body.unreadCount === 0
      ? "PASS: markAllNotificationsRead clears unreadCount to 0"
      : `FAIL: markAllNotificationsRead did not clear unread count: ${rListAfterMarkAll.body.unreadCount}`
  );

  // Cleanup
  await Notification.deleteMany({ recipient: { $in: [promoterId, otherUserId] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
