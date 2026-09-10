const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const BusinessType = require("../models/BusinessType");
const campaignController = require("../controllers/campaignController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, params = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, params };
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

  const adminId = ObjectId();
  const promoterId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();

  // 90-day (3-month) plan, to prove expiresAt uses the REAL plan.duration, not a hardcoded 30
  const plan = await new SubscriptionPlan({
    name: "growth-activate-test",
    displayName: "Growth",
    businessType,
    price: 59999,
    propertyLimit: -1,
    leadsLimit: 140,
    committedMinimum: 140,
    duration: 90,
  }).save();

  const project = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Activate Campaign Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-activate-${Date.now()}`,
  }).save();

  const campaign = await new Campaign({
    promoter: promoterId,
    project: project._id,
    plan: plan._id,
    committedMinimum: 140,
    status: "payment_received",
  }).save();

  const beforeActivate = Date.now();

  // 1-9. Happy path
  const r = await callController(campaignController.activateCampaign, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
  });

  console.log(
    r.status === 200 && r.body.success && r.body.campaign.status === "active"
      ? "PASS: activateCampaign returns 200 with status 'active'"
      : `FAIL: response wrong: ${JSON.stringify(r.body)}`
  );

  const reloadedCampaign = await Campaign.findById(campaign._id);
  const expectedExpiry = new Date(reloadedCampaign.goLiveAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  console.log(
    reloadedCampaign.status === "active" &&
      reloadedCampaign.goLiveAt.getTime() >= beforeActivate &&
      Math.abs(reloadedCampaign.expiresAt.getTime() - expectedExpiry.getTime()) < 1000 &&
      String(reloadedCampaign.activatedBy) === String(adminId)
      ? "PASS: Campaign.status/goLiveAt/expiresAt(+90d from plan.duration)/activatedBy all set correctly"
      : `FAIL: campaign fields wrong: ${JSON.stringify(reloadedCampaign)}`
  );

  const reloadedProperty = await Property.findById(project._id);
  console.log(
    reloadedProperty.isCampaignActive === true && String(reloadedProperty.activeCampaign) === String(campaign._id)
      ? "PASS: Property.isCampaignActive/activeCampaign set — the real trigger for Task 3.3's getMyListings data"
      : `FAIL: Property fields wrong: ${JSON.stringify(reloadedProperty)}`
  );

  const auditEntry = await AuditLog.findOne({ action: "CAMPAIGN_ACTIVATED", entityId: campaign._id });
  console.log(
    auditEntry &&
      auditEntry.before.status === "payment_received" &&
      auditEntry.after.status === "active" &&
      String(auditEntry.actor) === String(adminId)
      ? "PASS: AuditLog CAMPAIGN_ACTIVATED entry written with correct before/after"
      : "FAIL: AuditLog entry missing or wrong"
  );

  const notification = await Notification.findOne({ recipient: promoterId, type: "campaign_activated" });
  console.log(
    notification &&
      notification.title === "Campaign Activated" &&
      notification.message === "Your plan is active! Leads for TEST Activate Campaign Project will start arriving."
      ? "PASS: promoter portal notification created with the exact spec'd message"
      : `FAIL: notification wrong: ${JSON.stringify(notification)}`
  );

  // Idempotency — activating an already-active campaign must be rejected
  const rReplay = await callController(campaignController.activateCampaign, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
  });
  console.log(
    rReplay.status === 400 && rReplay.body.success === false
      ? "PASS: re-activating an already-active campaign is rejected"
      : `FAIL: idempotency not enforced: ${JSON.stringify(rReplay)}`
  );

  // Draft campaign (never paid) cannot be activated
  const draftCampaign = await new Campaign({
    promoter: promoterId, project: project._id, plan: plan._id, committedMinimum: 140, status: "draft",
  }).save();
  const rDraft = await callController(campaignController.activateCampaign, {
    user: { _id: adminId },
    params: { id: String(draftCampaign._id) },
  });
  console.log(
    rDraft.status === 400
      ? "PASS: a 'draft' (unpaid) campaign is rejected — must be payment_received first"
      : `FAIL: draft campaign was allowed to activate: ${JSON.stringify(rDraft)}`
  );

  // Not found
  const rMissing = await callController(campaignController.activateCampaign, {
    user: { _id: adminId },
    params: { id: String(ObjectId()) },
  });
  console.log(
    rMissing.status === 404
      ? "PASS: activating a non-existent campaign returns 404"
      : `FAIL: missing campaign not handled: ${JSON.stringify(rMissing)}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: [campaign._id, draftCampaign._id] } });
  await Property.deleteOne({ _id: project._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: campaign._id });
  await Notification.deleteMany({ recipient: promoterId });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
