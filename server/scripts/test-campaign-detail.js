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

// Intentionally-fixed fixture values. Anything the assertions below rely on
// for an exact value lives here — names/titles have no uniqueness
// constraint in the schema (verified against models/User.js, Property.js,
// SubscriptionPlan.js, Requirement.js), so reusing the same fixture across
// runs is safe; only phone numbers and the property slug need to be unique
// per run, and those are generated separately (see runId below).
const TEST_DATA = {
  promoterName: "Test Promoter",
  adminName: "Test Admin",
  planName: "growth-detail-test", // test-namespaced — can never collide with a real plan's name
  planDisplayName: "Growth",
  planPrice: 24999,
  propertyLimit: -1,
  leadsLimit: 50,
  committedMinimum: 50,
  duration: 30,
  projectTitle: "Test Campaign Project",
  locality: "Test Locality",
  city: "Test City",
  deliveredCount: 23, // must equal tier1Count + tier2Count below
  discountTier: 2,
  expectedDiscountLabel: "20% off — 2nd campaign (Tier 2)", // derived from discountTier per campaignController's own ladder
  tier1Count: 18,
  tier2Count: 5,
  batch1: { fileName: "batch1.csv", totalRows: 10, imported: 10, duplicates: 0, failed: 0 },
  batch2: { fileName: "batch2.csv", totalRows: 15, imported: 13, duplicates: 2, failed: 0 },
};

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

  // One run-scoped seed for every dynamically-generated unique value below
  // (user phones, property slug, lead phone numbers), instead of calling
  // Date.now() separately at each call site.
  const runId = Date.now();

  // Declared here (not inside try) so `finally` can see — and clean up —
  // whatever was actually created, even if an earlier step threw.
  let ravi, admin, plan, project, campaign;
  let savedLeads = [];
  let batch1, batch2;
  let createdRole = null; // only set if THIS run created a new Role (fallback branch)

  try {
    const businessType = (await BusinessType.findOne()) || ObjectId();

    const existingRole = await Role.findOne();
    let userRoleId;
    if (existingRole) {
      userRoleId = existingRole._id;
    } else {
      createdRole = await new Role({ role_name: "user" }).save();
      userRoleId = createdRole._id;
    }

    ravi = await new User({
      name: TEST_DATA.promoterName,
      phone: `9${runId}`.slice(0, 10),
      role_id: userRoleId,
    }).save();
    admin = await new User({
      name: TEST_DATA.adminName,
      phone: `8${runId}`.slice(0, 10),
      role_id: userRoleId,
    }).save();

    plan = await new SubscriptionPlan({
      name: TEST_DATA.planName,
      displayName: TEST_DATA.planDisplayName,
      businessType,
      price: TEST_DATA.planPrice,
      propertyLimit: TEST_DATA.propertyLimit,
      leadsLimit: TEST_DATA.leadsLimit,
      committedMinimum: TEST_DATA.committedMinimum,
      duration: TEST_DATA.duration,
    }).save();

    project = await new Property({
      seller: ravi._id,
      basicInfo: { title: TEST_DATA.projectTitle, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
      location: { locality: TEST_DATA.locality, city: TEST_DATA.city },
      slug: `test-detail-${runId}`,
    }).save();

    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    campaign = await new Campaign({
      promoter: ravi._id, project: project._id, plan: plan._id,
      committedMinimum: TEST_DATA.committedMinimum, deliveredCount: TEST_DATA.deliveredCount,
      status: "active", paceStatus: "on_track",
      goLiveAt: new Date(), expiresAt: tenDaysFromNow, activatedBy: admin._id,
      discountTier: TEST_DATA.discountTier,
    }).save();

    // TEST_DATA.tier1Count + TEST_DATA.tier2Count must equal deliveredCount —
    // matches the mockup's split (23 delivered = 18 tier1 + 5 tier2).
    // Phone numbers: a run-unique 6-digit slice of runId + a 3-digit,
    // zero-padded per-lead index — 10 digits total, unique per lead AND per
    // run (the leading digit alone distinguishes tier1 from tier2, so no
    // cross-tier collision either).
    const runSeed = String(runId).slice(-6);
    const leadPhone = (leadingDigit, i) => `${leadingDigit}${runSeed}${String(i).padStart(3, "0")}`;
    const leadCreates = [];
    for (let i = 0; i < TEST_DATA.tier1Count; i++) {
      leadCreates.push(new Requirement({
        fullName: `Tier1 Lead ${i}`, phoneNumber: leadPhone(9, i),
        category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
        campaignId: campaign._id, matchedProject: project._id, tier: "tier1",
      }).save());
    }
    for (let i = 0; i < TEST_DATA.tier2Count; i++) {
      leadCreates.push(new Requirement({
        fullName: `Tier2 Lead ${i}`, phoneNumber: leadPhone(8, i),
        category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
        campaignId: campaign._id, matchedProject: project._id, tier: "tier2",
      }).save());
    }
    savedLeads = await Promise.all(leadCreates);

    batch1 = await new CsvImportBatch({
      campaign: campaign._id, uploadedBy: admin._id, ...TEST_DATA.batch1, status: "completed",
    }).save();
    batch2 = await new CsvImportBatch({
      campaign: campaign._id, uploadedBy: admin._id, ...TEST_DATA.batch2, status: "completed",
    }).save();

    const r = await callController(campaignController.getCampaignDetail, { params: { id: String(campaign._id) } });

    console.log(
      r.status === 200 &&
        r.body.campaign.projectTitle === TEST_DATA.projectTitle &&
        r.body.campaign.planName === TEST_DATA.planDisplayName &&
        r.body.campaign.promoterName === TEST_DATA.promoterName &&
        r.body.campaign.promoterPhone === ravi.phone &&
        r.body.campaign.status === "active"
        ? "PASS: campaign header fields (project/plan/promoter/status) correct"
        : `FAIL: header wrong: ${JSON.stringify(r.body.campaign)}`
    );

    console.log(
      r.body.campaign.deliveredCount === TEST_DATA.deliveredCount &&
        r.body.campaign.committedMinimum === TEST_DATA.committedMinimum &&
        r.body.campaign.daysRemaining >= 9 && r.body.campaign.daysRemaining <= 10
        ? "PASS: delivery numbers + daysRemaining (~10) correct"
        : `FAIL: delivery wrong: ${JSON.stringify(r.body.campaign)}`
    );

    console.log(
      r.body.campaign.tier1Count === TEST_DATA.tier1Count && r.body.campaign.tier2Count === TEST_DATA.tier2Count
        ? `PASS: Tier 1 (${TEST_DATA.tier1Count}) / Tier 2 (${TEST_DATA.tier2Count}) split computed correctly from real Requirement documents`
        : `FAIL: tier split wrong: tier1=${r.body.campaign.tier1Count}, tier2=${r.body.campaign.tier2Count}`
    );

    console.log(
      r.body.campaign.activatedByName === TEST_DATA.adminName
        ? "PASS: activatedBy populated to the admin's name"
        : `FAIL: activatedByName wrong: ${r.body.campaign.activatedByName}`
    );

    console.log(
      r.body.campaign.projectLocation === `${TEST_DATA.locality}, ${TEST_DATA.city}` &&
        r.body.campaign.planPrice === TEST_DATA.planPrice &&
        r.body.campaign.paceStatus === "on_track" &&
        r.body.campaign.discountLabel === TEST_DATA.expectedDiscountLabel
        ? "PASS: Task 3.3 fields (projectLocation/planPrice/paceStatus/discountLabel) present and correct"
        : `FAIL: Task 3.3 fields wrong: ${JSON.stringify({
            projectLocation: r.body.campaign.projectLocation,
            planPrice: r.body.campaign.planPrice,
            paceStatus: r.body.campaign.paceStatus,
            discountLabel: r.body.campaign.discountLabel,
          })}`
    );

    console.log(
      r.body.csvImportBatches.length === 2 &&
        r.body.csvImportBatches[0].batchNumber === 1 &&
        r.body.csvImportBatches[1].batchNumber === 2 &&
        r.body.csvImportBatches[0].imported === TEST_DATA.batch1.imported && r.body.csvImportBatches[0].uploadedByName === TEST_DATA.adminName &&
        r.body.csvImportBatches[1].imported === TEST_DATA.batch2.imported && r.body.csvImportBatches[1].duplicates === TEST_DATA.batch2.duplicates
        ? "PASS: both CSV import batches returned, in order, numbered #1/#2, with correct counts and uploader name"
        : `FAIL: csv batches wrong: ${JSON.stringify(r.body.csvImportBatches)}`
    );

    // Not found
    const rMissing = await callController(campaignController.getCampaignDetail, { params: { id: String(ObjectId()) } });
    console.log(
      rMissing.status === 404
        ? "PASS: a non-existent campaign id returns 404"
        : `FAIL: missing campaign not handled: ${JSON.stringify(rMissing)}`
    );
  } finally {
    // Cleanup — guarded per document so a step that never got created (an
    // earlier throw) doesn't itself throw here, and everything that WAS
    // created is still removed, including the Role fallback document.
    if (savedLeads.length > 0) await Requirement.deleteMany({ _id: { $in: savedLeads.map((l) => l._id) } });
    if (batch1 || batch2) await CsvImportBatch.deleteMany({ _id: { $in: [batch1?._id, batch2?._id].filter(Boolean) } });
    if (campaign) await Campaign.deleteOne({ _id: campaign._id });
    if (project) await Property.deleteOne({ _id: project._id });
    if (plan) await SubscriptionPlan.deleteOne({ _id: plan._id });
    if (ravi || admin) await User.deleteMany({ _id: { $in: [ravi?._id, admin?._id].filter(Boolean) } });
    if (createdRole) await Role.deleteOne({ _id: createdRole._id });
    console.log("\nCleaned up test data.");

    await mongoose.disconnect();
  }
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
