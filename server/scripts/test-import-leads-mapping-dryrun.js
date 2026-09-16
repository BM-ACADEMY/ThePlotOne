// Task 8.2 — covers the two additions to importLeads: caller-supplied
// columnMapping and dryRun. test-import-leads.js already covers the
// default-mapping / real-commit path end-to-end; this script does not repeat
// that, it only exercises what's new.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Requirement = require("../models/Requirement");
const CsvImportBatch = require("../models/CsvImportBatch");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Role = require("../models/Role");
const csvImportController = require("../controllers/csvImportController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, params = {}, file, body = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, file, body };
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

const csvBuffer = (text) => ({ originalname: "leads.csv", buffer: Buffer.from(text, "utf8") });

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const adminId = ObjectId();
  const businessType = (await BusinessType.findOne()) || ObjectId();
  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;

  const promoter = await new User({
    name: "Mapping Test Promoter",
    role_id: userRole,
    phone: `9${Date.now()}`.slice(0, 10),
  }).save();

  const plan = await new SubscriptionPlan({
    name: "growth-mapping-test",
    displayName: "Growth",
    businessType,
    price: 24999,
    propertyLimit: -1,
    leadsLimit: 50,
    committedMinimum: 50,
    duration: 30,
  }).save();

  const project = await new Property({
    seller: promoter._id,
    basicInfo: { title: "Mapping Test Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-mapping-${Date.now()}`,
    isCampaignActive: true,
    committedLeads: 50,
  }).save();

  const campaign = await new Campaign({
    promoter: promoter._id,
    project: project._id,
    plan: plan._id,
    committedMinimum: 50,
    deliveredCount: 0,
    status: "active",
    goLiveAt: new Date(),
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  }).save();

  const preExisting = await new Requirement({
    fullName: "Already Here",
    phoneNumber: "9100000001",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    matchedProject: project._id,
  }).save();

  // === Test 1: dryRun with DEFAULT mapping — real validation/dedup, zero persistence ===
  const csvDry = [
    "full_name,phone_number,email,preferred_area,min_budget,max_budget,property_type,usage_type,message",
    "Dry Lead One,9100000002,dry1@example.com,Area1,1000000,2000000,Plot,Residential,First",
    ",9100000003,,,,,,,Missing name — should fail",
    "Dry Dup In Project,9100000001,,,,,,,Duplicate of pre-existing lead",
    "Dry Repeat,9100000004,,,,,,,First occurrence",
    "Dry Repeat Again,9100000004,,,,,,,Same phone again in this file — intra-batch dup",
  ].join("\n");

  const rDry = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csvDry),
    body: { dryRun: "true" },
  });

  console.log(
    rDry.status === 200 &&
      rDry.body.dryRun === true &&
      rDry.body.imported === 2 && // Dry Lead One, Dry Repeat (first occurrence)
      rDry.body.duplicates === 2 && // Dry Dup In Project + Dry Repeat Again
      rDry.body.failed === 1 && // missing name
      rDry.body.total === 5
      ? "PASS: dryRun counts correct (2 imported, 2 duplicates, 1 failed, 5 total)"
      : `FAIL: dryRun counts wrong: ${JSON.stringify(rDry.body)}`
  );

  // Task 4.3 — the preview table's row data
  console.log(
    Array.isArray(rDry.body.previewRows) &&
      rDry.body.previewRows.length === 2 &&
      rDry.body.previewRows[0].fullName === "Dry Lead One" &&
      rDry.body.previewRows[0].phoneNumber === "9100000002" &&
      rDry.body.previewRows[0].preferredLocation === "Area1" &&
      rDry.body.previewRows[0].minBudget === 1000000 &&
      rDry.body.previewRows[0].maxBudget === 2000000
      ? "PASS: dryRun returns previewRows with the mapped data for the importable rows"
      : `FAIL: previewRows wrong: ${JSON.stringify(rDry.body.previewRows)}`
  );

  const noBatchFromDry = await CsvImportBatch.findOne({ campaign: campaign._id });
  console.log(
    !noBatchFromDry ? "PASS: dryRun creates no CsvImportBatch record" : "FAIL: dryRun created a CsvImportBatch"
  );

  const noLeadsFromDry = await Requirement.find({ phoneNumber: { $in: ["9100000002", "9100000004"] } });
  console.log(
    noLeadsFromDry.length === 0 ? "PASS: dryRun creates no Requirement records" : "FAIL: dryRun persisted leads"
  );

  const campaignAfterDry = await Campaign.findById(campaign._id);
  const projectAfterDry = await Property.findById(project._id);
  console.log(
    campaignAfterDry.deliveredCount === 0 && projectAfterDry.deliveredLeads === 0
      ? "PASS: dryRun does not touch Campaign.deliveredCount / Property.deliveredLeads"
      : `FAIL: dryRun mutated counters: campaign=${campaignAfterDry.deliveredCount}, property=${projectAfterDry.deliveredLeads}`
  );

  const noNotifFromDry = await Notification.findOne({ recipient: promoter._id });
  console.log(
    !noNotifFromDry ? "PASS: dryRun sends no notifications" : "FAIL: dryRun sent a notification"
  );

  const noAuditFromDry = await AuditLog.findOne({ reason: { $regex: String(campaign._id) } });
  console.log(!noAuditFromDry ? "PASS: dryRun writes no AuditLog entry" : "FAIL: dryRun wrote an audit entry");

  // === Test 2: custom columnMapping (different headers) incl. the special 'budget' field ===
  const csvCustom = [
    "Name,Mobile,Area,Budget",
    "Custom Lead One,9100000005,CustomArea,1500000",
    "Custom Lead Two,9100000006,CustomArea2,1800000",
  ].join("\n");

  const customMapping = JSON.stringify({
    Name: "fullName",
    Mobile: "phoneNumber",
    Area: "preferredLocation",
    Budget: "budget", // should set BOTH minBudget and maxBudget
  });

  const rCustom = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csvCustom),
    body: { columnMapping: customMapping },
  });

  console.log(
    rCustom.status === 200 && rCustom.body.imported === 2
      ? "PASS: custom columnMapping imports both rows"
      : `FAIL: custom mapping import wrong: ${JSON.stringify(rCustom.body)}`
  );

  const customLead = await Requirement.findOne({ phoneNumber: "9100000005" });
  console.log(
    customLead &&
      customLead.fullName === "Custom Lead One" &&
      customLead.preferredLocation === "CustomArea" &&
      customLead.minBudget === 1500000 &&
      customLead.maxBudget === 1500000
      ? "PASS: custom columnMapping maps arbitrary headers, and 'budget' target sets both min/max"
      : `FAIL: custom mapping fields wrong: ${JSON.stringify(customLead)}`
  );

  // === Test 3: malformed columnMapping falls back to the default map (backward compatible) ===
  const csvFallback = ["full_name,phone_number", "Fallback Lead,9100000007"].join("\n");
  const rFallback = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csvFallback),
    body: { columnMapping: "{not valid json" },
  });
  console.log(
    rFallback.status === 200 && rFallback.body.imported === 1
      ? "PASS: malformed columnMapping falls back to the default map instead of erroring"
      : `FAIL: malformed mapping not handled: ${JSON.stringify(rFallback.body)}`
  );

  // === Test 4: dryRun on a file, then a real (non-dry) import of the SAME file
  // must import the SAME rows — the dry run must not have consumed/altered anything ===
  const csvReplay = ["full_name,phone_number", "Replay Lead,9100000008"].join("\n");
  const rReplayDry = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csvReplay),
    body: { dryRun: "true" },
  });
  const rReplayReal = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csvReplay),
    body: {},
  });
  console.log(
    rReplayDry.body.imported === 1 && rReplayReal.body.imported === 1 && rReplayReal.body.success === true
      ? "PASS: a dryRun preview does not affect the real import that follows for the same file"
      : `FAIL: replay mismatch: dry=${JSON.stringify(rReplayDry.body)} real=${JSON.stringify(rReplayReal.body)}`
  );

  // Cleanup
  const allLeadPhones = [
    "9100000002",
    "9100000003",
    "9100000004",
    "9100000005",
    "9100000006",
    "9100000007",
    "9100000008",
  ];
  await Requirement.deleteMany({ _id: preExisting._id });
  await Requirement.deleteMany({ phoneNumber: { $in: allLeadPhones }, matchedProject: project._id });
  await CsvImportBatch.deleteMany({ campaign: campaign._id });
  await Campaign.deleteOne({ _id: campaign._id });
  await Property.deleteOne({ _id: project._id });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await User.deleteOne({ _id: promoter._id });
  await mongoose.connection.collection("auditlogs").deleteMany({ reason: { $regex: String(campaign._id) } });
  await Notification.deleteMany({ recipient: promoter._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
