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

function callController(fn, { user, params = {}, file }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, file };
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

  const promoter = await new User({ name: "Ravi Builder", role_id: userRole, phone: `9${Date.now()}`.slice(0, 10) }).save();

  const plan = await new SubscriptionPlan({
    name: "growth-import-test", displayName: "Growth", businessType,
    price: 24999, propertyLimit: -1, leadsLimit: 50, committedMinimum: 5, duration: 30, // small commitment for easy limit testing
  }).save();

  const project = await new Property({
    seller: promoter._id,
    basicInfo: { title: "Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-import-${Date.now()}`,
    isCampaignActive: true,
    committedLeads: 5,
  }).save();

  const campaign = await new Campaign({
    promoter: promoter._id, project: project._id, plan: plan._id,
    committedMinimum: 5, deliveredCount: 0, status: "active",
    goLiveAt: new Date(), expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  }).save();

  const otherProject = await new Property({
    seller: promoter._id,
    basicInfo: { title: "Other Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-import-other-${Date.now()}`,
  }).save();

  // Pre-existing lead for cross-batch, same-project duplicate testing
  const preExisting = await new Requirement({
    fullName: "Already Here", phoneNumber: "9000000001",
    category: "Sell/Buy", usageType: "Residential", propertyType: "Plot",
    matchedProject: project._id,
  }).save();

  // === Test 1: happy path with a mix of valid, invalid, duplicate, and
  // intra-batch-duplicate rows ===
  const csv1 = [
    "full_name,phone_number,email,preferred_area,min_budget,max_budget,property_type,usage_type,message",
    "Ramesh Kumar,9000000002,ramesh@example.com,Villianur,2500000,3500000,Plot,Residential,Looking for corner plot",
    "Priya S,9000000003,,,,,,,Interested urgently",
    ",9000000004,,,,,,,Missing name",
    "No Phone Guy,12345,,,,,,,Bad phone",
    "Dup In Project,9000000001,,,,,,,Already exists in this project",
    "Repeat Row,9000000005,,,,,,,First occurrence",
    "Repeat Row Again,9000000005,,,,,,,Same phone again in this file",
  ].join("\n");

  const r1 = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csv1),
  });

  console.log(
    r1.status === 200 &&
      r1.body.imported === 3 && // Ramesh, Priya, Repeat Row (first occurrence only)
      r1.body.duplicates === 2 && // Dup In Project + Repeat Row Again
      r1.body.failed === 2 && // missing name + bad phone
      r1.body.total === 7
      ? "PASS: import counts correct (3 imported, 2 duplicates, 2 failed, 7 total)"
      : `FAIL: counts wrong: ${JSON.stringify(r1.body)}`
  );

  const importedLead = await Requirement.findOne({ phoneNumber: "9000000002" });
  console.log(
    importedLead &&
      importedLead.fullName === "Ramesh Kumar" &&
      importedLead.email === "ramesh@example.com" &&
      importedLead.preferredLocation === "Villianur" &&
      importedLead.minBudget === 2500000 &&
      importedLead.maxBudget === 3500000 &&
      importedLead.propertyType === "Plot" &&
      importedLead.usageType === "Residential" &&
      importedLead.category === "Sell/Buy" &&
      String(importedLead.campaignId) === String(campaign._id) &&
      String(importedLead.matchedProject) === String(project._id) &&
      importedLead.tier === "tier1" &&
      importedLead.source === "meta_ad" &&
      importedLead.promoterStatus === "pending" &&
      importedLead.deliveredAt
      ? "PASS: created Requirement has every field mapped/set correctly (incl. category inherited from project)"
      : `FAIL: lead fields wrong: ${JSON.stringify(importedLead)}`
  );

  const rowWithFallback = await Requirement.findOne({ phoneNumber: "9000000003" });
  console.log(
    rowWithFallback && rowWithFallback.propertyType === "Plot" && rowWithFallback.usageType === "Residential"
      ? "PASS: a row omitting property_type/usage_type falls back to the project's own values"
      : `FAIL: fallback wrong: ${JSON.stringify(rowWithFallback)}`
  );

  const repeatRows = await Requirement.find({ phoneNumber: "9000000005" });
  console.log(
    repeatRows.length === 1 && repeatRows[0].fullName === "Repeat Row"
      ? "PASS: intra-batch duplicate (same phone twice in one file) only creates one lead — the first"
      : `FAIL: intra-batch dedup wrong: ${JSON.stringify(repeatRows)}`
  );

  const campaignAfter1 = await Campaign.findById(campaign._id);
  const projectAfter1 = await Property.findById(project._id);
  console.log(
    campaignAfter1.deliveredCount === 3 && projectAfter1.deliveredLeads === 3
      ? "PASS: Campaign.deliveredCount and Property.deliveredLeads incremented by exactly importedCount (3)"
      : `FAIL: counters wrong: campaign=${campaignAfter1.deliveredCount}, property=${projectAfter1.deliveredLeads}`
  );

  const batch1 = await CsvImportBatch.findOne({ campaign: campaign._id });
  console.log(
    batch1 &&
      batch1.status === "completed" &&
      batch1.imported === 3 &&
      batch1.duplicates === 2 &&
      batch1.failed === 2 &&
      batch1.totalRows === 7 &&
      String(batch1.uploadedBy) === String(adminId)
      ? "PASS: CsvImportBatch record finalized with correct counts and status"
      : "FAIL: CsvImportBatch wrong"
  );

  const auditEntry = await AuditLog.findOne({ action: "LEADS_IMPORTED", entityId: batch1._id });
  console.log(
    auditEntry && auditEntry.after.imported === 3
      ? "PASS: AuditLog LEADS_IMPORTED entry written"
      : "FAIL: audit log missing/wrong"
  );

  const perLeadNotifs = await Notification.find({ recipient: promoter._id, type: "new_lead" });
  console.log(
    perLeadNotifs.length === 3 && perLeadNotifs.every((n) => n.relatedModel === "Requirement" && n.relatedId)
      ? "PASS: one 'new_lead' portal notification per imported lead (3), each linked via relatedId"
      : `FAIL: per-lead notifications wrong: ${perLeadNotifs.length}`
  );

  // Not yet at committedMinimum (5) after 3 delivered — no limit notification yet
  const limitNotifBefore = await Notification.findOne({ recipient: promoter._id, type: "lead_limit_reached" });
  console.log(
    !limitNotifBefore
      ? "PASS: no lead-limit notification yet — 3/5 delivered, below committedMinimum"
      : "FAIL: lead-limit notification fired too early"
  );

  // === Test 2: a second import (2 valid rows) that crosses committedMinimum (3+2=5) ===
  const csv2 = [
    "full_name,phone_number",
    "Fourth Lead,9000000006",
    "Fifth Lead,9000000007",
  ].join("\n");

  const r2 = await callController(csvImportController.importLeads, {
    user: { _id: adminId },
    params: { id: String(campaign._id) },
    file: csvBuffer(csv2),
  });
  console.log(
    r2.status === 200 && r2.body.imported === 2 && r2.body.campaignDelivered === 5 && r2.body.campaignCommitted === 5
      ? "PASS: second import brings deliveredCount to exactly committedMinimum (5/5)"
      : `FAIL: second import wrong: ${JSON.stringify(r2.body)}`
  );

  const promoterLimitNotif = await Notification.findOne({ recipient: promoter._id, type: "lead_limit_reached" });
  console.log(
    promoterLimitNotif && promoterLimitNotif.message.includes("Growth") && promoterLimitNotif.message.includes("Villianur Layout")
      ? "PASS: promoter notified via notifyLeadLimitReached (Task 6.2) once the limit is crossed"
      : "FAIL: promoter lead-limit notification missing/wrong"
  );

  const adminLimitNotif = await Notification.findOne({ type: "admin_lead_limit", message: { $regex: "Villianur Layout" } });
  console.log(
    adminLimitNotif && adminLimitNotif.message.includes("5/5")
      ? "PASS: admin(s) notified via notifyPromoterLeadLimitReached (Task 6.3) with correct X/Y"
      : "FAIL: admin lead-limit notification missing/wrong"
  );

  // === Guard tests ===
  const rNoFile = await callController(csvImportController.importLeads, {
    user: { _id: adminId }, params: { id: String(campaign._id) }, file: undefined,
  });
  console.log(rNoFile.status === 400 ? "PASS: missing file is rejected" : "FAIL: missing file not rejected");

  const draftCampaign = await new Campaign({
    promoter: promoter._id, project: otherProject._id, plan: plan._id, committedMinimum: 5, status: "draft",
  }).save();
  const rNotActive = await callController(csvImportController.importLeads, {
    user: { _id: adminId }, params: { id: String(draftCampaign._id) }, file: csvBuffer(csv2),
  });
  console.log(
    rNotActive.status === 400
      ? "PASS: importing into a non-'active' (draft) campaign is rejected"
      : `FAIL: draft campaign import not rejected: ${JSON.stringify(rNotActive.body)}`
  );

  // A phone existing in a DIFFERENT project must NOT be treated as a duplicate
  const csv3 = ["full_name,phone_number", "Cross Project,9000000001"].join("\n"); // same phone as preExisting, but different project/campaign
  const activeOtherCampaign = await new Campaign({
    promoter: promoter._id, project: otherProject._id, plan: plan._id, committedMinimum: 50, status: "active",
    goLiveAt: new Date(), expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  }).save();
  const r3 = await callController(csvImportController.importLeads, {
    user: { _id: adminId }, params: { id: String(activeOtherCampaign._id) }, file: csvBuffer(csv3),
  });
  console.log(
    r3.status === 200 && r3.body.imported === 1 && r3.body.duplicates === 0
      ? "PASS: a phone number that exists in a DIFFERENT project is not treated as a duplicate"
      : `FAIL: cross-project dedup wrong: ${JSON.stringify(r3.body)}`
  );

  // Cleanup
  const allCampaignIds = [campaign._id, draftCampaign._id, activeOtherCampaign._id];
  const allLeads = await Requirement.find({ matchedProject: { $in: [project._id, otherProject._id] } });
  await Requirement.deleteMany({ _id: { $in: [preExisting._id, ...allLeads.map((l) => l._id)] } });
  await CsvImportBatch.deleteMany({ campaign: { $in: allCampaignIds } });
  await Campaign.deleteMany({ _id: { $in: allCampaignIds } });
  await Property.deleteMany({ _id: { $in: [project._id, otherProject._id] } });
  await SubscriptionPlan.deleteOne({ _id: plan._id });
  await User.deleteOne({ _id: promoter._id });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: batch1._id });
  await Notification.deleteMany({ $or: [{ recipient: promoter._id }, { message: { $regex: "Villianur Layout" } }] });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
