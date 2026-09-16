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

function callController(fn, { user, params = {}, body = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, body };
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

  const plan = await new SubscriptionPlan({
    name: "growth-pec-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50, duration: 30,
  }).save();

  const makeProject = (title) =>
    new Property({
      seller: promoterId,
      basicInfo: { title, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
      slug: `test-pec-${title.replace(/\s+/g, "-")}-${Date.now()}`,
      isCampaignActive: true,
    }).save();

  // === PAUSE ===
  const projectA = await makeProject("PEC Project A");
  const activeCampaignA = await new Campaign({
    promoter: promoterId, project: projectA._id, plan: plan._id,
    committedMinimum: 50, status: "active",
    goLiveAt: new Date(), expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  }).save();

  const rPause = await callController(campaignController.pauseCampaign, {
    user: { _id: adminId }, params: { id: String(activeCampaignA._id) },
  });
  console.log(
    rPause.status === 200 && rPause.body.campaign.status === "paused"
      ? "PASS: pauseCampaign moves an active campaign to 'paused'"
      : `FAIL: pause wrong: ${JSON.stringify(rPause.body)}`
  );

  const projectAAfterPause = await Property.findById(projectA._id);
  console.log(
    projectAAfterPause.isCampaignActive === true
      ? "PASS: Property.isCampaignActive stays true on pause (promoter still sees the campaign, just paused)"
      : "FAIL: isCampaignActive was incorrectly flipped on pause"
  );

  // Pausing an already-paused campaign must be rejected
  const rPauseAgain = await callController(campaignController.pauseCampaign, {
    user: { _id: adminId }, params: { id: String(activeCampaignA._id) },
  });
  console.log(
    rPauseAgain.status === 400
      ? "PASS: pausing an already-paused campaign is rejected"
      : `FAIL: double-pause not rejected: ${JSON.stringify(rPauseAgain.body)}`
  );

  const pauseAudit = await AuditLog.findOne({ action: "CAMPAIGN_PAUSED", entityId: activeCampaignA._id });
  const pauseNotif = await Notification.findOne({ recipient: promoterId, type: "campaign_paused" });
  console.log(
    pauseAudit && pauseAudit.before.status === "active" && pauseAudit.after.status === "paused"
      ? "PASS: AuditLog CAMPAIGN_PAUSED written with correct before/after"
      : "FAIL: pause audit log missing/wrong"
  );
  console.log(
    pauseNotif && pauseNotif.message.includes("PEC Project A")
      ? "PASS: promoter notified of pause"
      : "FAIL: pause notification missing/wrong"
  );

  // === EXTEND ===
  const projectB = await makeProject("PEC Project B");
  const originalExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const activeCampaignB = await new Campaign({
    promoter: promoterId, project: projectB._id, plan: plan._id,
    committedMinimum: 50, status: "active", goLiveAt: new Date(), expiresAt: originalExpiry,
  }).save();

  const rExtend = await callController(campaignController.extendCampaign, {
    user: { _id: adminId }, params: { id: String(activeCampaignB._id) },
    body: { extraDays: 7, reason: "Promoter requested more time" },
  });
  const expectedExpiry = new Date(originalExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
  console.log(
    rExtend.status === 200 && Math.abs(new Date(rExtend.body.campaign.expiresAt).getTime() - expectedExpiry.getTime()) < 1000
      ? "PASS: extendCampaign adds exactly extraDays to the existing expiresAt"
      : `FAIL: extend wrong: ${JSON.stringify(rExtend.body)}`
  );

  // Invalid extraDays rejected
  const rExtendInvalid = await callController(campaignController.extendCampaign, {
    user: { _id: adminId }, params: { id: String(activeCampaignB._id) }, body: { extraDays: -5 },
  });
  console.log(
    rExtendInvalid.status === 400
      ? "PASS: negative extraDays is rejected"
      : `FAIL: invalid extraDays not rejected: ${JSON.stringify(rExtendInvalid.body)}`
  );

  const extendAudit = await AuditLog.findOne({ action: "CAMPAIGN_EXTENDED", entityId: activeCampaignB._id });
  const extendNotif = await Notification.findOne({ recipient: promoterId, type: "campaign_extended" });
  console.log(
    extendAudit ? "PASS: AuditLog CAMPAIGN_EXTENDED written" : "FAIL: extend audit log missing"
  );
  console.log(
    extendAudit && extendAudit.reason.includes("Promoter requested more time")
      ? "PASS: Task 3.4 optional reason is folded into the audit log reason"
      : `FAIL: reason not recorded: ${extendAudit?.reason}`
  );
  console.log(
    extendNotif && extendNotif.message.includes("7 days")
      ? "PASS: promoter notified of extension with correct day count"
      : "FAIL: extend notification missing/wrong"
  );

  // === COMPLETE ===
  const projectC = await makeProject("PEC Project C");
  const activeCampaignC = await new Campaign({
    promoter: promoterId, project: projectC._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 50, status: "active",
    goLiveAt: new Date(), expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  }).save();

  const rComplete = await callController(campaignController.completeCampaign, {
    user: { _id: adminId }, params: { id: String(activeCampaignC._id) },
  });
  console.log(
    rComplete.status === 200 && rComplete.body.campaign.status === "completed"
      ? "PASS: completeCampaign moves an active campaign to 'completed'"
      : `FAIL: complete wrong: ${JSON.stringify(rComplete.body)}`
  );

  const reloadedCampaignC = await Campaign.findById(activeCampaignC._id);
  console.log(
    reloadedCampaignC.paceStatus === "completed"
      ? "PASS: Campaign.paceStatus also set to 'completed'"
      : `FAIL: paceStatus wrong: ${reloadedCampaignC.paceStatus}`
  );

  const projectCAfterComplete = await Property.findById(projectC._id);
  console.log(
    projectCAfterComplete.isCampaignActive === false
      ? "PASS: Property.isCampaignActive flips to false on complete — project can now start a new campaign"
      : "FAIL: isCampaignActive was not cleared on complete"
  );

  // A draft (never activated) campaign cannot be completed
  const draftCampaign = await new Campaign({
    promoter: promoterId, project: projectC._id, plan: plan._id, committedMinimum: 50, status: "draft",
  }).save();
  const rCompleteDraft = await callController(campaignController.completeCampaign, {
    user: { _id: adminId }, params: { id: String(draftCampaign._id) },
  });
  console.log(
    rCompleteDraft.status === 400
      ? "PASS: a 'draft' campaign cannot be marked complete"
      : `FAIL: draft complete not rejected: ${JSON.stringify(rCompleteDraft.body)}`
  );

  const completeAudit = await AuditLog.findOne({ action: "CAMPAIGN_COMPLETED", entityId: activeCampaignC._id });
  const completeNotif = await Notification.findOne({ recipient: promoterId, type: "campaign_completed", message: { $regex: "PEC Project C" } });
  console.log(
    completeAudit && completeAudit.after.paceStatus === "completed"
      ? "PASS: AuditLog CAMPAIGN_COMPLETED written with paceStatus in after-state"
      : "FAIL: complete audit log missing/wrong"
  );
  console.log(
    completeNotif ? "PASS: promoter notified of completion" : "FAIL: complete notification missing"
  );

  // Cleanup
  const campaignIds = [activeCampaignA._id, activeCampaignB._id, activeCampaignC._id, draftCampaign._id];
  await Campaign.deleteMany({ _id: { $in: campaignIds } });
  await Property.deleteMany({ _id: { $in: [projectA._id, projectB._id, projectC._id] } });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: { $in: campaignIds } });
  await Notification.deleteMany({ recipient: promoterId });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
