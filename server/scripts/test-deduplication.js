// Task 8.3 — direct unit coverage for checkDuplicate. The import-flow test
// suites (test-import-leads.js, test-import-leads-mapping-dryrun.js) already
// exercise this indirectly; this script isolates the three cases the task
// spec calls out.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Requirement = require("../models/Requirement");
const { checkDuplicate } = require("../utils/deduplication");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const campaignA = ObjectId();
  const campaignB = ObjectId();
  const projectX = ObjectId();
  const projectY = ObjectId();
  const phone = `9${Date.now()}`.slice(0, 10);

  // Check 1 target: same phone already exists in this exact campaign
  const leadInCampaignA = await new Requirement({
    fullName: "Campaign A Lead",
    phoneNumber: phone,
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    campaignId: campaignA,
    matchedProject: projectX,
  }).save();

  const r1 = await checkDuplicate(phone, campaignA, projectX);
  console.log(r1 === true ? "PASS: duplicate detected — same phone, same campaign" : "FAIL: check 1 (same campaign) missed");

  // Check 2 target: same phone, same project, but a DIFFERENT campaign
  const r2 = await checkDuplicate(phone, campaignB, projectX);
  console.log(
    r2 === true
      ? "PASS: duplicate detected — same phone, same project, different campaign"
      : "FAIL: check 2 (same project) missed"
  );

  // Neither check should fire: same phone, but a different project entirely
  const r3 = await checkDuplicate(phone, campaignB, projectY);
  console.log(
    r3 === false
      ? "PASS: not a duplicate — same phone but unrelated project/campaign"
      : "FAIL: false positive across unrelated project"
  );

  // A phone that has never been imported anywhere
  const freshPhone = `8${Date.now()}`.slice(0, 10);
  const r4 = await checkDuplicate(freshPhone, campaignA, projectX);
  console.log(r4 === false ? "PASS: brand-new phone number is not flagged as a duplicate" : "FAIL: false positive on new phone");

  await Requirement.deleteOne({ _id: leadInCampaignA._id });
  console.log("\nCleaned up test data.");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
