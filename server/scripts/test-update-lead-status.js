const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Requirement = require("../models/Requirement");
const AuditLog = require("../models/AuditLog");
const leadController = require("../controllers/leadController");

const ObjectId = () => new mongoose.Types.ObjectId();

function callController(fn, { user, params = {}, body = {} }) {
  return new Promise((resolve, reject) => {
    const req = { user, params, body };
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

  const promoterId = ObjectId();
  const otherPromoterId = ObjectId();

  const project = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Status Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-status-${Date.now()}`,
  }).save();

  const otherProject = await new Property({
    seller: otherPromoterId,
    basicInfo: { title: "TEST Other Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-status-other-${Date.now()}`,
  }).save();

  const makeLead = async (matchedProject) =>
    new Requirement({
      fullName: "Test Lead",
      phoneNumber: "9999999999",
      category: "Sell/Buy",
      usageType: "Residential",
      propertyType: "Plot",
      matchedProject,
      promoterStatus: "pending",
    }).save();

  const updateStatus = (leadId, promoterStatus, promoterNotes, user = { _id: promoterId }) =>
    callController(leadController.updateMyLeadStatus, {
      user,
      params: { leadId: String(leadId) },
      body: { promoterStatus, promoterNotes },
    });

  // 1. Happy path — full chain pending -> contacted -> site_visit_scheduled -> visited -> interested -> closed_won
  const lead1 = await makeLead(project._id);
  const chain = ["contacted", "site_visit_scheduled", "visited", "interested", "closed_won"];
  let chainOk = true;
  for (const step of chain) {
    const r = await updateStatus(lead1._id, step, `moved to ${step}`);
    if (!(r.status === 200 && r.body.success && r.body.lead.promoterStatus === step)) {
      chainOk = false;
      console.log(`  -> failed at step '${step}': ${JSON.stringify(r.body)}`);
    }
  }
  console.log(chainOk ? "PASS: full happy-path chain pending->...->closed_won succeeds step by step" : "FAIL: happy-path chain broken");

  // 2. Terminal state — closed_won cannot move anywhere else
  const rTerminal = await updateStatus(lead1._id, "contacted", "trying to reopen");
  console.log(
    rTerminal.status === 400 && rTerminal.body.success === false
      ? "PASS: closed_won is terminal — further transition rejected"
      : `FAIL: terminal state not enforced: ${JSON.stringify(rTerminal)}`
  );

  // 3. Branch: contacted -> not_interested -> closed_lost
  const lead2 = await makeLead(project._id);
  await updateStatus(lead2._id, "contacted");
  const rNotInterested = await updateStatus(lead2._id, "not_interested", "not interested");
  const rClosedLost = await updateStatus(lead2._id, "closed_lost");
  console.log(
    rNotInterested.status === 200 && rClosedLost.status === 200 && rClosedLost.body.lead.promoterStatus === "closed_lost"
      ? "PASS: contacted -> not_interested -> closed_lost branch works"
      : `FAIL: not_interested branch broken: ${JSON.stringify(rNotInterested.body)} / ${JSON.stringify(rClosedLost.body)}`
  );

  // 4. Branch: visited -> not_interested -> closed_lost
  const lead3 = await makeLead(project._id);
  await updateStatus(lead3._id, "contacted");
  await updateStatus(lead3._id, "site_visit_scheduled");
  await updateStatus(lead3._id, "visited");
  const rVisitedNotInterested = await updateStatus(lead3._id, "not_interested");
  console.log(
    rVisitedNotInterested.status === 200 && rVisitedNotInterested.body.lead.promoterStatus === "not_interested"
      ? "PASS: visited -> not_interested branch works"
      : `FAIL: visited->not_interested broken: ${JSON.stringify(rVisitedNotInterested.body)}`
  );

  // 5. Invalid skip — pending straight to visited must be rejected
  const lead4 = await makeLead(project._id);
  const rSkip = await updateStatus(lead4._id, "visited");
  console.log(
    rSkip.status === 400 && rSkip.body.success === false
      ? "PASS: skipping straight from pending to visited is rejected"
      : `FAIL: invalid skip not rejected: ${JSON.stringify(rSkip)}`
  );

  // 6. Same-status re-save (notes-only update) is allowed, not treated as invalid transition
  const lead5 = await makeLead(project._id);
  await updateStatus(lead5._id, "contacted", "first note");
  const rResave = await updateStatus(lead5._id, "contacted", "updated note only");
  console.log(
    rResave.status === 200 && rResave.body.lead.promoterNotes === "updated note only"
      ? "PASS: re-saving the same status (notes-only update) is allowed"
      : `FAIL: same-status re-save rejected: ${JSON.stringify(rResave)}`
  );

  // 7. Ownership — a promoter cannot update a lead matched to someone else's project
  const leadOther = await makeLead(otherProject._id);
  const rForbidden = await updateStatus(leadOther._id, "contacted");
  console.log(
    rForbidden.status === 403
      ? "PASS: updating a lead matched to another promoter's project is rejected"
      : `FAIL: ownership not enforced: ${JSON.stringify(rForbidden)}`
  );

  // 8. AuditLog — LEAD_STATUS_UPDATED written with correct before/after
  const auditEntries = await AuditLog.find({ action: "LEAD_STATUS_UPDATED", entityId: lead2._id }).sort({ timestamp: 1 });
  console.log(
    auditEntries.length === 3 &&
      auditEntries[0].before.promoterStatus === "pending" && auditEntries[0].after.promoterStatus === "contacted" &&
      auditEntries[1].before.promoterStatus === "contacted" && auditEntries[1].after.promoterStatus === "not_interested" &&
      auditEntries[2].before.promoterStatus === "not_interested" && auditEntries[2].after.promoterStatus === "closed_lost"
      ? "PASS: AuditLog has one LEAD_STATUS_UPDATED entry per transition, each with correct before/after"
      : `FAIL: audit entries wrong: ${JSON.stringify(auditEntries)}`
  );

  // Cleanup
  const leadIds = [lead1._id, lead2._id, lead3._id, lead4._id, lead5._id, leadOther._id];
  await Requirement.deleteMany({ _id: { $in: leadIds } });
  await Property.deleteMany({ _id: { $in: [project._id, otherProject._id] } });
  await mongoose.connection.collection("auditlogs").deleteMany({ entityId: { $in: leadIds } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
