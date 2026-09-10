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

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { query = {} }) {
  return new Promise((resolve, reject) => {
    const req = { query };
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

  const businessType = (await BusinessType.findOne()) || (await new BusinessType({ name: "TEST BT" }).save())._id;
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const ravi = await new User({ name: "Ravi Builder", role_id: userRole, phone: `9${Date.now()}`.slice(0, 10) }).save();
  const priya = await new User({ name: "Priya Builders", role_id: userRole, phone: `8${Date.now()}`.slice(0, 10) }).save();

  const growthPlan = await new SubscriptionPlan({
    name: "growth-admincampaigns-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
  }).save();
  const proPlan = await new SubscriptionPlan({
    name: "pro-admincampaigns-test",
    displayName: "Pro",
    businessType,
    price: 39999,
    propertyLimit: -1,
    leadsLimit: 85,
    committedMinimum: 85,
  }).save();

  const villianur = await new Property({
    seller: ravi._id,
    basicInfo: { title: "Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-admincampaigns-villianur-${Date.now()}`,
  }).save();
  const ecr = await new Property({
    seller: priya._id,
    basicInfo: { title: "ECR Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-admincampaigns-ecr-${Date.now()}`,
  }).save();

  const activeCampaign = await new Campaign({
    promoter: ravi._id, project: villianur._id, plan: growthPlan._id,
    committedMinimum: 50, deliveredCount: 23, status: "active",
  }).save();
  const draftCampaign = await new Campaign({
    promoter: priya._id, project: ecr._id, plan: proPlan._id,
    committedMinimum: 85, deliveredCount: 0, status: "draft",
  }).save();

  // 1. No filters — both campaigns returned with correct shape
  const rAll = await callController(campaignController.getAllCampaigns, {});
  const mine = rAll.body.campaigns.filter((c) => [String(activeCampaign._id), String(draftCampaign._id)].includes(String(c._id)));
  console.log(
    rAll.status === 200 && mine.length === 2
      ? "PASS: getAllCampaigns returns both test campaigns"
      : `FAIL: expected 2, got ${mine.length}`
  );

  const activeRow = mine.find((c) => String(c._id) === String(activeCampaign._id));
  console.log(
    activeRow &&
      activeRow.promoterName === "Ravi Builder" &&
      activeRow.projectTitle === "Villianur Layout" &&
      activeRow.planName === "Growth" &&
      activeRow.deliveredCount === 23 &&
      activeRow.committedMinimum === 50 &&
      activeRow.status === "active"
      ? "PASS: row shape matches mockup exactly (promoter/project/plan/leads/status)"
      : `FAIL: row shape wrong: ${JSON.stringify(activeRow)}`
  );

  // 2. Status filter
  const rActive = await callController(campaignController.getAllCampaigns, { query: { status: "active" } });
  const activeOnly = rActive.body.campaigns.filter((c) => [String(activeCampaign._id), String(draftCampaign._id)].includes(String(c._id)));
  console.log(
    activeOnly.length === 1 && activeOnly[0].status === "active"
      ? "PASS: status filter returns only 'active' campaigns"
      : `FAIL: status filter wrong: ${JSON.stringify(activeOnly)}`
  );

  // 3. Promoter filter
  const rPromoter = await callController(campaignController.getAllCampaigns, { query: { promoterId: String(priya._id) } });
  const promoterOnly = rPromoter.body.campaigns.filter((c) => [String(activeCampaign._id), String(draftCampaign._id)].includes(String(c._id)));
  console.log(
    promoterOnly.length === 1 && promoterOnly[0].promoterName === "Priya Builders"
      ? "PASS: promoterId filter returns only that promoter's campaigns"
      : `FAIL: promoter filter wrong: ${JSON.stringify(promoterOnly)}`
  );

  // 4. Plan filter
  const rPlan = await callController(campaignController.getAllCampaigns, { query: { planId: String(proPlan._id) } });
  const planOnly = rPlan.body.campaigns.filter((c) => [String(activeCampaign._id), String(draftCampaign._id)].includes(String(c._id)));
  console.log(
    planOnly.length === 1 && planOnly[0].planName === "Pro"
      ? "PASS: planId filter returns only that plan's campaigns"
      : `FAIL: plan filter wrong: ${JSON.stringify(planOnly)}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: [activeCampaign._id, draftCampaign._id] } });
  await Property.deleteMany({ _id: { $in: [villianur._id, ecr._id] } });
  await SubscriptionPlan.deleteMany({ _id: { $in: [growthPlan._id, proPlan._id] } });
  await User.deleteMany({ _id: { $in: [ravi._id, priya._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
