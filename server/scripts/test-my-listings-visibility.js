const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const BusinessType = require("../models/BusinessType");
const Requirement = require("../models/Requirement");
const propertyController = require("../controllers/propertyController");

const ObjectId = () => new mongoose.Types.ObjectId();

// Minimal Express req/res double so we call the REAL controller function,
// not a reimplementation of its logic.
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

  const sellerId = ObjectId();

  const plan = await new SubscriptionPlan({
    name: "growth-test",
    displayName: "Growth",
    businessType: (await BusinessType.findOne()) || ObjectId(),
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
  }).save();

  const now = Date.now();
  const tenDaysFromNow = new Date(now + 10 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);

  // Campaign with deliberately sensitive admin-only fields set, so we can
  // prove they never reach the promoter response.
  const activeCampaign = await new Campaign({
    promoter: sellerId,
    project: ObjectId(),
    plan: plan._id,
    committedMinimum: 50,
    deliveredCount: 23,
    status: "active",
    discountTier: 2,
    expiresAt: tenDaysFromNow,
    paceStatus: "on_track",
    activatedBy: ObjectId(),
    cityId: "PONDY",
    notes: "SECRET_ADMIN_NOTE_should_never_leak_to_promoter",
  }).save();

  const expiredCampaign = await new Campaign({
    promoter: sellerId,
    project: ObjectId(),
    plan: plan._id,
    committedMinimum: 22,
    deliveredCount: 22,
    status: "active",
    expiresAt: fiveDaysAgo,
    notes: "SECRET_ADMIN_NOTE_2",
  }).save();

  const propWithActiveCampaign = await new Property({
    seller: sellerId,
    basicInfo: { title: "TEST Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-villianur-${now}`,
    isCampaignActive: true,
    activeCampaign: activeCampaign._id,
    committedLeads: 50,
    deliveredLeads: 23,
  }).save();

  const propWithExpiredCampaign = await new Property({
    seller: sellerId,
    basicInfo: { title: "TEST Overdue Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-overdue-${now}`,
    isCampaignActive: true,
    activeCampaign: expiredCampaign._id,
    committedLeads: 22,
    deliveredLeads: 22,
  }).save();

  const propWithNoCampaign = await new Property({
    seller: sellerId,
    basicInfo: { title: "TEST Bahour Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-bahour-${now}`,
    isCampaignActive: false,
  }).save();

  // Promoter Module Task 10.2 — "New today" count fixtures
  const todayLead1 = await new Requirement({
    fullName: "Today Lead 1", phoneNumber: "9100000201", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: activeCampaign._id, matchedProject: propWithActiveCampaign._id, deliveredAt: new Date(),
  }).save();
  const todayLead2 = await new Requirement({
    fullName: "Today Lead 2", phoneNumber: "9100000202", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: activeCampaign._id, matchedProject: propWithActiveCampaign._id, deliveredAt: new Date(),
  }).save();
  const yesterdayLead = await new Requirement({
    fullName: "Yesterday Lead", phoneNumber: "9100000203", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    campaignId: activeCampaign._id, matchedProject: propWithActiveCampaign._id, deliveredAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
  }).save();
  const todayOrganicLead = await new Requirement({
    fullName: "Today Organic Lead", phoneNumber: "9100000204", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    matchedProject: propWithNoCampaign._id, deliveredAt: new Date(), // no campaignId — must not count
  }).save();

  const { status, body } = await callController(propertyController.getMyListings, {
    user: { _id: sellerId },
    query: { limit: 100 },
  });

  const raw = JSON.stringify(body);
  console.log(status === 200 ? "PASS: controller returned 200" : `FAIL: status was ${status}`);

  const active = body.properties.find((p) => p._id.toString() === propWithActiveCampaign._id.toString());
  const expired = body.properties.find((p) => p._id.toString() === propWithExpiredCampaign._id.toString());
  const noCampaign = body.properties.find((p) => p._id.toString() === propWithNoCampaign._id.toString());

  // 1 & 3. Active campaign returns correct outcome fields incl. daysRemaining
  console.log(
    active && active.isCampaignActive === true && active.campaignPlan === "Growth" &&
      active.committedLeads === 50 && active.deliveredLeads === 23 && active.remainingLeads === 27 &&
      typeof active.daysRemaining === "number" && active.daysRemaining >= 9 && active.daysRemaining <= 10
      ? "PASS: active-campaign property returns correct outcome fields + daysRemaining (~10)"
      : `FAIL: active-campaign outcome fields wrong: ${JSON.stringify(active)}`
  );

  // Expired campaign clamps daysRemaining to 0, never negative
  console.log(
    expired && expired.daysRemaining === 0
      ? "PASS: overdue campaign clamps daysRemaining to 0 (not negative)"
      : `FAIL: overdue campaign daysRemaining wrong: ${expired && expired.daysRemaining}`
  );

  // 4. No active campaign -> daysRemaining null/absent, campaignPlan null
  console.log(
    noCampaign && noCampaign.isCampaignActive === false && noCampaign.campaignPlan === null &&
      (noCampaign.daysRemaining === null || noCampaign.daysRemaining === undefined)
      ? "PASS: no-campaign property has null campaignPlan and null/absent daysRemaining"
      : `FAIL: no-campaign property wrong: ${JSON.stringify(noCampaign)}`
  );

  // 2. Raw activeCampaign / admin-only Campaign fields must NEVER appear anywhere in the response
  const hasActiveCampaignKey = body.properties.some((p) => Object.prototype.hasOwnProperty.call(p, "activeCampaign"));
  const leaksSecretNote = raw.includes("SECRET_ADMIN_NOTE");
  const leaksAdminFieldNames = ["\"notes\"", "\"activatedBy\"", "\"discountTier\"", "\"paceStatus\""].some((f) => raw.includes(f));

  console.log(!hasActiveCampaignKey ? "PASS: no property in the response carries an 'activeCampaign' key" : "FAIL: raw activeCampaign key present");
  console.log(!leaksSecretNote ? "PASS: admin-only Campaign.notes content is not present anywhere in the response" : "FAIL: admin note leaked!");
  console.log(!leaksAdminFieldNames ? "PASS: no admin-only Campaign field names (notes/activatedBy/discountTier/paceStatus) present in response" : "FAIL: admin field name leaked!");

  // 5. Listings remain permanent — property schema/response carries no expiresAt for the listing itself
  console.log(
    !Object.prototype.hasOwnProperty.call(active, "expiresAt")
      ? "PASS: listing itself carries no expiresAt field (permanent, per Task 3.2 — unchanged)"
      : "FAIL: a listing-level expiresAt field appeared"
  );

  // 6. "New today" count — only today's campaign-linked leads for THAT project
  console.log(
    active && active.newLeadsToday === 2
      ? "PASS: newLeadsToday counts only today's campaign-linked leads for this project (2), excludes yesterday's"
      : `FAIL: active.newLeadsToday = ${active && active.newLeadsToday}`
  );
  console.log(
    noCampaign && noCampaign.newLeadsToday === 0
      ? "PASS: an organic (non-campaign) lead delivered today does not count toward newLeadsToday"
      : `FAIL: noCampaign.newLeadsToday = ${noCampaign && noCampaign.newLeadsToday}`
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: [todayLead1._id, todayLead2._id, yesterdayLead._id, todayOrganicLead._id] } });
  await Property.deleteMany({ _id: { $in: [propWithActiveCampaign._id, propWithExpiredCampaign._id, propWithNoCampaign._id] } });
  await Campaign.deleteMany({ _id: { $in: [activeCampaign._id, expiredCampaign._id] } });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
