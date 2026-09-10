const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const PaymentHistory = require("../models/PaymentHistory");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const campaignController = require("../controllers/campaignController");

const ObjectId = () => new mongoose.Types.ObjectId();

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

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const priya = await new User({ name: "Priya Builders", role_id: userRole, phone: `9${Date.now()}`.slice(0, 10) }).save();
  const ravi = await new User({ name: "Ravi Builder", role_id: userRole, phone: `8${Date.now()}`.slice(0, 10) }).save();

  const proPlan = await new SubscriptionPlan({
    name: "pro-pending-test", displayName: "Pro", businessType,
    price: 39999, propertyLimit: -1, leadsLimit: 85, committedMinimum: 85,
  }).save();
  const growthPlan = await new SubscriptionPlan({
    name: "growth-pending-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 50,
  }).save();

  const ecr = await new Property({
    seller: priya._id,
    basicInfo: { title: "ECR Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-pending-ecr-${Date.now()}`,
  }).save();
  const villianur = await new Property({
    seller: ravi._id,
    basicInfo: { title: "Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-pending-villianur-${Date.now()}`,
  }).save();
  const activeProject = await new Property({
    seller: ravi._id,
    basicInfo: { title: "Already Active Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-pending-active-${Date.now()}`,
  }).save();

  const paidAt = new Date("2026-08-28T10:00:00Z");
  const pendingCampaign1 = await new Campaign({
    promoter: priya._id, project: ecr._id, plan: proPlan._id,
    committedMinimum: 85, status: "payment_received",
  }).save();
  const pendingCampaign2 = await new Campaign({
    promoter: ravi._id, project: villianur._id, plan: growthPlan._id,
    committedMinimum: 50, status: "payment_received",
  }).save();

  // An already-active campaign must NOT show up in the pending queue
  const activeCampaign = await new Campaign({
    promoter: ravi._id, project: activeProject._id, plan: growthPlan._id,
    committedMinimum: 50, status: "active",
  }).save();

  const payment1 = await new PaymentHistory({
    user: priya._id, plan: proPlan._id, planName: "Pro", amountPaid: 39999,
    razorpayOrderId: `order_pending_1_${Date.now()}`, razorpayPaymentId: `pay_pending_1_${Date.now()}`,
    campaign: pendingCampaign1._id, project: ecr._id, transactionDate: paidAt,
  }).save();

  const r = await callController(campaignController.getPendingCampaigns);

  console.log(
    r.status === 200 && r.body.count === 2 && r.body.campaigns.length === 2
      ? "PASS: getPendingCampaigns returns exactly the 2 payment_received campaigns"
      : `FAIL: expected 2, got ${JSON.stringify(r.body)}`
  );

  const noActive = !r.body.campaigns.some((c) => String(c._id) === String(activeCampaign._id));
  console.log(
    noActive
      ? "PASS: an already-'active' campaign does not appear in the pending queue"
      : "FAIL: an active campaign leaked into the pending queue"
  );

  const row1 = r.body.campaigns.find((c) => String(c._id) === String(pendingCampaign1._id));
  console.log(
    row1 &&
      row1.promoterName === "Priya Builders" &&
      row1.projectTitle === "ECR Layout" &&
      row1.planName === "Pro" &&
      row1.committedMinimum === 85 &&
      row1.amountPaid === 39999 &&
      new Date(row1.paidAt).getTime() === paidAt.getTime()
      ? "PASS: row matches the mockup exactly — 'Priya Builders — ECR Layout — Pro — ₹39,999 paid', Leads: 85"
      : `FAIL: row1 wrong: ${JSON.stringify(row1)}`
  );

  const row2 = r.body.campaigns.find((c) => String(c._id) === String(pendingCampaign2._id));
  console.log(
    row2 && row2.amountPaid === null && row2.paidAt === null
      ? "PASS: a pending campaign with no matching PaymentHistory record degrades gracefully (null, not a crash)"
      : `FAIL: row2 wrong: ${JSON.stringify(row2)}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: [pendingCampaign1._id, pendingCampaign2._id, activeCampaign._id] } });
  await Property.deleteMany({ _id: { $in: [ecr._id, villianur._id, activeProject._id] } });
  await SubscriptionPlan.deleteMany({ _id: { $in: [proPlan._id, growthPlan._id] } });
  await PaymentHistory.deleteOne({ _id: payment1._id });
  await User.deleteMany({ _id: { $in: [priya._id, ravi._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
