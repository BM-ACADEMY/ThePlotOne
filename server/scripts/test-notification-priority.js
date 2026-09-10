// Portal notification retrieval — verifies getMyNotifications never buries
// an important notification (anything != 'new_lead') behind a flood of
// 'new_lead' notifications from a large CSV import. Does NOT touch/re-test
// notification creation/trigger logic (sendPortalNotification, csvImportController)
// — only the retrieval query itself.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Notification = require("../models/Notification");
const portalNotificationController = require("../controllers/portalNotificationController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, query = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, query };
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

// Creates a Notification with an explicit createdAt (timestamps:true would
// otherwise always stamp "now") by writing then patching the raw field.
const makeNotification = async ({ recipient, type, title, message, createdAt, isRead = false }) => {
  const doc = await Notification.create({ recipient, type, title, message, isRead });
  await Notification.collection.updateOne({ _id: doc._id }, { $set: { createdAt } });
  return doc;
};

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const allCreatedIds = [];
  const now = Date.now();

  // ===================================================================
  // Scenario 1 — flooded promoter: 1 lead_limit_reached (older) + 1
  // campaign_activated (older) + 30 new_lead (all newer) — simulates a
  // Pro-tier (85) import creating far more new_lead docs than the default
  // limit of 20.
  // ===================================================================
  const floodedPromoter = ObjectId();

  const leadLimitNotif = await makeNotification({
    recipient: floodedPromoter,
    type: "lead_limit_reached",
    title: "Lead Limit Reached",
    message: "Your Growth plan has reached its limit of 50 leads.",
    createdAt: new Date(now - 60000), // 60s before the flood
  });
  allCreatedIds.push(leadLimitNotif._id);

  const campaignActivatedNotif = await makeNotification({
    recipient: floodedPromoter,
    type: "campaign_activated",
    title: "Campaign Activated",
    message: "Your plan is active!",
    createdAt: new Date(now - 61000), // even older
  });
  allCreatedIds.push(campaignActivatedNotif._id);

  for (let i = 0; i < 30; i++) {
    const n = await makeNotification({
      recipient: floodedPromoter,
      type: "new_lead",
      title: "New Lead Received",
      message: `You have a new lead #${i}`,
      createdAt: new Date(now - 1000 + i), // all newer than both important ones
      isRead: i < 20, // mix of read/unread, matching a real flood
    });
    allCreatedIds.push(n._id);
  }

  const r1 = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: floodedPromoter },
  });
  const r1Ids = r1.body.notifications.map((n) => String(n._id));
  console.log(
    r1.status === 200 && r1Ids.includes(String(leadLimitNotif._id)) && r1Ids.includes(String(campaignActivatedNotif._id))
      ? "PASS: both important notifications (lead_limit_reached, campaign_activated) survive a 30-item new_lead flood at default limit"
      : `FAIL: important notifications missing from response: ${JSON.stringify(r1Ids)}`
  );
  console.log(
    r1.body.notifications.length <= 20
      ? "PASS: total returned still capped at the requested limit (<=20), not an unbounded list"
      : `FAIL: returned ${r1.body.notifications.length} notifications, exceeds limit`
  );
  console.log(
    r1.body.unreadCount === 30 - 20 + 2 // 10 unread new_lead + 2 unread important
      ? "PASS: unreadCount still counts ALL unread notifications, not just the returned page"
      : `FAIL: unreadCount = ${r1.body.unreadCount}`
  );
  const createdAtsDesc = r1.body.notifications.every(
    (n, i, arr) => i === 0 || new Date(arr[i - 1].createdAt) >= new Date(n.createdAt),
  );
  console.log(
    createdAtsDesc
      ? "PASS: returned list is still sorted newest-first"
      : "FAIL: returned list is not sorted newest-first"
  );

  // ===================================================================
  // Scenario 2 — small limit still guarantees important items a reserved
  // seat, even though 30 new_lead items are individually more recent.
  // ===================================================================
  const r2 = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: floodedPromoter },
    query: { limit: 5 },
  });
  const r2Ids = r2.body.notifications.map((n) => String(n._id));
  console.log(
    r2.status === 200 &&
      r2.body.notifications.length === 5 &&
      r2Ids.includes(String(leadLimitNotif._id)) &&
      r2Ids.includes(String(campaignActivatedNotif._id))
      ? "PASS: with a small limit (5), both important notifications still get a reserved seat (not out-competed by newer new_lead items)"
      : `FAIL: small-limit case wrong: ${JSON.stringify(r2Ids)}`
  );

  // ===================================================================
  // Scenario 3 — no flooding at all (mirrors Admin's typical case): result
  // must be identical to a plain "N most recent" query — no behavior change.
  // ===================================================================
  const quietRecipient = ObjectId();
  const quietNotifs = [];
  for (let i = 0; i < 3; i++) {
    const n = await makeNotification({
      recipient: quietRecipient,
      type: i === 0 ? "admin_lead_limit" : "campaign_activation_required",
      title: `Quiet ${i}`,
      message: `Quiet notification ${i}`,
      createdAt: new Date(now - i * 1000),
    });
    quietNotifs.push(n);
    allCreatedIds.push(n._id);
  }

  const r3 = await callController(portalNotificationController.getMyNotifications, {
    user: { _id: quietRecipient },
  });
  const r3Ids = r3.body.notifications.map((n) => String(n._id));
  const expectedOrder = quietNotifs.map((n) => String(n._id)); // already newest-first by construction
  console.log(
    r3.status === 200 && JSON.stringify(r3Ids) === JSON.stringify(expectedOrder)
      ? "PASS: no-flood case (e.g. Admin's own list) returns the exact same newest-first result as before — no behavior change"
      : `FAIL: no-flood case changed: ${JSON.stringify(r3Ids)} vs expected ${JSON.stringify(expectedOrder)}`
  );

  // Cleanup
  await Notification.deleteMany({ _id: { $in: allCreatedIds } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
