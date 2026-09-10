// Point the mailer at a dead host BEFORE any require() triggers dotenv/nodemailer,
// so the (unrelated, pre-existing) "new listing" notification email in
// createProperty fails harmlessly instead of hitting the real inbox.
process.env.EMAIL_HOST = "127.0.0.1";
process.env.EMAIL_PORT = "1";

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
process.env.EMAIL_HOST = "127.0.0.1"; // re-assert after dotenv.config (dotenv won't override, but be safe)
process.env.EMAIL_PORT = "1";

const User = require("../models/User");
const Role = require("../models/Role");
const BusinessType = require("../models/BusinessType");
const Property = require("../models/Property");
const propertyController = require("../controllers/propertyController");

function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

function basicPropertyBody(title) {
  return {
    basicInfo: JSON.stringify({
      title,
      category: "Sell/Buy",
      usageType: "Residential",
      propertyType: "Plot",
    }),
    location: JSON.stringify({ city: "Puducherry", locality: "Villianur" }),
    pricing: JSON.stringify({ sell: { price: 1500000 } }),
    specifications: JSON.stringify({}),
    legal: JSON.stringify({}),
    media: JSON.stringify({}),
  };
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const promoterType = await BusinessType.findOne({ name: "Builders / Promoter" });
  const userRole = await Role.findOne({ role_name: "user" });
  if (!promoterType || !userRole) {
    console.log("FAIL: expected seed data (BusinessType 'Builders / Promoter', Role 'user') not found");
    await mongoose.disconnect();
    return;
  }

  // ---- Scenario A: verified promoter should be able to create MANY properties ----
  const verifiedPromoter = await User.create({
    name: "TEST Verified Promoter",
    phone: "9100000001",
    role_id: userRole._id,
    businessType: promoterType._id,
    badgeVerified: true,
  });
  const populatedPromoter = await User.findById(verifiedPromoter._id).populate(["role_id", "businessType"]);

  const createdIds = [];
  const TOTAL_TO_CREATE = 5; // old free-tier Builder limit was 1 — this alone would have failed before

  for (let i = 1; i <= TOTAL_TO_CREATE; i++) {
    const req = {
      user: populatedPromoter,
      body: basicPropertyBody(`TEST Unlimited Listing ${i} - ${Date.now()}`),
      files: null,
      app: { get: () => null },
    };
    const res = mockRes();
    await propertyController.createProperty(req, res);

    if (res.statusCode === 201) {
      createdIds.push(res.body._id);
    } else {
      console.log(`FAIL: property #${i} was rejected -> status ${res.statusCode}, body:`, res.body);
    }
  }

  console.log(
    createdIds.length === TOTAL_TO_CREATE
      ? `PASS: promoter created ${TOTAL_TO_CREATE}/${TOTAL_TO_CREATE} properties with no limit rejection`
      : `FAIL: only ${createdIds.length}/${TOTAL_TO_CREATE} properties were created`
  );

  const actualCount = await Property.countDocuments({ seller: verifiedPromoter._id });
  console.log(
    actualCount === TOTAL_TO_CREATE
      ? `PASS: ${actualCount} properties actually exist in DB for this promoter (old Builder free-tier cap was 1)`
      : `FAIL: DB count (${actualCount}) does not match expected (${TOTAL_TO_CREATE})`
  );

  // ---- Scenario B: unrelated logic — unverified profile is STILL capped at 1 (untouched) ----
  const unverifiedUser = await User.create({
    name: "TEST Unverified Seller",
    phone: "9100000002",
    role_id: userRole._id,
    businessType: promoterType._id,
    badgeVerified: false,
  });
  const populatedUnverified = await User.findById(unverifiedUser._id).populate(["role_id", "businessType"]);

  // First property should succeed
  const req1 = {
    user: populatedUnverified,
    body: basicPropertyBody(`TEST Unverified First - ${Date.now()}`),
    files: null,
    app: { get: () => null },
  };
  const res1 = mockRes();
  await propertyController.createProperty(req1, res1);
  console.log(res1.statusCode === 201 ? "PASS: unverified user's 1st property succeeds" : `FAIL: unverified user's 1st property failed -> ${res1.statusCode}`);
  if (res1.statusCode === 201) createdIds.push(res1.body._id);

  // Second property should be blocked — this rule is UNRELATED to the removed
  // subscription/plan quota and must still be enforced.
  const req2 = {
    user: populatedUnverified,
    body: basicPropertyBody(`TEST Unverified Second - ${Date.now()}`),
    files: null,
    app: { get: () => null },
  };
  const res2 = mockRes();
  await propertyController.createProperty(req2, res2);
  console.log(
    res2.statusCode === 403 && res2.body?.reason === "unverified"
      ? "PASS: unverified user's 2nd property still blocked (badge-verification rule untouched)"
      : `FAIL: unverified-profile restriction no longer enforced -> status ${res2.statusCode}, body: ${JSON.stringify(res2.body)}`
  );

  // ---- Scenario C: admin bypass path still works unaffected ----
  const adminRole = await Role.findOne({ role_name: "admin" });
  if (adminRole) {
    const adminUser = await User.create({
      name: "TEST Admin",
      phone: "9100000003",
      role_id: adminRole._id,
      isSuperAdmin: true,
    });
    const populatedAdmin = await User.findById(adminUser._id).populate(["role_id"]);
    const reqAdmin = {
      user: populatedAdmin,
      body: basicPropertyBody(`TEST Admin Listing - ${Date.now()}`),
      files: null,
      app: { get: () => null },
    };
    const resAdmin = mockRes();
    await propertyController.createProperty(reqAdmin, resAdmin);
    console.log(resAdmin.statusCode === 201 ? "PASS: admin-created property still works" : `FAIL: admin path broke -> ${resAdmin.statusCode}`);
    if (resAdmin.statusCode === 201) createdIds.push(resAdmin.body._id);
    await User.deleteOne({ _id: adminUser._id });
  }

  // Cleanup
  await Property.deleteMany({ _id: { $in: createdIds } });
  await User.deleteMany({ phone: { $in: ["9100000001", "9100000002", "9100000003"] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
