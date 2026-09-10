const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const BusinessType = require("../models/BusinessType");
const subscriptionController = require("../controllers/subscriptionController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, body = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, body };
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

  const promoterId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();

  const starterPlan = await new SubscriptionPlan({
    name: "starter-test",
    displayName: "Starter",
    businessType,
    price: 9999,
    propertyLimit: -1,
    leadsLimit: 22,
    committedMinimum: 22,
  }).save();

  const growthPlan = await new SubscriptionPlan({
    name: "growth-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
  }).save();

  // A plan admin hasn't configured yet (committedMinimum unset/0)
  const unconfiguredPlan = await new SubscriptionPlan({
    name: "unconfigured-test",
    displayName: "Unconfigured",
    businessType,
    price: 19999,
    propertyLimit: -1,
    leadsLimit: 30,
  }).save();

  const makeProperty = async (title) =>
    new Property({
      seller: promoterId,
      basicInfo: { title, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
      slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }).save();

  const projectA = await makeProperty("TEST Campaign Order Project A");
  const projectB = await makeProperty("TEST Campaign Order Project B");
  const projectOther = await makeProperty("TEST Someone Elses Project"); // different seller
  await Property.updateOne({ _id: projectOther._id }, { seller: ObjectId() });
  const projectUnconfigured = await makeProperty("TEST Unconfigured Plan Project");

  const createdCampaigns = [];
  const createdSubscriptions = [];

  const order = async (projectId, planId) => {
    const result = await callController(subscriptionController.createCampaignOrder, {
      user: { _id: promoterId },
      body: { projectId: String(projectId), planId: String(planId) },
    });
    if (result.body?.campaignId) createdCampaigns.push(result.body.campaignId);
    if (result.body?.subscriptionId) createdSubscriptions.push(result.body.subscriptionId);
    return result;
  };

  // 1. Happy path — 1st campaign, Growth plan, no discount
  const r1 = await order(projectA._id, growthPlan._id);
  console.log(
    r1.status === 200 && r1.body.success && r1.body.discountTier === 1 &&
      r1.body.discountPercent === 0 && r1.body.finalAmount === 24999
      ? "PASS: 1st campaign — full price, discountTier 1"
      : `FAIL: 1st campaign response wrong: ${JSON.stringify(r1)}`
  );

  const campaignA = await Campaign.findById(r1.body.campaignId);
  console.log(
    campaignA && campaignA.status === "draft" && campaignA.committedMinimum === 50
      ? "PASS: Campaign created with status 'draft' and committedMinimum from plan"
      : "FAIL: Campaign record wrong"
  );
  const subA = await Subscription.findById(r1.body.subscriptionId);
  console.log(
    subA && subA.status === "pending" && String(subA.campaign) === String(campaignA._id) && String(subA.project) === String(projectA._id)
      ? "PASS: Subscription created with status 'pending', linked to campaign + project"
      : "FAIL: Subscription record wrong"
  );

  // 2. Duplicate order for the SAME project should be blocked
  const r2 = await order(projectA._id, growthPlan._id);
  console.log(
    r2.status === 400 && r2.body.success === false
      ? "PASS: duplicate campaign for the same project is blocked"
      : `FAIL: duplicate project order not blocked: ${JSON.stringify(r2)}`
  );

  // 3. 2nd campaign (different project) — 20% discount, Starter blocked
  const r3starter = await order(projectB._id, starterPlan._id);
  console.log(
    r3starter.status === 400 && r3starter.body.reason === "starter_blocked"
      ? "PASS: Starter blocked on 2nd campaign"
      : `FAIL: Starter not blocked on 2nd campaign: ${JSON.stringify(r3starter)}`
  );

  const r3 = await order(projectB._id, growthPlan._id);
  console.log(
    r3.status === 200 && r3.body.discountTier === 2 && r3.body.discountPercent === 20 &&
      r3.body.finalAmount === Math.round(24999 * 0.8)
      ? "PASS: 2nd campaign gets 20% volume discount"
      : `FAIL: 2nd campaign discount wrong: ${JSON.stringify(r3)}`
  );

  // 4. Project belonging to a different seller must be rejected
  const r4 = await order(projectOther._id, growthPlan._id);
  console.log(
    r4.status === 404
      ? "PASS: ownership check rejects a project belonging to another seller"
      : `FAIL: ownership check did not reject: ${JSON.stringify(r4)}`
  );

  // 5. Plan with no committedMinimum configured is rejected
  const r5 = await order(projectUnconfigured._id, unconfiguredPlan._id);
  console.log(
    r5.status === 500 && r5.body.success === false
      ? "PASS: plan missing committedMinimum is rejected with a clear error"
      : `FAIL: unconfigured plan not rejected: ${JSON.stringify(r5)}`
  );

  // 6. Push this promoter to 4 active campaigns, then confirm a 5th is blocked
  const project3 = await makeProperty("TEST Campaign Order Project C");
  const project4 = await makeProperty("TEST Campaign Order Project D");
  const project5 = await makeProperty("TEST Campaign Order Project E");
  await order(project3._id, growthPlan._id); // 3rd
  await order(project4._id, growthPlan._id); // 4th
  const r6 = await order(project5._id, growthPlan._id); // 5th
  console.log(
    r6.status === 403 && r6.body.reason === "enterprise_required"
      ? "PASS: 5th campaign blocked with Enterprise message"
      : `FAIL: 5th campaign not blocked: ${JSON.stringify(r6)}`
  );

  // Cleanup
  await Property.deleteMany({ seller: promoterId });
  await Property.deleteOne({ _id: projectOther._id });
  await Campaign.deleteMany({ _id: { $in: createdCampaigns } });
  await Subscription.deleteMany({ _id: { $in: createdSubscriptions } });
  await SubscriptionPlan.deleteMany({ _id: { $in: [starterPlan._id, growthPlan._id, unconfiguredPlan._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
