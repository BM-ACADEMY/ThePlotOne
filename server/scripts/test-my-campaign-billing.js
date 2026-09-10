const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const PaymentHistory = require("../models/PaymentHistory");
const BusinessType = require("../models/BusinessType");
const subscriptionController = require("../controllers/subscriptionController");

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

  const promoterId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();

  const plan = await new SubscriptionPlan({
    name: "growth-billing-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
  }).save();

  const activeProject = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-billing-active-${Date.now()}`,
    isCampaignActive: true,
    committedLeads: 50,
    deliveredLeads: 23,
  }).save();

  const pendingProject = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Bahour Layout (unpaid)", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-billing-pending-${Date.now()}`,
  }).save();

  const activeCampaign = await new Campaign({
    promoter: promoterId,
    project: activeProject._id,
    plan: plan._id,
    committedMinimum: 50,
    status: "payment_received",
  }).save();

  const pendingCampaign = await new Campaign({
    promoter: promoterId,
    project: pendingProject._id,
    plan: plan._id,
    committedMinimum: 50,
    status: "draft",
  }).save();

  const activeSub = await new Subscription({
    user: promoterId,
    plan: plan._id,
    campaign: activeCampaign._id,
    project: activeProject._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active",
    amountPaid: 24999,
    razorpayOrderId: `order_billing_active_${Date.now()}`,
  }).save();

  // A still-pending (unpaid) subscription must NOT show up as an "active plan"
  const pendingSub = await new Subscription({
    user: promoterId,
    plan: plan._id,
    campaign: pendingCampaign._id,
    project: pendingProject._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "pending",
    amountPaid: 24999,
    razorpayOrderId: `order_billing_pending_${Date.now()}`,
  }).save();

  const payment = await new PaymentHistory({
    user: promoterId,
    plan: plan._id,
    planName: plan.name,
    amountPaid: 24999,
    razorpayOrderId: activeSub.razorpayOrderId,
    razorpayPaymentId: `pay_billing_${Date.now()}`,
    campaign: activeCampaign._id,
    project: activeProject._id,
  }).save();

  const { status, body } = await callController(subscriptionController.getMyCampaignBilling, {
    user: { _id: promoterId },
  });

  console.log(status === 200 ? "PASS: controller returned 200" : `FAIL: status ${status}`);

  console.log(
    body.activePlans.length === 1
      ? "PASS: only the paid (status: active) subscription appears in activePlans — pending one excluded"
      : `FAIL: activePlans count wrong: ${JSON.stringify(body.activePlans)}`
  );

  const active = body.activePlans[0];
  console.log(
    active && active.projectTitle === "TEST Villianur Layout" && active.planName === "Growth" &&
      active.amountPaid === 24999 && active.committedLeads === 50 && active.deliveredLeads === 23 &&
      active.campaignStatus === "payment_received"
      ? "PASS: active plan entry has correct project/plan/leads/status fields"
      : `FAIL: active plan entry wrong: ${JSON.stringify(active)}`
  );

  console.log(
    body.paymentHistory.length === 1 && body.paymentHistory[0].projectTitle === "TEST Villianur Layout" &&
      body.paymentHistory[0].planName === "Growth" && body.paymentHistory[0].amountPaid === 24999
      ? "PASS: payment history entry correct, linked to project"
      : `FAIL: payment history wrong: ${JSON.stringify(body.paymentHistory)}`
  );

  // Cleanup
  await Property.deleteMany({ _id: { $in: [activeProject._id, pendingProject._id] } });
  await Campaign.deleteMany({ _id: { $in: [activeCampaign._id, pendingCampaign._id] } });
  await Subscription.deleteMany({ _id: { $in: [activeSub._id, pendingSub._id] } });
  await PaymentHistory.deleteOne({ _id: payment._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
