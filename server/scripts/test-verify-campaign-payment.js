const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const PaymentHistory = require("../models/PaymentHistory");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
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

const sign = (orderId, paymentId) =>
  crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const promoterId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();

  const plan = await new SubscriptionPlan({
    name: "growth-verify-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
  }).save();

  const project = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Verify Payment Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-verify-payment-${Date.now()}`,
  }).save();

  const campaign = await new Campaign({
    promoter: promoterId,
    project: project._id,
    plan: plan._id,
    committedMinimum: plan.committedMinimum,
    status: "draft",
    discountTier: 1,
  }).save();

  const orderId = `order_test_${Date.now()}`;
  const subscription = await new Subscription({
    user: promoterId,
    plan: plan._id,
    campaign: campaign._id,
    project: project._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "pending",
    razorpayOrderId: orderId,
    paymentStatus: "pending",
    amountPaid: plan.price,
  }).save();

  const paymentId = `pay_test_${Date.now()}`;
  const validSignature = sign(orderId, paymentId);

  // 1. Invalid signature must be rejected, and must NOT touch any records
  const rBadSig = await callController(subscriptionController.verifyCampaignPayment, {
    user: { _id: promoterId },
    body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: "not-a-real-signature", campaignId: campaign._id },
  });
  console.log(
    rBadSig.status === 400 && rBadSig.body.success === false
      ? "PASS: invalid signature rejected"
      : `FAIL: invalid signature not rejected: ${JSON.stringify(rBadSig)}`
  );
  const campaignAfterBadSig = await Campaign.findById(campaign._id);
  console.log(
    campaignAfterBadSig.status === "draft"
      ? "PASS: campaign untouched after invalid signature"
      : "FAIL: campaign status changed despite invalid signature"
  );

  // 2. Wrong-owner promoter must be rejected
  const rWrongOwner = await callController(subscriptionController.verifyCampaignPayment, {
    user: { _id: ObjectId() }, // different promoter
    body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: validSignature, campaignId: campaign._id },
  });
  console.log(
    rWrongOwner.status === 404
      ? "PASS: campaign not found for a different promoter (ownership enforced)"
      : `FAIL: ownership not enforced: ${JSON.stringify(rWrongOwner)}`
  );

  // 3. Happy path
  const rOk = await callController(subscriptionController.verifyCampaignPayment, {
    user: { _id: promoterId },
    body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: validSignature, campaignId: campaign._id },
  });
  console.log(
    rOk.status === 200 && rOk.body.success === true && rOk.body.campaignStatus === "payment_received" &&
      rOk.body.message === "Payment received, admin activating soon"
      ? "PASS: verify-payment happy path returns correct response"
      : `FAIL: happy path response wrong: ${JSON.stringify(rOk)}`
  );

  const campaignAfter = await Campaign.findById(campaign._id);
  console.log(
    campaignAfter.status === "payment_received"
      ? "PASS: Campaign.status = 'payment_received' (NOT active)"
      : `FAIL: Campaign.status wrong: ${campaignAfter.status}`
  );

  const subAfter = await Subscription.findById(subscription._id);
  console.log(
    subAfter.status === "active" && subAfter.paymentStatus === "completed" && subAfter.razorpayPaymentId === paymentId
      ? "PASS: Subscription -> active, paymentStatus completed, payment id recorded"
      : "FAIL: Subscription not updated correctly"
  );

  const projectAfter = await Property.findById(project._id);
  console.log(
    projectAfter.committedLeads === 50
      ? "PASS: Property.committedLeads set from plan.committedMinimum"
      : `FAIL: Property.committedLeads wrong: ${projectAfter.committedLeads}`
  );

  const paymentHistory = await PaymentHistory.findOne({ razorpayPaymentId: paymentId });
  console.log(
    paymentHistory && String(paymentHistory.campaign) === String(campaign._id) && String(paymentHistory.project) === String(project._id)
      ? "PASS: PaymentHistory created, linked to campaign + project"
      : "FAIL: PaymentHistory missing or not linked correctly"
  );
  console.log(
    paymentHistory?.expiryDate && paymentHistory.expiryDate.getTime() === subscription.endDate.getTime()
      ? "PASS: PaymentHistory.expiryDate set from Subscription.endDate (no more 'Lifetime Access' on Billing History)"
      : `FAIL: PaymentHistory.expiryDate wrong: ${paymentHistory?.expiryDate}`
  );

  const auditEntry = await AuditLog.findOne({ action: "PAYMENT_RECEIVED", entityId: campaign._id });
  console.log(
    auditEntry && auditEntry.entity === "Campaign" && String(auditEntry.actor) === String(promoterId)
      ? "PASS: AuditLog PAYMENT_RECEIVED entry written"
      : "FAIL: AuditLog entry missing or wrong"
  );

  // Task 6.4 — portal notification(s) to admin, alongside the push notification
  const paymentNotifications = await Notification.find({
    type: "campaign_activation_required",
    message: { $regex: "TEST Verify Payment Project" },
  });
  console.log(
    paymentNotifications.length > 0 &&
      paymentNotifications[0].title === "New Campaign Payment — Action Required" &&
      paymentNotifications[0].link === "/admin/campaigns/pending"
      ? `PASS: portal notification(s) created for admin (${paymentNotifications.length}) — Task 6.4`
      : "FAIL: campaign_activation_required portal notification missing or wrong"
  );

  // 4. Idempotency — replaying the same verified payment must be rejected, not reprocessed
  const rReplay = await callController(subscriptionController.verifyCampaignPayment, {
    user: { _id: promoterId },
    body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: validSignature, campaignId: campaign._id },
  });
  console.log(
    rReplay.status === 400 && rReplay.body.success === false
      ? "PASS: replaying an already-processed payment is rejected (idempotent)"
      : `FAIL: replay not rejected: ${JSON.stringify(rReplay)}`
  );
  const paymentHistoryCountAfterReplay = await PaymentHistory.countDocuments({ razorpayPaymentId: paymentId });
  console.log(
    paymentHistoryCountAfterReplay === 1
      ? "PASS: no duplicate PaymentHistory created on replay"
      : `FAIL: duplicate PaymentHistory created (count=${paymentHistoryCountAfterReplay})`
  );

  // Cleanup (AuditLog is append-only by design — bypass Mongoose hooks via the
  // raw driver ONLY here, to remove this test's own fixture data)
  await Property.deleteOne({ _id: project._id });
  await Campaign.deleteOne({ _id: campaign._id });
  await Subscription.deleteOne({ _id: subscription._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await PaymentHistory.deleteMany({ razorpayPaymentId: paymentId });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: campaign._id });
  await Notification.deleteMany({ _id: { $in: paymentNotifications.map((n) => n._id) } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
