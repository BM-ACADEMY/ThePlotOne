// Admin Module Task 7.1 — committedMinimum (pre-existing) + the two new
// fields (tier2Minimum, planCategory) round-trip through savePlan on both
// create and update.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const SubscriptionPlan = require("../models/SubscriptionPlan");
const BusinessType = require("../models/BusinessType");
const subscriptionPlanController = require("../controllers/subscriptionPlanController");

function callController(fn, { body = {}, params = {} }) {
  return new Promise((resolve, reject) => {
    const req = { body, params };
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

  // Create — a campaign plan with both new fields set
  const rCreate = await callController(subscriptionPlanController.savePlan, {
    body: {
      name: `growth-task71-test-${Date.now()}`,
      displayName: "Growth",
      businessType: String(businessType._id),
      price: 24999,
      propertyLimit: -1,
      leadsLimit: 50,
      committedMinimum: 50,
      tier2Minimum: 4,
      planCategory: "promoter",
      duration: 30,
    },
  });

  console.log(
    rCreate.status === 201 &&
      rCreate.body.plan.committedMinimum === 50 &&
      rCreate.body.plan.tier2Minimum === 4 &&
      rCreate.body.plan.planCategory === "promoter"
      ? "PASS: savePlan (create) persists committedMinimum/tier2Minimum/planCategory"
      : `FAIL: create response wrong: ${JSON.stringify(rCreate.body)}`
  );

  const planId = rCreate.body.plan._id;
  const reloaded = await SubscriptionPlan.findById(planId);
  console.log(
    reloaded.committedMinimum === 50 && reloaded.tier2Minimum === 4 && reloaded.planCategory === "promoter"
      ? "PASS: fields actually persisted in MongoDB, not just echoed in the response"
      : `FAIL: DB doc wrong: committedMinimum=${reloaded.committedMinimum}, tier2Minimum=${reloaded.tier2Minimum}, planCategory=${reloaded.planCategory}`
  );

  // A plan created WITHOUT these fields must default sensibly (0/0/'agent'),
  // not error — matches the model's own defaults.
  const rCreateDefaults = await callController(subscriptionPlanController.savePlan, {
    body: {
      name: `agent-task71-defaults-test-${Date.now()}`,
      businessType: String(businessType._id),
      price: 999,
      propertyLimit: 3,
      leadsLimit: 2,
      duration: 30,
    },
  });
  console.log(
    rCreateDefaults.status === 201 &&
      rCreateDefaults.body.plan.committedMinimum === 0 &&
      rCreateDefaults.body.plan.tier2Minimum === 0 &&
      rCreateDefaults.body.plan.planCategory === "agent"
      ? "PASS: a plan saved without campaign fields defaults to committedMinimum=0/tier2Minimum=0/planCategory='agent'"
      : `FAIL: defaults wrong: ${JSON.stringify(rCreateDefaults.body.plan)}`
  );

  // Update — change tier2Minimum and planCategory on the existing plan
  const rUpdate = await callController(subscriptionPlanController.savePlan, {
    body: {
      id: planId,
      name: reloaded.name,
      displayName: reloaded.displayName,
      businessType: String(businessType._id),
      price: reloaded.price,
      propertyLimit: reloaded.propertyLimit,
      leadsLimit: reloaded.leadsLimit,
      committedMinimum: 50,
      tier2Minimum: 8,
      planCategory: "agent",
      duration: reloaded.duration,
    },
  });
  console.log(
    rUpdate.status === 200 && rUpdate.body.plan.tier2Minimum === 8 && rUpdate.body.plan.planCategory === "agent"
      ? "PASS: savePlan (update) correctly changes tier2Minimum/planCategory on an existing plan"
      : `FAIL: update response wrong: ${JSON.stringify(rUpdate.body)}`
  );

  // Invalid planCategory must be rejected by the schema enum, not silently accepted
  const rInvalid = await callController(subscriptionPlanController.savePlan, {
    body: {
      name: `invalid-category-test-${Date.now()}`,
      businessType: String(businessType._id),
      price: 999,
      propertyLimit: 3,
      leadsLimit: 2,
      planCategory: "not-a-real-category",
    },
  });
  console.log(
    rInvalid.status === 500
      ? "PASS: an invalid planCategory value is rejected by the schema enum"
      : `FAIL: invalid planCategory was not rejected: ${JSON.stringify(rInvalid.body)}`
  );

  // Cleanup
  await SubscriptionPlan.deleteMany({
    _id: { $in: [planId, rCreateDefaults.body.plan._id].filter(Boolean) },
  });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
