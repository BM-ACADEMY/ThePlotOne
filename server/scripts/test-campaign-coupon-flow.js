// Coupon integration for the Promoter Campaign purchase flow — covers
// createCampaignOrder's new couponCode support and the new
// activateFreeCampaign endpoint. Does NOT touch/re-test the legacy
// Seller/Agent coupon flow (couponController.js, Coupon model, createOrder/
// verifyPayment/activateFreePlan) — those files were not modified.
const mongoose = require("mongoose");
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
const Coupon = require("../models/Coupon");
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

  const businessType = (await BusinessType.findOne()) || ObjectId();

  const plan = await new SubscriptionPlan({
    name: "growth-coupon-test",
    displayName: "Growth",
    businessType,
    price: 10000, // round number for clean percentage math
    propertyLimit: -1,
    leadsLimit: 10,
    committedMinimum: 10,
    duration: 30,
  }).save();

  const makeProject = async (promoterId, title) =>
    new Property({
      seller: promoterId,
      basicInfo: { title, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }).save();

  const allCreatedIds = { promoters: [], projects: [], campaigns: [], coupons: [], plans: [plan._id] };

  // ===================================================================
  // Scenario 1 — no coupon at all: existing paid Razorpay flow unaffected
  // ===================================================================
  const promoter1 = ObjectId();
  const project1 = await makeProject(promoter1, "Coupon Test No Coupon");
  allCreatedIds.projects.push(project1._id);

  const r1 = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter1 },
    body: { projectId: String(project1._id), planId: String(plan._id) },
  });
  console.log(
    r1.status === 200 &&
      r1.body.success &&
      r1.body.free === false &&
      !!r1.body.orderId &&
      r1.body.finalAmount === 10000 &&
      r1.body.couponCode === null
      ? "PASS: no coupon — existing paid Razorpay order flow unaffected (real order created, finalAmount = plan.price)"
      : `FAIL: no-coupon flow wrong: ${JSON.stringify(r1.body)}`
  );
  allCreatedIds.campaigns.push(r1.body.campaignId);

  // ===================================================================
  // Scenario 2+3+4 — 100% coupon -> free -> activate -> retry protection
  // ===================================================================
  const promoter2 = ObjectId();
  const project2 = await makeProject(promoter2, "Coupon Test Free 100");
  allCreatedIds.projects.push(project2._id);

  const couponFree = await new Coupon({
    code: "FREE100TEST",
    discountType: "percentage",
    discountValue: 100,
    maxUsageTotal: null,
    maxUsagePerUser: 1,
    minSpend: 0,
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponFree._id);

  const r2 = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter2 },
    body: { projectId: String(project2._id), planId: String(plan._id), couponCode: "free100test" },
  });
  console.log(
    r2.status === 200 &&
      r2.body.free === true &&
      r2.body.orderId === null &&
      r2.body.amount === 0 &&
      r2.body.finalAmount === 0 &&
      r2.body.couponCode === "FREE100TEST"
      ? "PASS: 100% coupon -> free:true, no Razorpay orderId returned"
      : `FAIL: 100% coupon order-creation wrong: ${JSON.stringify(r2.body)}`
  );
  const campaign2Id = r2.body.campaignId;
  allCreatedIds.campaigns.push(campaign2Id);

  const sub2Before = await Subscription.findOne({ campaign: campaign2Id });
  console.log(
    sub2Before && sub2Before.razorpayOrderId.startsWith("FREE_COUPON_")
      ? "PASS: Subscription for the free path gets a FREE_COUPON_ sentinel, never a real/fake Razorpay order id"
      : `FAIL: Subscription razorpayOrderId wrong: ${sub2Before?.razorpayOrderId}`
  );

  const r3 = await callController(subscriptionController.activateFreeCampaign, {
    user: { _id: promoter2 },
    body: { campaignId: campaign2Id, couponCode: "FREE100TEST" },
  });
  console.log(
    r3.status === 200 && r3.body.success && r3.body.campaignStatus === "payment_received"
      ? "PASS: activate-free returns 200, campaign status 'payment_received'"
      : `FAIL: activate-free response wrong: ${JSON.stringify(r3.body)}`
  );

  const campaignAfterFree = await Campaign.findById(campaign2Id);
  console.log(
    campaignAfterFree.status === "payment_received"
      ? "PASS: Campaign.status = 'payment_received'"
      : `FAIL: Campaign.status = ${campaignAfterFree.status}`
  );

  const subAfterFree = await Subscription.findOne({ campaign: campaign2Id });
  console.log(
    subAfterFree.status === "active" && subAfterFree.paymentStatus === "completed" && subAfterFree.amountPaid === 0
      ? "PASS: Subscription -> active, paymentStatus completed, amountPaid 0"
      : `FAIL: Subscription state wrong: ${JSON.stringify(subAfterFree)}`
  );

  const projectAfterFree = await Property.findById(project2._id);
  console.log(
    projectAfterFree.committedLeads === plan.committedMinimum
      ? "PASS: Property.committedLeads set from plan.committedMinimum"
      : `FAIL: Property.committedLeads = ${projectAfterFree.committedLeads}`
  );

  const paymentHistoryFree = await PaymentHistory.findOne({ campaign: campaign2Id });
  console.log(
    paymentHistoryFree &&
      paymentHistoryFree.amountPaid === 0 &&
      paymentHistoryFree.finalAmount === 0 &&
      paymentHistoryFree.couponCode === "FREE100TEST" &&
      paymentHistoryFree.paymentStatus === "completed" &&
      String(paymentHistoryFree.project) === String(project2._id)
      ? "PASS: PaymentHistory created — amountPaid/finalAmount 0, couponCode recorded, linked to campaign+project"
      : `FAIL: PaymentHistory wrong: ${JSON.stringify(paymentHistoryFree)}`
  );
  console.log(
    paymentHistoryFree?.expiryDate && paymentHistoryFree.expiryDate.getTime() === subAfterFree.endDate.getTime()
      ? "PASS: PaymentHistory.expiryDate set from Subscription.endDate on the free/coupon path too"
      : `FAIL: PaymentHistory.expiryDate wrong: ${paymentHistoryFree?.expiryDate}`
  );

  const auditFree = await AuditLog.findOne({ action: "PAYMENT_RECEIVED", entityId: campaign2Id });
  console.log(
    auditFree && auditFree.after.status === "payment_received"
      ? "PASS: AuditLog PAYMENT_RECEIVED entry written"
      : "FAIL: AuditLog entry missing/wrong"
  );

  const adminNotifFree = await Notification.find({
    type: "campaign_activation_required",
    message: { $regex: "Coupon Test Free 100" },
  });
  console.log(
    adminNotifFree.length > 0 && adminNotifFree[0].title === "New Campaign Payment — Action Required"
      ? "PASS: admin campaign-activation-required notification created for the free path too"
      : "FAIL: admin notification missing for free activation"
  );

  const couponAfterFirstUse = await Coupon.findById(couponFree._id);
  console.log(
    couponAfterFirstUse.usedCount === 1
      ? "PASS: coupon usedCount incremented by exactly 1"
      : `FAIL: usedCount = ${couponAfterFirstUse.usedCount}`
  );

  // Retry / duplicate request protection
  const r4 = await callController(subscriptionController.activateFreeCampaign, {
    user: { _id: promoter2 },
    body: { campaignId: campaign2Id, couponCode: "FREE100TEST" },
  });
  console.log(
    r4.status === 400 && r4.body.success === false
      ? "PASS: retrying activate-free on an already-processed campaign is rejected"
      : `FAIL: retry not rejected: ${JSON.stringify(r4.body)}`
  );

  const couponAfterRetry = await Coupon.findById(couponFree._id);
  console.log(
    couponAfterRetry.usedCount === 1
      ? "PASS: retry does NOT double-increment coupon usedCount (still 1)"
      : `FAIL: usedCount after retry = ${couponAfterRetry.usedCount}`
  );

  // ===================================================================
  // Scenario 5-8 — rejection paths, all against one throwaway project
  // (none of these ever reach Campaign.create, so reusing one project is safe)
  // ===================================================================
  const promoter3 = ObjectId();
  const project3 = await makeProject(promoter3, "Coupon Test Rejections");
  allCreatedIds.projects.push(project3._id);

  const rInvalid = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter3 },
    body: { projectId: String(project3._id), planId: String(plan._id), couponCode: "DOESNOTEXIST" },
  });
  console.log(
    rInvalid.status === 400 && /invalid/i.test(rInvalid.body.message)
      ? "PASS: invalid coupon code rejected"
      : `FAIL: invalid coupon not rejected correctly: ${JSON.stringify(rInvalid.body)}`
  );

  const couponExpired = await new Coupon({
    code: "EXPIREDTEST",
    discountType: "percentage",
    discountValue: 100,
    endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponExpired._id);

  const rExpired = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter3 },
    body: { projectId: String(project3._id), planId: String(plan._id), couponCode: "EXPIREDTEST" },
  });
  console.log(
    rExpired.status === 400 && /expired|not active/i.test(rExpired.body.message)
      ? "PASS: expired coupon rejected"
      : `FAIL: expired coupon not rejected: ${JSON.stringify(rExpired.body)}`
  );

  const couponUsedUp = await new Coupon({
    code: "USEDUPTEST",
    discountType: "percentage",
    discountValue: 100,
    maxUsageTotal: 1,
    usedCount: 1, // already at its limit
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponUsedUp._id);

  const rUsedUp = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter3 },
    body: { projectId: String(project3._id), planId: String(plan._id), couponCode: "USEDUPTEST" },
  });
  console.log(
    rUsedUp.status === 400 && /usage limit/i.test(rUsedUp.body.message)
      ? "PASS: coupon usage-limit-reached rejected"
      : `FAIL: usage limit not enforced: ${JSON.stringify(rUsedUp.body)}`
  );

  const couponMinSpend = await new Coupon({
    code: "MINSPENDTEST",
    discountType: "percentage",
    discountValue: 50,
    minSpend: 999999, // far above plan.price (10000)
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponMinSpend._id);

  const rMinSpend = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter3 },
    body: { projectId: String(project3._id), planId: String(plan._id), couponCode: "MINSPENDTEST" },
  });
  console.log(
    rMinSpend.status === 400 && /minimum spend/i.test(rMinSpend.body.message)
      ? "PASS: minSpend requirement enforced"
      : `FAIL: minSpend not enforced: ${JSON.stringify(rMinSpend.body)}`
  );

  const orphanCampaignForProject3 = await Campaign.findOne({ project: project3._id });
  console.log(
    !orphanCampaignForProject3
      ? "PASS: none of the 4 rejected coupon attempts created a Campaign/Subscription"
      : "FAIL: a Campaign was created despite a rejected coupon"
  );

  // ===================================================================
  // Scenario 9 — fixed discount, partial (not free), real Razorpay order
  // ===================================================================
  const promoter4 = ObjectId();
  const project4 = await makeProject(promoter4, "Coupon Test Fixed Partial");
  allCreatedIds.projects.push(project4._id);

  const couponFixed = await new Coupon({
    code: "FIXED3000TEST",
    discountType: "fixed",
    discountValue: 3000,
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponFixed._id);

  const r9 = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter4 },
    body: { projectId: String(project4._id), planId: String(plan._id), couponCode: "FIXED3000TEST" },
  });
  console.log(
    r9.status === 200 &&
      r9.body.free === false &&
      !!r9.body.orderId &&
      r9.body.couponDiscountAmount === 3000 &&
      r9.body.finalAmount === 7000 // plan.price(10000) - fixed 3000, 0% volume discount (1st campaign)
      ? "PASS: fixed discount coupon applied correctly (partial, real Razorpay order still created)"
      : `FAIL: fixed discount wrong: ${JSON.stringify(r9.body)}`
  );
  allCreatedIds.campaigns.push(r9.body.campaignId);

  const sub9 = await Subscription.findOne({ campaign: r9.body.campaignId });
  console.log(
    sub9.amountPaid === 7000
      ? "PASS: Subscription.amountPaid matches the coupon-adjusted finalAmount"
      : `FAIL: Subscription.amountPaid = ${sub9.amountPaid}`
  );

  // ===================================================================
  // Scenario 10 — partial percentage discount (not free)
  // ===================================================================
  const promoter5 = ObjectId();
  const project5 = await makeProject(promoter5, "Coupon Test Percent Partial");
  allCreatedIds.projects.push(project5._id);

  const couponPercent30 = await new Coupon({
    code: "PERCENT30TEST",
    discountType: "percentage",
    discountValue: 30,
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponPercent30._id);

  const r10 = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter5 },
    body: { projectId: String(project5._id), planId: String(plan._id), couponCode: "PERCENT30TEST" },
  });
  console.log(
    r10.status === 200 &&
      r10.body.free === false &&
      r10.body.couponDiscountAmount === 3000 && // 30% of 10000
      r10.body.finalAmount === 7000
      ? "PASS: partial percentage coupon discount calculated correctly"
      : `FAIL: partial percentage wrong: ${JSON.stringify(r10.body)}`
  );
  allCreatedIds.campaigns.push(r10.body.campaignId);

  // ===================================================================
  // Scenario 11 — combined: volume discount (2nd campaign, 20%) THEN coupon
  // on top, documented order: coupon % applies to the volume-discounted
  // amount, not the original sticker price.
  // ===================================================================
  const promoter6 = ObjectId();
  const throwawayProject = await makeProject(promoter6, "Coupon Test Combined Throwaway");
  const throwawayOrder = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter6 },
    body: { projectId: String(throwawayProject._id), planId: String(plan._id) },
  });
  allCreatedIds.projects.push(throwawayProject._id);
  allCreatedIds.campaigns.push(throwawayOrder.body.campaignId);

  const project6 = await makeProject(promoter6, "Coupon Test Combined");
  allCreatedIds.projects.push(project6._id);

  const couponPercent20 = await new Coupon({
    code: "PERCENT20TEST",
    discountType: "percentage",
    discountValue: 20,
    status: "active",
  }).save();
  allCreatedIds.coupons.push(couponPercent20._id);

  const r11 = await callController(subscriptionController.createCampaignOrder, {
    user: { _id: promoter6 },
    body: { projectId: String(project6._id), planId: String(plan._id), couponCode: "PERCENT20TEST" },
  });
  // volume: 10000 * (1-0.20) = 8000 (2nd campaign, 20% volume discount)
  // coupon: 8000 * (1-0.20) = 6400 (20% coupon on the volume-discounted amount)
  console.log(
    r11.status === 200 &&
      r11.body.discountTier === 2 &&
      r11.body.discountPercent === 20 &&
      r11.body.couponDiscountAmount === 1600 &&
      r11.body.finalAmount === 6400
      ? "PASS: volume discount + coupon combine in the documented order (coupon applied to the volume-discounted amount)"
      : `FAIL: combined discount wrong: ${JSON.stringify(r11.body)}`
  );
  allCreatedIds.campaigns.push(r11.body.campaignId);

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: allCreatedIds.campaigns } });
  await Subscription.deleteMany({ campaign: { $in: allCreatedIds.campaigns } });
  await Property.deleteMany({ _id: { $in: allCreatedIds.projects } });
  await SubscriptionPlan.deleteMany({ _id: { $in: allCreatedIds.plans } });
  await Coupon.deleteMany({ _id: { $in: allCreatedIds.coupons } });
  await PaymentHistory.deleteMany({ campaign: { $in: allCreatedIds.campaigns } });
  // AuditLog is append-only (no update/delete allowed via the model) — bypass
  // the model and go through the raw collection, same as other test scripts.
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: { $in: allCreatedIds.campaigns } });
  await Notification.deleteMany({ message: { $regex: "Coupon Test" } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
