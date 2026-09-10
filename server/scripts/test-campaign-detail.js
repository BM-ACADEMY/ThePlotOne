const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Requirement = require("../models/Requirement");
const CsvImportBatch = require("../models/CsvImportBatch");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const campaignController = require("../controllers/campaignController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { params = {} }) {
  return new Promise((resolve, reject) => {
    const req = { params };
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

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const ravi = await new User({ name: "Ravi Builder", phone: `9${Date.now()}`.slice(0, 10), role_id: userRole }).save();
  const admin = await new User({ name: "Admin Arshad", phone: `8${Date.now()}`.slice(0, 10), role_id: userRole }).save();

  const plan = await new SubscriptionPlan({
    name: "growth-detail-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50, duration: 30,
  }).save();

  const project = await new Property({
    seller: ravi._id,
    basicInfo: { title: "Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-detail-${Date.now()}`,
  }).save();

  const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const campaign = await new Campaign({
    promoter: ravi._id, project: project._id, plan: plan._id,
    committedMinimum: 50, deliveredCount: 23, status: "active",
    goLiveAt: new Date(), expiresAt: tenDaysFromNow, activatedBy: admin._id,
  }).save();

  // 18 tier1 + 5 tier2 = 23 delivered, matching the mockup's split
  const leads = [];
  for (let i = 0; i < 18; i++) {
    leads.push(new Requirement({
      fullName: `Tier1 Lead ${i}`, phoneNumber: `900000${1000 + i}`,
      category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
      campaignId: campaign._id, matchedProject: project._id, tier: "tier1",
    }).save());
  }
  for (let i = 0; i < 5; i++) {
    leads.push(new Requirement({
      fullName: `Tier2 Lead ${i}`, phoneNumber: `900001${1000 + i}`,
      category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
      campaignId: campaign._id, matchedProject: project._id, tier: "tier2",
    }).save());
  }
  const savedLeads = await Promise.all(leads);

  const batch1 = await new CsvImportBatch({
    campaign: campaign._id, uploadedBy: admin._id, fileName: "batch1.csv",
    totalRows: 10, imported: 10, duplicates: 0, failed: 0, status: "completed",
  }).save();
  const batch2 = await new CsvImportBatch({
    campaign: campaign._id, uploadedBy: admin._id, fileName: "batch2.csv",
    totalRows: 15, imported: 13, duplicates: 2, failed: 0, status: "completed",
  }).save();

  const r = await callController(campaignController.getCampaignDetail, { params: { id: String(campaign._id) } });

  console.log(
    r.status === 200 &&
      r.body.campaign.projectTitle === "Villianur Layout" &&
      r.body.campaign.planName === "Growth" &&
      r.body.campaign.promoterName === "Ravi Builder" &&
      r.body.campaign.promoterPhone === ravi.phone &&
      r.body.campaign.status === "active"
      ? "PASS: campaign header fields (project/plan/promoter/status) correct"
      : `FAIL: header wrong: ${JSON.stringify(r.body.campaign)}`
  );

  console.log(
    r.body.campaign.deliveredCount === 23 &&
      r.body.campaign.committedMinimum === 50 &&
      r.body.campaign.daysRemaining >= 9 && r.body.campaign.daysRemaining <= 10
      ? "PASS: delivery numbers + daysRemaining (~10) correct"
      : `FAIL: delivery wrong: ${JSON.stringify(r.body.campaign)}`
  );

  console.log(
    r.body.campaign.tier1Count === 18 && r.body.campaign.tier2Count === 5
      ? "PASS: Tier 1 (18) / Tier 2 (5) split computed correctly from real Requirement documents"
      : `FAIL: tier split wrong: tier1=${r.body.campaign.tier1Count}, tier2=${r.body.campaign.tier2Count}`
  );

  console.log(
    r.body.campaign.activatedByName === "Admin Arshad"
      ? "PASS: activatedBy populated to the admin's name"
      : `FAIL: activatedByName wrong: ${r.body.campaign.activatedByName}`
  );

  console.log(
    r.body.csvImportBatches.length === 2 &&
      r.body.csvImportBatches[0].imported === 10 && r.body.csvImportBatches[0].uploadedByName === "Admin Arshad" &&
      r.body.csvImportBatches[1].imported === 13 && r.body.csvImportBatches[1].duplicates === 2
      ? "PASS: both CSV import batches returned, in order, with correct counts and uploader name"
      : `FAIL: csv batches wrong: ${JSON.stringify(r.body.csvImportBatches)}`
  );

  // Not found
  const rMissing = await callController(campaignController.getCampaignDetail, { params: { id: String(ObjectId()) } });
  console.log(
    rMissing.status === 404
      ? "PASS: a non-existent campaign id returns 404"
      : `FAIL: missing campaign not handled: ${JSON.stringify(rMissing)}`
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: savedLeads.map((l) => l._id) } });
  await CsvImportBatch.deleteMany({ _id: { $in: [batch1._id, batch2._id] } });
  await Campaign.deleteOne({ _id: campaign._id });
  await Property.deleteOne({ _id: project._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await User.deleteMany({ _id: { $in: [ravi._id, admin._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
