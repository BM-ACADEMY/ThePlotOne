const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Requirement = require("../models/Requirement");
const leadController = require("../controllers/leadController");

const ObjectId = () => new mongoose.Types.ObjectId();

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

  const promoterId = ObjectId();
  const otherPromoterId = ObjectId();

  const projectA = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Villianur Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    location: { locality: "Villianur" },
    slug: `test-myleads-a-${Date.now()}`,
  }).save();

  const projectB = await new Property({
    seller: promoterId,
    basicInfo: { title: "TEST Bahour Layout", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    location: { locality: "Bahour" },
    slug: `test-myleads-b-${Date.now()}`,
  }).save();

  const otherProject = await new Property({
    seller: otherPromoterId,
    basicInfo: { title: "TEST Someone Else's Project", category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `test-myleads-other-${Date.now()}`,
  }).save();

  const leadA1 = await new Requirement({
    fullName: "Ramesh Kumar",
    phoneNumber: "9876543210",
    email: "ramesh@example.com",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    preferredLocation: "Villianur",
    minBudget: 2500000,
    maxBudget: 3500000,
    message: "Looking for 30x40 corner plot",
    source: "meta_ad",
    tier: "tier1",
    matchedProject: projectA._id,
    promoterStatus: "pending",
    deliveredAt: new Date(Date.now() - 60000),
  }).save();

  const leadA2 = await new Requirement({
    fullName: "Priya S",
    phoneNumber: "9765432109",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    preferredLocation: "Villianur",
    source: "website",
    tier: "tier2",
    matchedProject: projectA._id,
    promoterStatus: "contacted",
    promoterNotes: "Called, interested",
    deliveredAt: new Date(),
  }).save();

  const leadB1 = await new Requirement({
    fullName: "Kumar Raj",
    phoneNumber: "9654321098",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    preferredLocation: "Bahour",
    source: "call",
    tier: "tier1",
    matchedProject: projectB._id,
    promoterStatus: "pending",
    deliveredAt: new Date(),
  }).save();

  const leadOther = await new Requirement({
    fullName: "Not Mine",
    phoneNumber: "9111111111",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    matchedProject: otherProject._id,
    promoterStatus: "pending",
  }).save();

  // 1. All leads across all of this promoter's projects — must NOT include the other promoter's lead
  const rAll = await callController(leadController.getMyLeads, { user: { _id: promoterId } });
  console.log(
    rAll.status === 200 && rAll.body.total === 3 && rAll.body.leads.length === 3
      ? "PASS: returns exactly the 3 leads belonging to this promoter's projects"
      : `FAIL: wrong lead set: ${JSON.stringify(rAll.body)}`
  );
  const ids = rAll.body.leads.map((l) => String(l._id));
  console.log(
    !ids.includes(String(leadOther._id))
      ? "PASS: another promoter's lead is not included"
      : "FAIL: leaked another promoter's lead"
  );

  // 2. Response shape matches the task's exact spec
  const first = rAll.body.leads.find((l) => String(l._id) === String(leadA1._id));
  console.log(
    first &&
      first.fullName === "Ramesh Kumar" &&
      first.phoneNumber === "9876543210" &&
      first.email === "ramesh@example.com" &&
      first.preferredLocation === "Villianur" &&
      first.minBudget === 2500000 &&
      first.maxBudget === 3500000 &&
      first.propertyType === "Plot" &&
      first.usageType === "Residential" &&
      first.source === "meta_ad" &&
      first.tier === "tier1" &&
      first.promoterStatus === "pending" &&
      first.matchedProject &&
      first.matchedProject.title === "TEST Villianur Layout" &&
      first.matchedProject.locality === "Villianur"
      ? "PASS: response shape matches spec exactly, including matchedProject: {title, locality}"
      : `FAIL: response shape wrong: ${JSON.stringify(first)}`
  );

  // 3. projectId filter — only leads for that project
  const rProjectA = await callController(leadController.getMyLeads, {
    user: { _id: promoterId },
    query: { projectId: String(projectA._id) },
  });
  console.log(
    rProjectA.status === 200 && rProjectA.body.total === 2
      ? "PASS: projectId filter returns only that project's leads (2)"
      : `FAIL: projectId filter wrong: ${JSON.stringify(rProjectA.body)}`
  );

  // 4. status filter
  const rContacted = await callController(leadController.getMyLeads, {
    user: { _id: promoterId },
    query: { status: "contacted" },
  });
  console.log(
    rContacted.status === 200 && rContacted.body.total === 1 && rContacted.body.leads[0].fullName === "Priya S"
      ? "PASS: status filter returns only 'contacted' leads"
      : `FAIL: status filter wrong: ${JSON.stringify(rContacted.body)}`
  );

  // 5. Requesting a project that belongs to someone else must be rejected
  const rForbidden = await callController(leadController.getMyLeads, {
    user: { _id: promoterId },
    query: { projectId: String(otherProject._id) },
  });
  console.log(
    rForbidden.status === 403
      ? "PASS: filtering by a project you don't own is rejected"
      : `FAIL: ownership not enforced on projectId filter: ${JSON.stringify(rForbidden)}`
  );

  // 6. Pagination
  const rPaged = await callController(leadController.getMyLeads, {
    user: { _id: promoterId },
    query: { limit: 1, page: 1 },
  });
  console.log(
    rPaged.body.leads.length === 1 && rPaged.body.totalPages === 3 && rPaged.body.total === 3
      ? "PASS: pagination (limit/page) works correctly"
      : `FAIL: pagination wrong: ${JSON.stringify(rPaged.body)}`
  );

  // Cleanup
  await Requirement.deleteMany({ _id: { $in: [leadA1._id, leadA2._id, leadB1._id, leadOther._id] } });
  await Property.deleteMany({ _id: { $in: [projectA._id, projectB._id, otherProject._id] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
