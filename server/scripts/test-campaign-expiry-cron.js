// Campaign Expiry Check — Module 11 Task 11.2, plus the Subscription-cron
// collision fix. Tests runCampaignExpiryCheck and runLegacySubscriptionExpiryCheck
// directly (the same functions the midnight/30-min crons call), not the cron
// scheduling itself.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const { runCampaignExpiryCheck, runLegacySubscriptionExpiryCheck } = require("../utils/cronJobs");

const ObjectId = () => new mongoose.Types.ObjectId();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

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

  const cleanup = { projects: [], campaigns: [], subs: [], users: [], plans: [] };

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const plan = await new SubscriptionPlan({
    name: "growth-expiry-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50, duration: 30,
  }).save();
  cleanup.plans.push(plan._id);

  const promoter = await new User({
    name: "Expiry Test Promoter", role_id: (await require("../models/Role").findOne())?._id || ObjectId(),
    phone: `9${Date.now()}`.slice(0, 10),
  }).save();
  cleanup.users.push(promoter._id);

  // ===================================================================
  // Scenario 1 — below commitment, expired today -> extend by 7 days
  // ===================================================================
  const projBelow = await makeProject("Expiry Test Below Commitment");
  const oldExpiresAt = daysAgo(1);
  const campBelow = await new Campaign({
    promoter: promoter._id, project: projBelow._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 20, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(31), expiresAt: oldExpiresAt,
  }).save();
  const subBelow = await new Subscription({
    user: promoter._id, plan: plan._id, campaign: campBelow._id, project: projBelow._id,
    startDate: daysAgo(31), endDate: oldExpiresAt, status: "active", paymentStatus: "completed", amountPaid: 24999,
  }).save();
  cleanup.projects.push(projBelow._id); cleanup.campaigns.push(campBelow._id); cleanup.subs.push(subBelow._id);

  // ===================================================================
  // Scenario 2 — commitment met, expired today -> mark expired
  // ===================================================================
  const projMet = await makeProject("Expiry Test Met Commitment");
  const metExpiresAt = daysAgo(1);
  const campMet = await new Campaign({
    promoter: promoter._id, project: projMet._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 55, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(31), expiresAt: metExpiresAt,
  }).save();
  const subMet = await new Subscription({
    user: promoter._id, plan: plan._id, campaign: campMet._id, project: projMet._id,
    startDate: daysAgo(31), endDate: metExpiresAt, status: "active", paymentStatus: "completed", amountPaid: 24999,
  }).save();
  cleanup.projects.push(projMet._id); cleanup.campaigns.push(campMet._id); cleanup.subs.push(subMet._id);

  // ===================================================================
  // Scenario 3 — edge case: zero delivered leads, still extends correctly
  // ===================================================================
  const projZero = await makeProject("Expiry Test Zero Delivered");
  const campZero = await new Campaign({
    promoter: promoter._id, project: projZero._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 0, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(31), expiresAt: daysAgo(1),
  }).save();
  cleanup.projects.push(projZero._id); cleanup.campaigns.push(campZero._id);

  // ===================================================================
  // Scenario 4 — edge case: missing expiresAt (never set) — must be skipped
  // ===================================================================
  const projNoExpiry = await makeProject("Expiry Test No Expiry Date");
  const campNoExpiry = await new Campaign({
    promoter: promoter._id, project: projNoExpiry._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 10, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(31), // expiresAt intentionally omitted
  }).save();
  cleanup.projects.push(projNoExpiry._id); cleanup.campaigns.push(campNoExpiry._id);

  // ===================================================================
  // Scenario 5 — not yet due (expiresAt in the future) — must be untouched
  // ===================================================================
  const projNotDue = await makeProject("Expiry Test Not Due Yet");
  const campNotDue = await new Campaign({
    promoter: promoter._id, project: projNotDue._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 10, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(5), expiresAt: daysFromNow(25),
  }).save();
  cleanup.projects.push(projNotDue._id); cleanup.campaigns.push(campNotDue._id);

  // ===================================================================
  // Run the check
  // ===================================================================
  const results = await runCampaignExpiryCheck();

  const campaignAfter = async (id) => Campaign.findById(id);
  const subAfter = async (id) => Subscription.findById(id);

  // --- Scenario 1: extend ---
  const belowAfter = await campaignAfter(campBelow._id);
  const expectedNewExpiresAt = new Date(oldExpiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  console.log(
    belowAfter.status === "active" &&
      belowAfter.paceStatus === "behind" &&
      Math.abs(belowAfter.expiresAt.getTime() - expectedNewExpiresAt.getTime()) < 1000
      ? "PASS: below-commitment campaign extended by exactly 7 days, paceStatus 'behind', status stays 'active'"
      : `FAIL: below-commitment campaign wrong: ${JSON.stringify(belowAfter)}`
  );

  const subBelowAfter = await subAfter(subBelow._id);
  console.log(
    subBelowAfter.status === "active" &&
      Math.abs(subBelowAfter.endDate.getTime() - expectedNewExpiresAt.getTime()) < 1000
      ? "PASS: linked Subscription.endDate pushed to match the new Campaign.expiresAt, stays 'active' (not expired)"
      : `FAIL: subscription for extended campaign wrong: ${JSON.stringify(subBelowAfter)}`
  );

  // --- Scenario 2: expire ---
  const metAfter = await campaignAfter(campMet._id);
  console.log(
    metAfter.status === "expired"
      ? "PASS: commitment-met campaign marked 'expired'"
      : `FAIL: met-commitment campaign status = ${metAfter.status}`
  );

  const subMetAfter = await subAfter(subMet._id);
  console.log(
    subMetAfter.status === "expired"
      ? "PASS: linked Subscription.status set to 'expired' when campaign completes (Subscription handled appropriately, not left dangling)"
      : `FAIL: subscription for completed campaign status = ${subMetAfter.status}`
  );

  // --- Scenario 3: zero delivered ---
  const zeroAfter = await campaignAfter(campZero._id);
  console.log(
    zeroAfter.status === "active" && zeroAfter.paceStatus === "behind"
      ? "PASS: zero-delivered-leads campaign still extends correctly (0 < committedMinimum)"
      : `FAIL: zero-delivered campaign wrong: ${JSON.stringify(zeroAfter)}`
  );

  // --- Scenario 4: missing expiresAt ---
  const noExpiryAfter = await campaignAfter(campNoExpiry._id);
  console.log(
    noExpiryAfter.status === "active" && noExpiryAfter.paceStatus === "on_track" && !noExpiryAfter.expiresAt
      ? "PASS: a campaign with no expiresAt at all is skipped, untouched"
      : `FAIL: missing-expiresAt campaign wrong: ${JSON.stringify(noExpiryAfter)}`
  );

  // --- Scenario 5: not due yet ---
  const notDueAfter = await campaignAfter(campNotDue._id);
  console.log(
    notDueAfter.status === "active" && notDueAfter.paceStatus === "on_track" &&
      notDueAfter.expiresAt.getTime() === campNotDue.expiresAt.getTime()
      ? "PASS: a campaign not yet due (expiresAt in the future) is untouched"
      : `FAIL: not-due campaign wrong: ${JSON.stringify(notDueAfter)}`
  );

  // --- Promoter notifications ---
  const belowPromoterNotif = await Notification.findOne({
    recipient: promoter._id, type: "campaign_extended", message: { $regex: "extended" },
  });
  console.log(
    belowPromoterNotif && belowPromoterNotif.message === "Your plan has been extended. We will complete your leads."
      ? "PASS: promoter notified with the exact spec'd extend message"
      : "FAIL: promoter extend notification missing/wrong"
  );

  const metPromoterNotif = await Notification.findOne({
    recipient: promoter._id, type: "campaign_completed", message: { $regex: "Expiry Test Met Commitment" },
  });
  console.log(
    metPromoterNotif && metPromoterNotif.message === "Your plan for Expiry Test Met Commitment is complete. Contact admin to renew."
      ? "PASS: promoter notified with the exact spec'd completion message"
      : "FAIL: promoter completion notification missing/wrong"
  );

  // --- Admin notifications ---
  const adminExtendNotif = await Notification.findOne({
    type: "admin_campaign_extended", message: { $regex: "Expiry Test Below Commitment" },
  });
  console.log(
    adminExtendNotif && adminExtendNotif.message === "Expiry Test Below Commitment extended — 20/50 leads"
      ? "PASS: admin notified with project title and correct delivered/committed counts"
      : `FAIL: admin extend notification missing/wrong: ${JSON.stringify(adminExtendNotif)}`
  );

  const adminCompleteNotif = await Notification.findOne({
    type: "admin_campaign_completed", message: { $regex: "Expiry Test Met Commitment" },
  });
  console.log(
    adminCompleteNotif && adminCompleteNotif.message === "Expiry Test Met Commitment campaign completed."
      ? "PASS: admin notified that the campaign has completed"
      : "FAIL: admin completion notification missing/wrong"
  );

  // --- Audit log --- (Module 12 Task 12.1 — CAMPAIGN_EXTENDED/CAMPAIGN_EXPIRED,
  // not a single unified action; see cronJobs.js's own comment for why)
  const auditBelow = await AuditLog.findOne({ action: "CAMPAIGN_EXTENDED", entityId: campBelow._id });
  console.log(
    auditBelow && auditBelow.before.status === "active" && auditBelow.after.paceStatus === "behind" && auditBelow.actorRole === "system"
      ? "PASS: CAMPAIGN_EXTENDED audit entry written for the extended campaign, actorRole 'system'"
      : "FAIL: audit entry for extended campaign missing/wrong"
  );

  const auditMet = await AuditLog.findOne({ action: "CAMPAIGN_EXPIRED", entityId: campMet._id });
  console.log(
    auditMet && auditMet.after.status === "expired"
      ? "PASS: CAMPAIGN_EXPIRED audit entry written for the completed campaign"
      : "FAIL: audit entry for completed campaign missing/wrong"
  );

  // ===================================================================
  // Legacy cron collision fix
  // ===================================================================
  const legacyUser = await new User({
    name: "Legacy Expiry Test Seller", role_id: (await require("../models/Role").findOne())?._id || ObjectId(),
    phone: `8${Date.now()}`.slice(0, 10),
  }).save();
  cleanup.users.push(legacyUser._id);

  // Campaign-linked subscription still expired-and-due (not yet extended by
  // this run — simulates the exact scenario the collision would hit: a
  // campaign Subscription whose endDate has passed)
  const projCollision = await makeProject("Expiry Test Collision Campaign");
  const campCollision = await new Campaign({
    promoter: promoter._id, project: projCollision._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 10, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(31), expiresAt: daysFromNow(6), // already extended by a prior run, still due to expire before the OLD 30-day mark
  }).save();
  const subCollision = await new Subscription({
    user: promoter._id, plan: plan._id, campaign: campCollision._id, project: projCollision._id,
    startDate: daysAgo(31), endDate: daysAgo(1), // deliberately still in the past — this is what the legacy cron would wrongly grab
    status: "active", paymentStatus: "completed", amountPaid: 24999,
  }).save();
  cleanup.projects.push(projCollision._id); cleanup.campaigns.push(campCollision._id); cleanup.subs.push(subCollision._id);

  // Genuine legacy (non-campaign) subscription, also expired
  const subLegacy = await new Subscription({
    user: legacyUser._id, plan: plan._id, // no campaign/project — legacy account-level
    startDate: daysAgo(31), endDate: daysAgo(1), status: "active", paymentStatus: "completed", amountPaid: 24999,
  }).save();
  cleanup.subs.push(subLegacy._id);

  await runLegacySubscriptionExpiryCheck();

  const subCollisionAfter = await subAfter(subCollision._id);
  console.log(
    subCollisionAfter.status === "active"
      ? "PASS: a campaign-linked Subscription with a past endDate is NOT expired by the legacy cron (collision resolved)"
      : `FAIL: campaign-linked subscription was incorrectly expired by the legacy cron: status = ${subCollisionAfter.status}`
  );

  const subLegacyAfter = await subAfter(subLegacy._id);
  console.log(
    subLegacyAfter.status === "expired"
      ? "PASS: a genuine non-campaign (legacy Seller/Agent/Owner) subscription still expires normally, unaffected by the fix"
      : `FAIL: legacy subscription not expired: status = ${subLegacyAfter.status}`
  );

  // ===================================================================
  // Idempotency — re-running must not duplicate processing/notifications
  // ===================================================================
  const promoterNotifCountBefore = await Notification.countDocuments({ recipient: promoter._id });
  const auditCountBefore = await AuditLog.countDocuments({ entityId: { $in: [campBelow._id, campMet._id] } });

  const secondRunResults = await runCampaignExpiryCheck();
  const relevantSecondRun = secondRunResults.filter(
    (r) => [String(campBelow._id), String(campMet._id), String(campZero._id)].includes(String(r.campaignId)),
  );

  console.log(
    relevantSecondRun.length === 0
      ? "PASS: re-running immediately processes none of the already-handled campaigns again (extended ones are no longer due, completed ones are no longer 'active')"
      : `FAIL: re-run reprocessed campaigns: ${JSON.stringify(relevantSecondRun)}`
  );

  const promoterNotifCountAfter = await Notification.countDocuments({ recipient: promoter._id });
  const auditCountAfter = await AuditLog.countDocuments({ entityId: { $in: [campBelow._id, campMet._id] } });
  console.log(
    promoterNotifCountAfter === promoterNotifCountBefore && auditCountAfter === auditCountBefore
      ? "PASS: no duplicate notifications or audit entries were created on the second run"
      : `FAIL: counts changed on re-run — notifications ${promoterNotifCountBefore}->${promoterNotifCountAfter}, audit ${auditCountBefore}->${auditCountAfter}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: cleanup.campaigns } });
  await Subscription.deleteMany({ _id: { $in: cleanup.subs } });
  await Property.deleteMany({ _id: { $in: cleanup.projects } });
  await User.deleteMany({ _id: { $in: cleanup.users } });
  await SubscriptionPlan.deleteMany({ _id: { $in: cleanup.plans } });
  await Notification.deleteMany({ $or: [{ recipient: { $in: cleanup.users } }, { message: { $regex: "Expiry Test" } }] });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: { $in: cleanup.campaigns } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
