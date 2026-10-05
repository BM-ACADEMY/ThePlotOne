const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Role = require("../models/Role");
const BusinessType = require("../models/BusinessType");
const userController = require("../controllers/userController");
const userRoute = require("../routes/userRoute");
const { protect, admin } = require("../middleware/authMiddleware");

const PHONES = {
  superAdmin: "9100000101",
  subAdmin: "9100000102",
  plainCaller: "9100000103",
  newBySuper: "9100000104",
  newBySub: "9100000105",
  existingPlain: "9100000106",
  injected: "9100000107",
  blocked: "9100000108",
};

function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

// Runs the same chain the route uses after `protect`: the `admin` guard, then
// the controller. res.json() without res.status() is Express's default 200.
async function callAsUser(user, handler, body) {
  const req = { user, body, params: {}, query: {} };
  const res = mockRes();
  let passedGuard = false;
  admin(req, res, () => { passedGuard = true; });
  if (passedGuard) await handler(req, res);
  return { status: res.statusCode || 200, body: res.body };
}

function routeGuards(routePath) {
  const layer = userRoute.stack.find((l) => l.route && l.route.path === routePath);
  return layer ? layer.route.stack.map((s) => s.handle) : [];
}

let failures = 0;
function check(condition, passMessage, failMessage) {
  if (condition) {
    console.log(`PASS: ${passMessage}`);
  } else {
    failures++;
    console.log(`FAIL: ${failMessage}`);
  }
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const adminRole = await Role.findOne({ role_name: "admin" });
  const sellerRole = await Role.findOne({ role_name: "seller" });
  const userRole = await Role.findOne({ role_name: "user" });
  const businessType = await BusinessType.findOne({ status: "active" });
  if (!adminRole || !sellerRole || !userRole || !businessType) {
    console.log("FAIL: expected seed data (Roles 'admin'/'seller'/'user', an active BusinessType) not found");
    await mongoose.disconnect();
    return;
  }

  const allPhones = Object.values(PHONES);
  await User.deleteMany({ phone: { $in: allPhones } }); // leftovers from an interrupted run
  const touchedIds = [];

  try {
    const superAdmin = await User.create({ name: "TEST Super Admin", phone: PHONES.superAdmin, role_id: adminRole._id, isSuperAdmin: true, isVerified: true });
    const subAdmin = await User.create({ name: "TEST Sub Admin", phone: PHONES.subAdmin, role_id: adminRole._id, isVerified: true });
    const plainCaller = await User.create({ name: "TEST Plain Caller", phone: PHONES.plainCaller, role_id: userRole._id, isVerified: true });
    const [popSuper, popSub, popPlain] = await Promise.all(
      [superAdmin, subAdmin, plainCaller].map((u) => User.findById(u._id).populate(["role_id", "businessType"]))
    );
    touchedIds.push(superAdmin._id, subAdmin._id, plainCaller._id);

    const sellerBody = (phone, extra = {}) => ({
      name: "TEST Created Seller",
      phone,
      businessType: String(businessType._id),
      ...extra,
    });

    // ---- Route wiring: both routes must sit behind protect + admin ----
    for (const routePath of ["/create-seller-by-admin", "/create-user-by-admin"]) {
      const guards = routeGuards(routePath);
      check(
        guards[0] === protect && guards[1] === admin,
        `${routePath} is registered behind protect + admin`,
        `${routePath} is not registered behind protect + admin`
      );
    }

    // ---- Case 1: Admin creates a seller -> 201, role = seller, createdBy set ----
    let r = await callAsUser(popSuper, userController.createSellerByAdmin, sellerBody(PHONES.newBySuper));
    let doc = await User.findOne({ phone: PHONES.newBySuper }).populate("role_id");
    if (doc) touchedIds.push(doc._id);
    check(
      r.status === 201 && r.body?.status === "created" && doc?.role_id?.role_name === "seller" &&
        String(doc?.createdBy) === String(superAdmin._id) && doc?.isVerified === true && /^USER-[0-9A-F]{6}$/.test(doc?.customId || ""),
      "admin creates a seller -> 201, role = seller, createdBy = acting admin, isVerified, customId USER-XXXXXX",
      `admin create -> status ${r.status}, body: ${JSON.stringify(r.body)}, role: ${doc?.role_id?.role_name}, createdBy: ${doc?.createdBy}`
    );

    // ---- Case 2: Non-admin calls the route -> 403 ----
    r = await callAsUser(popPlain, userController.createSellerByAdmin, sellerBody(PHONES.blocked));
    check(
      r.status === 403 && !(await User.exists({ phone: PHONES.blocked })),
      "non-admin calls create-seller-by-admin -> 403, nothing created",
      `non-admin create-seller -> status ${r.status}, body: ${JSON.stringify(r.body)}`
    );

    // ---- Case 3: Phone of an existing seller -> rejected ----
    r = await callAsUser(popSuper, userController.createSellerByAdmin, sellerBody(PHONES.newBySuper));
    check(
      r.status === 400 && r.body?.error === "A seller already exists with this phone number" &&
        (await User.countDocuments({ phone: PHONES.newBySuper })) === 1,
      "phone of an existing seller -> 400, no duplicate created",
      `existing seller phone -> status ${r.status}, body: ${JSON.stringify(r.body)}`
    );

    // ---- Case 4: Phone of an existing plain user -> promoted ----
    const existingPlain = await User.create({ name: "User", phone: PHONES.existingPlain, role_id: userRole._id });
    touchedIds.push(existingPlain._id);
    r = await callAsUser(popSuper, userController.createSellerByAdmin, sellerBody(PHONES.existingPlain));
    doc = await User.findById(existingPlain._id).populate("role_id");
    check(
      r.status === 200 && r.body?.status === "promoted" && doc?.role_id?.role_name === "seller" &&
        String(doc?.businessType) === String(businessType._id) && String(doc?.createdBy) === String(superAdmin._id) &&
        (await User.countDocuments({ phone: PHONES.existingPlain })) === 1,
      "phone of an existing plain user -> 200 promoted, same record now a seller with business type and acting admin",
      `promotion -> status ${r.status}, body: ${JSON.stringify(r.body)}, role: ${doc?.role_id?.role_name}`
    );

    // ---- Case 5: Sub-admin creates a seller -> auto-assigned to that sub-admin ----
    r = await callAsUser(popSub, userController.createSellerByAdmin, sellerBody(PHONES.newBySub, { assignedAdmin: String(superAdmin._id) }));
    doc = await User.findOne({ phone: PHONES.newBySub });
    if (doc) touchedIds.push(doc._id);
    check(
      r.status === 201 && String(doc?.assignedAdmin) === String(subAdmin._id) && String(doc?.createdBy) === String(subAdmin._id),
      "sub-admin creates a seller -> auto-assigned to that sub-admin (assignedAdmin in the request ignored)",
      `sub-admin create -> status ${r.status}, assignedAdmin: ${doc?.assignedAdmin}, expected ${subAdmin._id}`
    );

    // ---- Case 6: Role / Super Admin flag sent in the request -> ignored ----
    r = await callAsUser(popSub, userController.createSellerByAdmin, sellerBody(PHONES.injected, {
      role_id: String(adminRole._id),
      isSuperAdmin: true,
      permissions: ["/admin/users"],
    }));
    doc = await User.findOne({ phone: PHONES.injected }).populate("role_id");
    if (doc) touchedIds.push(doc._id);
    check(
      r.status === 201 && doc?.role_id?.role_name === "seller" && doc?.isSuperAdmin === false && doc?.permissions?.length === 0,
      "role_id / isSuperAdmin / permissions sent in the request -> ignored (seller, not Super Admin, no permissions)",
      `injection -> status ${r.status}, role: ${doc?.role_id?.role_name}, isSuperAdmin: ${doc?.isSuperAdmin}, permissions: ${JSON.stringify(doc?.permissions)}`
    );

    // ---- Case 7: Non-admin calls create-user-by-admin -> 403 (Task 1.1) ----
    r = await callAsUser(popPlain, userController.createUserByAdmin, { name: "TEST Blocked", phone: PHONES.blocked, role_id: String(adminRole._id) });
    check(
      r.status === 403 && !(await User.exists({ phone: PHONES.blocked })),
      "non-admin calls create-user-by-admin -> 403, nothing created",
      `non-admin create-user -> status ${r.status}, body: ${JSON.stringify(r.body)}`
    );
  } finally {
    // Cleanup. AuditLog is append-only at the model level, so the entries this
    // run wrote are removed via the raw collection (same as test-audit-log.js).
    await mongoose.connection.db.collection("auditlogs").deleteMany({
      $or: [{ actor: { $in: touchedIds } }, { entityId: { $in: touchedIds } }],
    });
    await User.deleteMany({ phone: { $in: allPhones } });
    console.log("\nCleaned up test data.");
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`);
  if (failures > 0) process.exitCode = 1;
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
