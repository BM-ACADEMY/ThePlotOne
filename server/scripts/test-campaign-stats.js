// Admin Module Task 1.1 — GET /api/admin/campaigns/stats
// Verifies campaignsBehindPace (the field the spec listed but the original
// implementation of getCampaignStats was missing) alongside the four fields
// that already existed.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const campaignController = require("../controllers/campaignController");

function callController(fn) {
  return new Promise((resolve, reject) => {
    const req = {};
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

  const businessType = (await BusinessType.findOne()) || (await new BusinessType({ name: "Builder/Promoter" }).save());
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const promoter = await new User({
    name: "Pace Test Promoter",
    role_id: userRole,
    phone: `7${Date.now()}`.slice(0, 10),
  }).save();

  const plan = await new SubscriptionPlan({
    name: "pace-stats-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
  }).save();

  const project = await new Property({
    seller: promoter._id,
    basicInfo: { title: "Pace Stats Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-pace-stats-${Date.now()}`,
  }).save();

  const behindCampaign = await new Campaign({
    promoter: promoter._id,
    project: project._id,
    plan: plan._id,
    committedMinimum: 50,
    status: "active",
    paceStatus: "behind",
  }).save();

  const onTrackCampaign = await new Campaign({
    promoter: promoter._id,
    project: project._id,
    plan: plan._id,
    committedMinimum: 50,
    status: "active",
    paceStatus: "on_track",
  }).save();

  const r = await callController(campaignController.getCampaignStats);

  console.log(
    r.status === 200 && typeof r.body.campaignsBehindPace === "number"
      ? "PASS: getCampaignStats response includes a numeric campaignsBehindPace field"
      : `FAIL: campaignsBehindPace missing or wrong type: ${JSON.stringify(r.body)}`
  );

  console.log(
    r.body.campaignsBehindPace >= 1
      ? "PASS: the seeded paceStatus:'behind' campaign is counted"
      : `FAIL: expected at least 1, got ${r.body.campaignsBehindPace}`
  );

  const otherFieldsPresent =
    typeof r.body.activeCampaigns === "number" &&
    typeof r.body.pendingActivation === "number" &&
    typeof r.body.leadsUploadedToday === "number" &&
    typeof r.body.campaignsAtLimit === "number";
  console.log(
    otherFieldsPresent
      ? "PASS: the pre-existing fields (activeCampaigns/pendingActivation/leadsUploadedToday/campaignsAtLimit) are unaffected"
      : `FAIL: an existing field regressed: ${JSON.stringify(r.body)}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: [behindCampaign._id, onTrackCampaign._id] } });
  await Property.deleteOne({ _id: project._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await User.deleteOne({ _id: promoter._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
