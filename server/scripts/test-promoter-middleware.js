const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const { isPromoter } = require("../middleware/promoterMiddleware");

function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const promoterType = await BusinessType.findOne({ name: "Builders / Promoter" });
  const agentType = await BusinessType.findOne({ name: "Agent" });
  const sellerRole = await Role.findOne({ role_name: "seller" });

  if (!promoterType || !agentType || !sellerRole) {
    console.log("FAIL: expected seed data (BusinessTypes / 'seller' Role) not found");
    await mongoose.disconnect();
    return;
  }

  const promoterUser = await User.create({
    name: "TEST Promoter",
    phone: "9000000001",
    role_id: sellerRole._id,
    businessType: promoterType._id,
  });
  const agentUser = await User.create({
    name: "TEST Agent",
    phone: "9000000002",
    role_id: sellerRole._id,
    businessType: agentType._id,
  });
  const noTypeUser = await User.create({
    name: "TEST NoType",
    phone: "9000000003",
    role_id: sellerRole._id,
  });

  // 1. Promoter user should pass through (next() called, no response sent)
  {
    const req = { user: { _id: promoterUser._id } };
    const res = mockRes();
    let nextCalled = false;
    await isPromoter(req, res, () => { nextCalled = true; });
    console.log(
      nextCalled && res.statusCode === null
        ? "PASS: promoter user passes through (next called, no 403)"
        : "FAIL: promoter user was blocked"
    );
  }

  // 2. Agent user should be rejected with 403
  {
    const req = { user: { _id: agentUser._id } };
    const res = mockRes();
    let nextCalled = false;
    await isPromoter(req, res, () => { nextCalled = true; });
    console.log(
      !nextCalled && res.statusCode === 403 && res.body.message === "Promoter access only"
        ? "PASS: agent user rejected with 403 'Promoter access only'"
        : "FAIL: agent user was not properly rejected"
    );
  }

  // 3. User with no businessType at all should be rejected with 403 (not a crash)
  {
    const req = { user: { _id: noTypeUser._id } };
    const res = mockRes();
    let nextCalled = false;
    let threw = false;
    try {
      await isPromoter(req, res, () => { nextCalled = true; });
    } catch (e) {
      threw = true;
    }
    console.log(
      !threw && !nextCalled && res.statusCode === 403
        ? "PASS: user with no businessType rejected with 403 (no crash)"
        : "FAIL: user with no businessType crashed or was not rejected"
    );
  }

  // 4. Deleted/non-existent user id should be rejected with 403 (not a crash)
  {
    const req = { user: { _id: new mongoose.Types.ObjectId() } };
    const res = mockRes();
    let nextCalled = false;
    let threw = false;
    try {
      await isPromoter(req, res, () => { nextCalled = true; });
    } catch (e) {
      threw = true;
    }
    console.log(
      !threw && !nextCalled && res.statusCode === 403
        ? "PASS: non-existent user id rejected with 403 (no crash)"
        : "FAIL: non-existent user id crashed the middleware"
    );
  }

  // Cleanup
  await User.deleteMany({ phone: { $in: ["9000000001", "9000000002", "9000000003"] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
