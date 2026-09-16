// Admin: Promoter Management — Module 9 (Task 9.1 getPromoterCampaigns,
// Task 9.2 getCampaignStats). Both are new controller functions in
// campaignController.js, route-registered in adminCampaignRoutes.js
// (route order itself is covered separately by
// test-admin-campaign-routes-order.js).
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Requirement = require("../models/Requirement");
const PaymentHistory = require("../models/PaymentHistory");
const BusinessType = require("../models/BusinessType");
const campaignController = require("../controllers/campaignController");

const ObjectId = () => new mongoose.Types.ObjectId();

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

  const businessType = (await BusinessType.findOne()) || ObjectId();
  const plan = await new SubscriptionPlan({
    name: "growth-promoter-mgmt-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 10,
    committedMinimum: 10,
    duration: 30,
  }).save();

  const cleanup = { properties: [], campaigns: [], requirements: [], payments: [], plans: [plan._id] };

  // ===================================================================
  // Task 9.1 — getPromoterCampaigns
  // ===================================================================
  const promoterId = ObjectId();

  const projectActive = await new Property({
    seller: promoterId,
    basicInfo: { title: "PM Test Active Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    location: { locality: "Villianur" },
    slug: `pm-test-active-${Date.now()}`,
  }).save();
  const projectAtLimit = await new Property({
    seller: promoterId,
    basicInfo: { title: "PM Test At-Limit Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `pm-test-limit-${Date.now()}`,
  }).save();
  const projectNoPlan = await new Property({
    seller: promoterId,
    basicInfo: { title: "PM Test No-Plan Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `pm-test-noplan-${Date.now()}`,
  }).save();
  cleanup.properties.push(projectActive._id, projectAtLimit._id, projectNoPlan._id);

  const goLiveAt = new Date("2026-08-01T00:00:00Z");
  const expiresAt = new Date("2026-08-31T00:00:00Z");
  const campaignActive = await new Campaign({
    promoter: promoterId, project: projectActive._id, plan: plan._id,
    committedMinimum: 10, deliveredCount: 3, status: "active", discountTier: 1,
    goLiveAt, expiresAt, paceStatus: "on_track",
  }).save();
  const campaignAtLimit = await new Campaign({
    promoter: promoterId, project: projectAtLimit._id, plan: plan._id,
    committedMinimum: 10, deliveredCount: 10, status: "active", discountTier: 1,
  }).save();
  cleanup.campaigns.push(campaignActive._id, campaignAtLimit._id);

  const payment = await new PaymentHistory({
    user: promoterId, plan: plan._id, planName: plan.displayName, amountPaid: 24999, finalAmount: 24999,
    razorpayOrderId: `order_pm_test_${Date.now()}`, razorpayPaymentId: `pay_pm_test_${Date.now()}`,
    paymentStatus: "completed", campaign: campaignActive._id, project: projectActive._id,
  }).save();
  cleanup.payments.push(payment._id);

  const r1 = await callController(campaignController.getPromoterCampaigns, { params: { id: String(promoterId) } });
  const projectsById = Object.fromEntries((r1.body.projects || []).map((p) => [String(p.projectId), p]));

  console.log(
    r1.status === 200 && r1.body.projects.length === 3
      ? "PASS: getPromoterCampaigns returns all 3 of this promoter's projects (not just the ones with a campaign)"
      : `FAIL: expected 3 projects, got ${r1.body.projects?.length}: ${JSON.stringify(r1.body)}`
  );

  const activeRow = projectsById[String(projectActive._id)];
  console.log(
    activeRow && activeRow.status === "active" && activeRow.deliveredCount === 3 && activeRow.committedMinimum === 10 && activeRow.planName === "Growth"
      ? "PASS: project with an under-limit active campaign shows correct plan/leads/status"
      : `FAIL: active row wrong: ${JSON.stringify(activeRow)}`
  );
  console.log(
    activeRow && String(activeRow.campaignId) === String(campaignActive._id)
      ? "PASS: Admin Module Task 6.1 — project row carries campaignId, so the [View] action can link to /admin/campaigns/:id"
      : `FAIL: campaignId missing/wrong on active row: ${JSON.stringify(activeRow)}`
  );

  const limitRow = projectsById[String(projectAtLimit._id)];
  console.log(
    limitRow && limitRow.status === "limit_reached" && limitRow.deliveredCount === 10 && limitRow.committedMinimum === 10
      ? "PASS: project with deliveredCount >= committedMinimum shows status 'limit_reached', matching the mockup ('Bahour Layout | Starter | 22/22 | Limit Reached')"
      : `FAIL: at-limit row wrong: ${JSON.stringify(limitRow)}`
  );

  const noPlanRow = projectsById[String(projectNoPlan._id)];
  console.log(
    noPlanRow && noPlanRow.status === "no_plan" && noPlanRow.planName === null
      ? "PASS: project with no campaign at all shows status 'no_plan', matching the mockup ('ECR Layout | — | — | No Plan')"
      : `FAIL: no-plan row wrong: ${JSON.stringify(noPlanRow)}`
  );
  console.log(
    noPlanRow && noPlanRow.campaignId === null
      ? "PASS: Admin Module Task 6.1 — a no-plan project has campaignId: null (no [View] action to show)"
      : `FAIL: no-plan row's campaignId should be null: ${JSON.stringify(noPlanRow)}`
  );

  console.log(
    r1.body.paymentHistory.length === 1 &&
      r1.body.paymentHistory[0].projectTitle === "PM Test Active Project" &&
      r1.body.paymentHistory[0].planName === "Growth" &&
      r1.body.paymentHistory[0].amountPaid === 24999
      ? "PASS: paymentHistory correctly linked and formatted"
      : `FAIL: paymentHistory wrong: ${JSON.stringify(r1.body.paymentHistory)}`
  );
  console.log(
    r1.body.paymentHistory[0]?.paymentStatus === "completed"
      ? "PASS: Admin Module Task 6.1 — paymentHistory row carries paymentStatus, for the mockup's Status column"
      : `FAIL: paymentStatus missing/wrong: ${JSON.stringify(r1.body.paymentHistory[0])}`
  );

  // ===================================================================
  // Task 6.2 — the `campaigns` array (one row per actual Campaign, in the
  // exact shape the task spec lists), added alongside (not replacing)
  // Task 6.1's `projects`/`paymentHistory` arrays.
  // ===================================================================
  console.log(
    Array.isArray(r1.body.campaigns) && r1.body.campaigns.length === 2
      ? "PASS: Task 6.2 — campaigns array exists, one row per actual Campaign (2 — the no-plan project has no row)"
      : `FAIL: campaigns array wrong: ${JSON.stringify(r1.body.campaigns)}`
  );

  const campaignsById = Object.fromEntries((r1.body.campaigns || []).map((c) => [String(c._id), c]));
  const activeCampaignRow = campaignsById[String(campaignActive._id)];
  console.log(
    activeCampaignRow &&
      activeCampaignRow.status === "active" &&
      activeCampaignRow.plan?.name === "growth-promoter-mgmt-test" &&
      activeCampaignRow.plan?.price === 24999 &&
      activeCampaignRow.project?.title === "PM Test Active Project" &&
      activeCampaignRow.project?.location?.locality === "Villianur" &&
      activeCampaignRow.committedMinimum === 10 &&
      activeCampaignRow.deliveredCount === 3 &&
      new Date(activeCampaignRow.goLiveAt).getTime() === goLiveAt.getTime() &&
      new Date(activeCampaignRow.expiresAt).getTime() === expiresAt.getTime() &&
      activeCampaignRow.paceStatus === "on_track"
      ? "PASS: Task 6.2 — campaign row has _id/status/plan.name/plan.price/project.title/project.location.locality/committedMinimum/deliveredCount/goLiveAt/expiresAt/paceStatus, all real schema fields"
      : `FAIL: campaign row shape wrong: ${JSON.stringify(activeCampaignRow)}`
  );

  console.log(
    r1.body.paymentHistory.length === 1 &&
      typeof r1.body.paymentHistory[0].date !== "undefined" &&
      typeof r1.body.paymentHistory[0].planName !== "undefined" &&
      typeof r1.body.paymentHistory[0].amountPaid !== "undefined" &&
      typeof r1.body.paymentHistory[0].projectTitle !== "undefined"
      ? "PASS: Task 6.2 — paymentHistory already carries the underlying data (transactionDate/planName/amountPaid/project) under Task 6.1's existing field names (date/projectTitle) — left unchanged rather than duplicating fields or breaking SellerList"
      : `FAIL: paymentHistory missing underlying Task 6.2 data: ${JSON.stringify(r1.body.paymentHistory[0])}`
  );

  // Ownership — a second, unrelated promoter's data must never leak in
  const otherPromoterId = ObjectId();
  const otherProject = await new Property({
    seller: otherPromoterId,
    basicInfo: { title: "PM Test Other Promoter Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `pm-test-other-${Date.now()}`,
  }).save();
  const otherCampaign = await new Campaign({
    promoter: otherPromoterId, project: otherProject._id, plan: plan._id,
    committedMinimum: 10, deliveredCount: 1, status: "active", discountTier: 1,
  }).save();
  cleanup.properties.push(otherProject._id);
  cleanup.campaigns.push(otherCampaign._id);

  const r1Other = await callController(campaignController.getPromoterCampaigns, { params: { id: String(otherPromoterId) } });
  const leakedIntoFirst = r1.body.campaigns.some((c) => String(c._id) === String(otherCampaign._id));
  const otherHasOwnCampaign = r1Other.body.campaigns.some((c) => String(c._id) === String(otherCampaign._id));
  console.log(
    !leakedIntoFirst && otherHasOwnCampaign
      ? "PASS: campaign/payment data is correctly scoped to the requested promoter — no cross-promoter leakage"
      : `FAIL: ownership scoping broken — leaked into first promoter: ${leakedIntoFirst}, other promoter has own campaign: ${otherHasOwnCampaign}`
  );

  // A promoter with zero projects at all — must not crash, must return empty arrays
  const emptyPromoterId = ObjectId();
  const r1b = await callController(campaignController.getPromoterCampaigns, { params: { id: String(emptyPromoterId) } });
  console.log(
    r1b.status === 200 &&
      r1b.body.projects.length === 0 &&
      r1b.body.campaigns.length === 0 &&
      r1b.body.paymentHistory.length === 0
      ? "PASS: a promoter with no projects returns empty arrays (incl. Task 6.2's campaigns), not an error"
      : `FAIL: empty-promoter case wrong: ${JSON.stringify(r1b.body)}`
  );

  // ===================================================================
  // Task 9.2 — getCampaignStats (delta-based, since this is a shared dev DB
  // with pre-existing real campaigns/leads from earlier manual testing)
  // ===================================================================
  const before = (await callController(campaignController.getCampaignStats, { params: {} })).body;

  const statsPromoter = ObjectId();
  const projA = await new Property({
    seller: statsPromoter, basicInfo: { title: "Stats A", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `stats-a-${Date.now()}`,
  }).save();
  const projB = await new Property({
    seller: statsPromoter, basicInfo: { title: "Stats B", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `stats-b-${Date.now()}`,
  }).save();
  const projC = await new Property({
    seller: statsPromoter, basicInfo: { title: "Stats C", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `stats-c-${Date.now()}`,
  }).save();
  const projD = await new Property({
    seller: statsPromoter, basicInfo: { title: "Stats D", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `stats-d-${Date.now()}`,
  }).save();
  cleanup.properties.push(projA._id, projB._id, projC._id, projD._id);

  const campA = await new Campaign({ // active, AT limit
    promoter: statsPromoter, project: projA._id, plan: plan._id,
    committedMinimum: 10, deliveredCount: 10, status: "active", discountTier: 1,
  }).save();
  const campB = await new Campaign({ // active, under limit
    promoter: statsPromoter, project: projB._id, plan: plan._id,
    committedMinimum: 10, deliveredCount: 5, status: "active", discountTier: 1,
  }).save();
  const campC = await new Campaign({ // pending activation
    promoter: statsPromoter, project: projC._id, plan: plan._id,
    committedMinimum: 10, status: "payment_received", discountTier: 1,
  }).save();
  const campD = await new Campaign({ // draft — must not count as active or pending
    promoter: statsPromoter, project: projD._id, plan: plan._id,
    committedMinimum: 10, status: "draft", discountTier: 1,
  }).save();
  cleanup.campaigns.push(campA._id, campB._id, campC._id, campD._id);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // safely across the day boundary

  const leadToday1 = await new Requirement({
    fullName: "Stats Lead 1", phoneNumber: "9100000101", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campA._id, matchedProject: projA._id, deliveredAt: now,
  }).save();
  const leadToday2 = await new Requirement({
    fullName: "Stats Lead 2", phoneNumber: "9100000102", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campB._id, matchedProject: projB._id, deliveredAt: now,
  }).save();
  const leadYesterday = await new Requirement({
    fullName: "Stats Lead Yesterday", phoneNumber: "9100000103", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: campA._id, matchedProject: projA._id, deliveredAt: yesterday,
  }).save();
  const leadTodayNoCampaign = await new Requirement({
    fullName: "Stats Lead No Campaign", phoneNumber: "9100000104", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    matchedProject: projA._id, deliveredAt: now, // no campaignId — organic/non-campaign lead
  }).save();
  cleanup.requirements.push(leadToday1._id, leadToday2._id, leadYesterday._id, leadTodayNoCampaign._id);

  const after = (await callController(campaignController.getCampaignStats, { params: {} })).body;

  console.log(
    after.activeCampaigns - before.activeCampaigns === 2
      ? "PASS: activeCampaigns increases by exactly 2 (campA + campB; campC pending and campD draft excluded)"
      : `FAIL: activeCampaigns delta = ${after.activeCampaigns - before.activeCampaigns}`
  );
  console.log(
    after.pendingActivation - before.pendingActivation === 1
      ? "PASS: pendingActivation increases by exactly 1 (campC only)"
      : `FAIL: pendingActivation delta = ${after.pendingActivation - before.pendingActivation}`
  );
  console.log(
    after.leadsUploadedToday - before.leadsUploadedToday === 2
      ? "PASS: leadsUploadedToday counts only today's campaign-linked leads (2) — excludes yesterday's and the non-campaign one"
      : `FAIL: leadsUploadedToday delta = ${after.leadsUploadedToday - before.leadsUploadedToday}`
  );
  console.log(
    after.campaignsAtLimit - before.campaignsAtLimit === 1
      ? "PASS: campaignsAtLimit increases by exactly 1 (campA only — campB is active but under limit)"
      : `FAIL: campaignsAtLimit delta = ${after.campaignsAtLimit - before.campaignsAtLimit}`
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: cleanup.requirements } });
  await Campaign.deleteMany({ _id: { $in: cleanup.campaigns } });
  await Property.deleteMany({ _id: { $in: cleanup.properties } });
  await PaymentHistory.deleteMany({ _id: { $in: cleanup.payments } });
  await SubscriptionPlan.deleteMany({ _id: { $in: cleanup.plans } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
