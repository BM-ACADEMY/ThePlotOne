// 7AM Self-Audit Job — Module 11 Task 11.3. Delta-based assertions (this DB
// has pre-existing real campaigns/leads from earlier manual testing), same
// approach as test-admin-promoter-management.js's getCampaignStats tests.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Requirement = require("../models/Requirement");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Notification = require("../models/Notification");
const BusinessType = require("../models/BusinessType");
const { runDailySelfAudit } = require("../utils/cronJobs");
const { getAdminRecipientIds } = require("../utils/notificationService");

const ObjectId = () => new mongoose.Types.ObjectId();

const makeProject = async (title) =>
  new Property({
    seller: ObjectId(),
    basicInfo: { title, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }).save();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const scriptStart = new Date();
  const cleanup = { projects: [], campaigns: [], requirements: [], plans: [] };

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const plan = await new SubscriptionPlan({
    name: "growth-audit-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50, duration: 30,
  }).save();
  cleanup.plans.push(plan._id);

  const before = await runDailySelfAudit();

  // Active campaign (counts toward activeCampaigns)
  const proj1 = await makeProject("Audit Test Active");
  const camp1 = await new Campaign({
    promoter: ObjectId(), project: proj1._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 10, status: "active", paceStatus: "on_track",
  }).save();
  cleanup.projects.push(proj1._id); cleanup.campaigns.push(camp1._id);

  // Pending-activation campaign
  const proj2 = await makeProject("Audit Test Pending");
  const camp2 = await new Campaign({
    promoter: ObjectId(), project: proj2._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 0, status: "payment_received", paceStatus: "on_track",
  }).save();
  cleanup.projects.push(proj2._id); cleanup.campaigns.push(camp2._id);

  // Behind-pace active campaign
  const proj3 = await makeProject("Audit Test Behind");
  const camp3 = await new Campaign({
    promoter: ObjectId(), project: proj3._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 5, status: "active", paceStatus: "behind",
  }).save();
  cleanup.projects.push(proj3._id); cleanup.campaigns.push(camp3._id);

  // Over-delivered active campaign (delivered > committed)
  const proj4 = await makeProject("Audit Test OverDelivered");
  const camp4 = await new Campaign({
    promoter: ObjectId(), project: proj4._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 60, status: "active", paceStatus: "on_track",
  }).save();
  cleanup.projects.push(proj4._id); cleanup.campaigns.push(camp4._id);

  // Two leads imported "today" for camp1 (campaign-linked, properly delivered)
  const leadToday1 = await new Requirement({
    fullName: "Audit Lead 1", phoneNumber: "9100000301", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: camp1._id, matchedProject: proj1._id, deliveredAt: new Date(),
  }).save();
  const leadToday2 = await new Requirement({
    fullName: "Audit Lead 2", phoneNumber: "9100000302", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: camp1._id, matchedProject: proj1._id, deliveredAt: new Date(),
  }).save();
  cleanup.requirements.push(leadToday1._id, leadToday2._id);

  // An orphaned lead: campaignId set, but never actually delivered
  const orphanLead = await new Requirement({
    fullName: "Audit Orphan Lead", phoneNumber: "9100000303", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: camp1._id, matchedProject: proj1._id, // deliveredAt intentionally omitted
  }).save();
  cleanup.requirements.push(orphanLead._id);

  // The "before" call above already sent one round of admin notifications —
  // mark a precise cutoff so only THIS call's notifications are counted below
  // (not the before-call's, which would double the count).
  const cutoff = new Date();
  const after = await runDailySelfAudit();

  console.log(
    after.activeCampaigns - before.activeCampaigns === 3 // camp1, camp3, camp4
      ? "PASS: activeCampaigns increases by exactly 3 (camp1, camp3, camp4 — camp2 is pending, not active)"
      : `FAIL: activeCampaigns delta = ${after.activeCampaigns - before.activeCampaigns}`
  );
  console.log(
    after.pendingActivation - before.pendingActivation === 1
      ? "PASS: pendingActivation increases by exactly 1 (camp2)"
      : `FAIL: pendingActivation delta = ${after.pendingActivation - before.pendingActivation}`
  );
  console.log(
    after.leadsImportedToday - before.leadsImportedToday === 2
      ? "PASS: leadsImportedToday counts only the 2 properly-delivered campaign leads (not the orphaned one, which has no deliveredAt)"
      : `FAIL: leadsImportedToday delta = ${after.leadsImportedToday - before.leadsImportedToday}`
  );
  console.log(
    after.behindPace - before.behindPace === 1
      ? "PASS: behindPace increases by exactly 1 (camp3)"
      : `FAIL: behindPace delta = ${after.behindPace - before.behindPace}`
  );
  console.log(
    after.orphanedLeads - before.orphanedLeads === 1
      ? "PASS: orphanedLeads increases by exactly 1 (campaignId set, deliveredAt missing)"
      : `FAIL: orphanedLeads delta = ${after.orphanedLeads - before.orphanedLeads}`
  );
  console.log(
    after.overDelivered - before.overDelivered === 1
      ? "PASS: overDelivered increases by exactly 1 (camp4: 60 delivered > 50 committed)"
      : `FAIL: overDelivered delta = ${after.overDelivered - before.overDelivered}`
  );

  const adminIds = await getAdminRecipientIds();
  const latestBatch = await Notification.find({
    type: "daily_self_audit",
    title: "Daily Audit",
    createdAt: { $gte: cutoff },
  });

  console.log(
    latestBatch.length === adminIds.length
      ? `PASS: one 'daily_self_audit' notification created per admin (${adminIds.length})`
      : `FAIL: expected ${adminIds.length} admin notifications, got ${latestBatch.length}`
  );

  console.log(
    latestBatch.every((n) => n.link === "/admin/dashboard") &&
      latestBatch.every((n) => n.message.includes("Active Campaigns") && n.message.includes("Orphaned leads"))
      ? "PASS: notification links to /admin/dashboard and its message includes the full summary"
      : "FAIL: notification link/message content wrong"
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: cleanup.requirements } });
  await Campaign.deleteMany({ _id: { $in: cleanup.campaigns } });
  await Property.deleteMany({ _id: { $in: cleanup.projects } });
  await SubscriptionPlan.deleteMany({ _id: { $in: cleanup.plans } });
  // Cleans up notifications from BOTH the "before" and "after" runDailySelfAudit
  // calls in this script (bounded by scriptStart, so any real/pre-existing
  // daily_self_audit notifications from outside this test run are untouched).
  await Notification.deleteMany({
    type: "daily_self_audit",
    title: "Daily Audit",
    recipient: { $in: adminIds },
    createdAt: { $gte: scriptStart },
  });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
