// Manual QA helper for Modules 6/7/8 — NOT a test script (no assertions, no
// cleanup). Drives a REAL project through Task 4.2/4.3's real controllers
// (createCampaignOrder, verifyCampaignPayment) so the resulting campaign is
// indistinguishable from one paid through a real Razorpay checkout — it just
// skips the browser checkout step, which SelectPlan.jsx doesn't call yet.
//
// createCampaignOrder DOES call the real Razorpay Orders API (harmless —
// creating an order never charges anything by itself). verifyCampaignPayment
// is then satisfied by computing a signature with your own
// RAZORPAY_KEY_SECRET, exactly like a real successful checkout would send.
//
// Usage:
//   node server/scripts/bootstrap-active-campaign-payment.js               (lists projects/plans, does nothing)
//   node server/scripts/bootstrap-active-campaign-payment.js <projectSlug> <planId>
//
// Plan is looked up by _id, not name/displayName — SubscriptionPlan.name is
// reused across unrelated businessTypes (e.g. multiple docs named "Standard"),
// so a name-based lookup can silently grab the wrong plan.
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Campaign = require("../models/Campaign");
const subscriptionController = require("../controllers/subscriptionController");

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
  const [, , projectSlug, planId] = process.argv;

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  if (!projectSlug || !planId) {
    console.log("Usage: node bootstrap-active-campaign-payment.js <projectSlug> <planId>\n");
    console.log("Your projects (that don't already have a non-terminal campaign):");
    const projects = await Property.find({}).select("slug basicInfo.title seller").lean();
    for (const p of projects) {
      const existing = await Campaign.findOne({ project: p._id, status: { $nin: ["completed", "expired"] } });
      if (!existing) console.log(`  - slug="${p.slug}"  title="${p.basicInfo?.title}"`);
    }
    console.log("\nAvailable plans (use _id — name/displayName are not unique across businessTypes):");
    const plans = await SubscriptionPlan.find({}).select("name displayName committedMinimum price businessType").lean();
    plans.forEach((pl) =>
      console.log(
        `  - _id="${pl._id}"  displayName="${pl.displayName}"  price=${pl.price}  committedMinimum=${pl.committedMinimum}  businessType=${pl.businessType}`,
      ),
    );
    await mongoose.disconnect();
    return;
  }

  const project = await Property.findOne({ slug: projectSlug });
  if (!project) throw new Error(`No project with slug "${projectSlug}"`);

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error(`No plan with _id "${planId}"`);

  const promoterId = project.seller;

  console.log(`Creating campaign order: project="${project.basicInfo?.title}" plan="${plan.displayName}"...`);
  const orderRes = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoterId },
    body: { projectId: String(project._id), planId: String(plan._id) },
  });
  if (orderRes.status !== 200 || !orderRes.body.success) {
    throw new Error(`createCampaignOrder failed: ${JSON.stringify(orderRes.body)}`);
  }
  const { campaignId, orderId } = orderRes.body;
  console.log(`Order created. campaignId=${campaignId}, razorpayOrderId=${orderId}`);

  // Simulate a successful checkout callback with a matching HMAC signature —
  // the same check verifyCampaignPayment applies to a real Razorpay response.
  const fakePaymentId = `pay_bootstrap_${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${fakePaymentId}`)
    .digest("hex");

  const verifyRes = await callController(subscriptionController.verifyCampaignPayment, {
    user: { _id: promoterId },
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: signature,
      campaignId,
    },
  });
  if (verifyRes.status !== 200 || !verifyRes.body.success) {
    throw new Error(`verifyCampaignPayment failed: ${JSON.stringify(verifyRes.body)}`);
  }

  const campaign = await Campaign.findById(campaignId);
  console.log(`\nDone. Campaign ${campaign._id} is now status='${campaign.status}'.`);
  console.log("Go to /admin/campaigns/pending as an admin to activate it (Task 7.2) and continue the walkthrough.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
