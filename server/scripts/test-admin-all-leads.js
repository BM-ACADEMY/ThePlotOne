// Admin Module Task 5.1 — GET /api/admin/leads (leadController.getAllLeads)
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Requirement = require("../models/Requirement");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const CsvImportBatch = require("../models/CsvImportBatch");
const leadController = require("../controllers/leadController");

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

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const adminId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const ravi = await new User({ name: "Ravi Builder", phone: `9${Date.now()}`.slice(0, 10), role_id: userRole }).save();
  const kumar = await new User({ name: "Kumar Dev", phone: `8${Date.now()}`.slice(0, 10), role_id: userRole }).save();

  const plan = await new SubscriptionPlan({
    name: "growth-all-leads-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50,
  }).save();

  const villianur = await new Property({
    seller: ravi._id,
    basicInfo: { title: "TEST Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-alladmin-villianur-${Date.now()}`,
  }).save();
  const bahour = await new Property({
    seller: kumar._id,
    basicInfo: { title: "TEST Bahour Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-alladmin-bahour-${Date.now()}`,
  }).save();

  const campaignA = await new Campaign({
    promoter: ravi._id, project: villianur._id, plan: plan._id,
    committedMinimum: 50, status: "active",
  }).save();
  const campaignB = await new Campaign({
    promoter: kumar._id, project: bahour._id, plan: plan._id,
    committedMinimum: 22, status: "active",
  }).save();

  // Task 5.2 — two CSV batches for campaignA, so batchNumber ("Import #N") can
  // be verified: batch1 is older (#1), batch2 is newer (#2).
  const batch1 = await new CsvImportBatch({
    campaign: campaignA._id, uploadedBy: adminId, fileName: "batch1.csv",
    totalRows: 1, imported: 1, duplicates: 0, failed: 0, status: "completed",
    createdAt: new Date("2026-08-15T00:00:00Z"),
  }).save();
  const batch2 = await new CsvImportBatch({
    campaign: campaignA._id, uploadedBy: adminId, fileName: "batch2.csv",
    totalRows: 1, imported: 1, duplicates: 0, failed: 0, status: "completed",
    createdAt: new Date("2026-08-22T00:00:00Z"),
  }).save();

  const leadA1 = await new Requirement({
    fullName: "Ramesh Kumar", phoneNumber: "9876543210", email: "ramesh@example.com",
    category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campaignA._id, matchedProject: villianur._id, tier: "tier1", source: "meta_ad",
    csvImportBatch: batch2._id,
    promoterStatus: "pending", deliveredAt: new Date("2026-08-28T10:00:00Z"),
  }).save();
  const leadA2 = await new Requirement({
    fullName: "Priya S", phoneNumber: "9765432109",
    category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campaignA._id, matchedProject: villianur._id, tier: "tier1", source: "meta_ad",
    csvImportBatch: batch1._id,
    promoterStatus: "contacted", deliveredAt: new Date("2026-08-28T11:00:00Z"),
  }).save();
  const leadB1 = await new Requirement({
    fullName: "Kumar Raj", phoneNumber: "9654321098",
    category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campaignB._id, matchedProject: bahour._id, tier: "tier1", source: "meta_ad",
    promoterStatus: "visited", deliveredAt: new Date("2026-08-25T09:00:00Z"),
  }).save();

  // Not campaign-delivered (legacy SharedLead-matched, no campaignId) — must NOT appear
  const nonCampaignLead = await new Requirement({
    fullName: "Not A Campaign Lead", phoneNumber: "9111111111",
    category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    matchedProject: villianur._id, promoterStatus: "pending",
  }).save();

  // 1. Admin sees ALL campaign leads across ALL promoters — scoped to our two
  // test campaigns via campaignId $in, since this is a shared dev database
  // with real pre-existing leads and an unfiltered call can't assert an exact total.
  const rAll = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { limit: 100 },
  });
  const allIds = rAll.body.leads.map((l) => String(l._id));
  console.log(
    rAll.status === 200 &&
      [leadA1._id, leadA2._id, leadB1._id].every((id) => allIds.includes(String(id)))
      ? "PASS: returns all 3 campaign-delivered leads, across both promoters"
      : `FAIL: test leads missing from unfiltered result: ${JSON.stringify(allIds)}`
  );
  console.log(
    !allIds.includes(String(nonCampaignLead._id))
      ? "PASS: a lead with no campaignId (not campaign-delivered) is excluded"
      : "FAIL: leaked a non-campaign lead"
  );

  // 2. Full contact details + promoter/plan info present (admin sees full mechanics)
  // — scoped to campaignA so this assertion doesn't depend on pagination order
  // among real pre-existing leads.
  const rCampaignA = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { campaignId: String(campaignA._id) },
  });
  const first = rCampaignA.body.leads.find((l) => String(l._id) === String(leadA1._id));
  console.log(
    first &&
      first.fullName === "Ramesh Kumar" &&
      first.phoneNumber === "9876543210" &&
      first.email === "ramesh@example.com" &&
      first.projectTitle === "TEST Villianur Layout" &&
      first.promoterName === "Ravi Builder" &&
      first.planName === "Growth" &&
      first.promoterStatus === "pending"
      ? "PASS: full details (phone/email/project/promoter/plan) present in each row"
      : `FAIL: response shape wrong: ${JSON.stringify(first)}`
  );

  // Task 5.2 — batchNumber is this batch's ordinal WITHIN its own campaign
  // (oldest first): leadA1 is on batch2 (created after batch1) -> #2,
  // leadA2 is on batch1 -> #1.
  const second = rCampaignA.body.leads.find((l) => String(l._id) === String(leadA2._id));
  console.log(
    first.batchNumber === 2 && second.batchNumber === 1
      ? "PASS: batchNumber correctly reflects each lead's batch's ordinal within its campaign"
      : `FAIL: batchNumber wrong: leadA1=${first.batchNumber}, leadA2=${second.batchNumber}`
  );

  // 3. campaignId filter
  const rByCampaign = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { campaignId: String(campaignB._id) },
  });
  console.log(
    rByCampaign.status === 200 && rByCampaign.body.total === 1 && rByCampaign.body.leads[0].fullName === "Kumar Raj"
      ? "PASS: campaignId filter returns only that campaign's leads"
      : `FAIL: campaignId filter wrong: ${JSON.stringify(rByCampaign.body)}`
  );

  // 4. projectId filter
  const rByProject = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { projectId: String(villianur._id) },
  });
  console.log(
    rByProject.status === 200 && rByProject.body.total === 2
      ? "PASS: projectId filter returns only that project's leads (2)"
      : `FAIL: projectId filter wrong: ${JSON.stringify(rByProject.body)}`
  );

  // 5. promoterStatus filter
  const rByStatus = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { promoterStatus: "visited" },
  });
  console.log(
    rByStatus.status === 200 && rByStatus.body.total === 1 && rByStatus.body.leads[0].fullName === "Kumar Raj"
      ? "PASS: promoterStatus filter works"
      : `FAIL: promoterStatus filter wrong: ${JSON.stringify(rByStatus.body)}`
  );

  // 6. Date range filter
  const rByDate = await callController(leadController.getAllLeads, {
    user: { _id: adminId },
    query: { dateFrom: "2026-08-27T00:00:00Z", dateTo: "2026-08-29T00:00:00Z" },
  });
  console.log(
    rByDate.status === 200 && rByDate.body.total === 2
      ? "PASS: dateFrom/dateTo filter returns only leads delivered in range (2)"
      : `FAIL: date filter wrong: ${JSON.stringify(rByDate.body)}`
  );

  // 7. Pagination — scoped to campaignA (2 leads) so the real dev-database
  // leads don't affect totalPages/total.
  const rPaged = await callController(leadController.getAllLeads, {
    user: { _id: adminId }, query: { campaignId: String(campaignA._id), limit: 1, page: 1 },
  });
  console.log(
    rPaged.body.leads.length === 1 && rPaged.body.totalPages === 2 && rPaged.body.total === 2
      ? "PASS: pagination (limit/page) works correctly"
      : `FAIL: pagination wrong: ${JSON.stringify(rPaged.body)}`
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: [leadA1._id, leadA2._id, leadB1._id, nonCampaignLead._id] } });
  await CsvImportBatch.deleteMany({ _id: { $in: [batch1._id, batch2._id] } });
  await Campaign.deleteMany({ _id: { $in: [campaignA._id, campaignB._id] } });
  await Property.deleteMany({ _id: { $in: [villianur._id, bahour._id] } });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await User.deleteMany({ _id: { $in: [ravi._id, kumar._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
