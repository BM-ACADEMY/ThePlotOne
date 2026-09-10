const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Notification = require("../models/Notification");
const User = require("../models/User");
const Role = require("../models/Role");
const { notifyPromoterLeadLimitReached } = require("../utils/notificationService");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  // Determine the real admin recipient set the same way the utility does,
  // so the test's expectations match reality regardless of how many admins exist.
  const adminRole = await Role.findOne({ role_name: { $regex: /^admin$/i } });
  const expectedIds = new Set(
    (await User.find({ isSuperAdmin: true }).distinct("_id")).map(String),
  );
  if (adminRole) {
    (await User.find({ role_id: adminRole._id }).distinct("_id")).forEach((id) =>
      expectedIds.add(String(id)),
    );
  }

  const campaignId = ObjectId();
  const uniqueMarker = `TEST-${Date.now()}`;

  await notifyPromoterLeadLimitReached({
    promoter: { name: `Ravi Builder ${uniqueMarker}` },
    project: { title: "Villianur Layout" },
    campaign: { _id: campaignId },
    deliveredCount: 50,
    committedMinimum: 50,
  });

  const created = await Notification.find({
    title: "Promoter Lead Limit Reached",
    message: { $regex: uniqueMarker },
  });

  console.log(
    created.length === expectedIds.size
      ? `PASS: one notification created per admin/super-admin recipient (${expectedIds.size})`
      : `FAIL: expected ${expectedIds.size} notifications, got ${created.length}`
  );

  const recipientIds = new Set(created.map((n) => String(n.recipient)));
  const allExpectedCovered = [...expectedIds].every((id) => recipientIds.has(id));
  console.log(
    allExpectedCovered
      ? "PASS: every resolved admin recipient received their own notification"
      : "FAIL: some admin recipients were missed"
  );

  const first = created[0];
  console.log(
    first &&
      first.message === `Ravi Builder ${uniqueMarker} — Villianur Layout has reached 50/50 leads.` &&
      first.type === "admin_lead_limit" &&
      first.link === `/admin/campaigns/${campaignId}`
      ? "PASS: notification content matches the task's exact template"
      : `FAIL: content wrong: ${JSON.stringify(first)}`
  );

  // Cleanup
  await Notification.deleteMany({ _id: { $in: created.map((n) => n._id) } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
