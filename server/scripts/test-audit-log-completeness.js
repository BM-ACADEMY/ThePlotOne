// Module 12 Task 12.1 — Audit Log Writer Utility. Confirms the two events
// that were missing entirely (CAMPAIGN_CREATED, LEAD_LIMIT_REACHED) before
// this task, found by cross-checking every writeAudit(...) call site in the
// codebase against the task's own canonical event list. The other 8 events
// were already covered by existing test scripts (test-activate-campaign.js,
// test-pause-extend-complete-campaign.js, test-verify-campaign-payment.js,
// test-campaign-coupon-flow.js, test-import-leads.js, test-update-lead-status.js,
// test-campaign-expiry-cron.js) — not re-tested here to avoid duplicating them.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const AuditLog = require("../models/AuditLog");
const BusinessType = require("../models/BusinessType");
const User = require("../models/User");
const Role = require("../models/Role");
const csvImportController = require("../controllers/csvImportController");
const subscriptionController = require("../controllers/subscriptionController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, params = {}, body = {}, file }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, body, file };
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

const csvBuffer = (text) => ({ originalname: "leads.csv", buffer: Buffer.from(text, "utf8") });

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const cleanup = { projects: [], campaigns: [], plans: [], requirementPhones: [] };

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const plan = await new SubscriptionPlan({
    name: "growth-audit-completeness-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 5, committedMinimum: 5, duration: 30,
  }).save();
  cleanup.plans.push(plan._id);

  // ===================================================================
  // CAMPAIGN_CREATED — createCampaignOrder
  // ===================================================================
  // A real User (not a fabricated ObjectId) — importLeads populates
  // Campaign.promoter and dereferences campaign.promoter._id/name directly,
  // which would throw on a dangling ref.
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;
  const promoter = await new User({
    name: "Audit Completeness Promoter", role_id: userRole, phone: `9${Date.now()}`.slice(0, 10),
  }).save();
  const promoterId = promoter._id;
  const project = await new Property({
    seller: promoterId,
    basicInfo: { title: "Audit Completeness Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `audit-completeness-${Date.now()}`,
  }).save();
  cleanup.projects.push(project._id);

  const orderRes = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoterId },
    body: { projectId: String(project._id), planId: String(plan._id) },
  });
  console.log(
    orderRes.status === 200 && orderRes.body.success
      ? "PASS: createCampaignOrder succeeded (real Razorpay order, harmless — creates no charge)"
      : `FAIL: createCampaignOrder failed: ${JSON.stringify(orderRes.body)}`
  );
  const campaignId = orderRes.body.campaignId;
  cleanup.campaigns.push(campaignId);

  const createdAudit = await AuditLog.findOne({ action: "CAMPAIGN_CREATED", entityId: campaignId });
  console.log(
    createdAudit && createdAudit.entity === "Campaign" && createdAudit.actorRole === "promoter" && String(createdAudit.actor) === String(promoterId)
      ? "PASS: CAMPAIGN_CREATED audit entry written at order-creation time, actorRole 'promoter' (accurately reflects who actually triggers it)"
      : `FAIL: CAMPAIGN_CREATED audit entry missing/wrong: ${JSON.stringify(createdAudit)}`
  );

  // ===================================================================
  // LEAD_LIMIT_REACHED — importLeads, at the moment deliveredCount first
  // hits committedMinimum (5, set on the plan above)
  // ===================================================================
  const adminId = ObjectId();
  await Campaign.findByIdAndUpdate(campaignId, { status: "active" }); // skip payment/activation for this focused test
  await Subscription.deleteMany({ campaign: campaignId }); // not needed for this test, avoid orphaned fixture noise

  const csv = [
    "full_name,phone_number",
    "Audit Lead 1,9100000401",
    "Audit Lead 2,9100000402",
    "Audit Lead 3,9100000403",
    "Audit Lead 4,9100000404",
    "Audit Lead 5,9100000405",
  ].join("\n");
  cleanup.requirementPhones = ["9100000401", "9100000402", "9100000403", "9100000404", "9100000405"];

  const importRes = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaignId) },
    file: csvBuffer(csv),
  });
  console.log(
    importRes.status === 200 && importRes.body.imported === 5
      ? "PASS: 5-lead import succeeds, exactly reaching committedMinimum (5)"
      : `FAIL: import wrong: ${JSON.stringify(importRes.body)}`
  );

  const limitAudit = await AuditLog.findOne({ action: "LEAD_LIMIT_REACHED", entityId: campaignId });
  console.log(
    limitAudit && limitAudit.entity === "Campaign" && limitAudit.after.deliveredCount === 5 && limitAudit.after.committedMinimum === 5
      ? "PASS: LEAD_LIMIT_REACHED audit entry written, distinct from LEADS_IMPORTED, with correct delivered/committed counts"
      : `FAIL: LEAD_LIMIT_REACHED audit entry missing/wrong: ${JSON.stringify(limitAudit)}`
  );

  const importedAudit = await AuditLog.findOne({ action: "LEADS_IMPORTED", entityId: importRes.body.batchId });
  console.log(
    importedAudit
      ? "PASS: the batch's own LEADS_IMPORTED entry still exists alongside LEAD_LIMIT_REACHED (two distinct events, not one replacing the other)"
      : "FAIL: LEADS_IMPORTED entry missing"
  );

  // Cleanup
  const Requirement = require("../models/Requirement");
  await Requirement.deleteMany({ phoneNumber: { $in: cleanup.requirementPhones } });
  await Campaign.deleteMany({ _id: { $in: cleanup.campaigns } });
  await Subscription.deleteMany({ campaign: { $in: cleanup.campaigns } });
  await Property.deleteMany({ _id: { $in: cleanup.projects } });
  await SubscriptionPlan.deleteMany({ _id: { $in: cleanup.plans } });
  await User.deleteOne({ _id: promoterId });
  const CsvImportBatch = require("../models/CsvImportBatch");
  await CsvImportBatch.deleteMany({ campaign: { $in: cleanup.campaigns } });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: { $in: [...cleanup.campaigns, importRes.body.batchId].filter(Boolean) } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
