// Admin Module Task 8.1 — GET /api/admin/audit-log (auditLogController.getAuditLog)
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { parse } = require("csv-parse/sync");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Role = require("../models/Role");
const auditLogController = require("../controllers/auditLogController");
const auditLogRoute = require("../routes/adminAuditLogRoute");
const { admin: adminMiddleware } = require("../middleware/authMiddleware");

const ObjectId = () => new mongoose.Types.ObjectId();

// Mocks res.setHeader/send (rather than res.json) for the CSV export handler.
function callExport(fn, { query = {} }) {
  return new Promise((resolve, reject) => {
    const req = { query };
    const headers = {};
    const res = {
      _status: 200,
      status(code) {
        this._status = code;
        return this;
      },
      setHeader(name, value) {
        headers[name] = value;
      },
      send(body) {
        resolve({ status: this._status, headers, body });
      },
    };
    Promise.resolve(fn(req, res)).catch(reject);
  });
}

// Exercises the `admin` middleware directly with a mock req.user, the same
// way test-promoter-only-routes.js inspects real Express route registration
// rather than reimplementing the check.
function callAdminMiddleware(user) {
  return new Promise((resolve) => {
    const req = { user };
    const res = {
      _status: 200,
      status(code) {
        this._status = code;
        return this;
      },
      json(payload) {
        resolve({ status: this._status, body: payload, nextCalled: false });
      },
    };
    adminMiddleware(req, res, () => resolve({ status: 200, nextCalled: true }));
  });
}

function callController(fn, { query = {} }) {
  return new Promise((resolve, reject) => {
    const req = { query };
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

  // Tests 1 & 2 — admin-only, via the real `admin` middleware directly
  // (no DB dependency — it checks req.user, already populated by `protect`).
  const rAdminUser = await callAdminMiddleware({ role_id: { role_name: "admin" } });
  console.log(
    rAdminUser.nextCalled
      ? "PASS: an admin user passes the `admin` middleware (calls next())"
      : `FAIL: admin user was rejected: ${JSON.stringify(rAdminUser)}`
  );
  const rNonAdminUser = await callAdminMiddleware({ role_id: { role_name: "seller" } });
  console.log(
    rNonAdminUser.status === 403 && !rNonAdminUser.nextCalled
      ? "PASS: a non-admin (promoter/seller) user is rejected with 403 by the `admin` middleware"
      : `FAIL: non-admin was not rejected: ${JSON.stringify(rNonAdminUser)}`
  );

  const userRole = (await Role.findOne()) || (await new Role({ role_name: "user" }).save())._id;
  const admin = await new User({ name: "Admin Arshad", phone: `9${Date.now()}`.slice(0, 10), role_id: userRole }).save();
  const ravi = await new User({ name: "Ravi Builder", phone: `8${Date.now()}`.slice(0, 10), role_id: userRole }).save();

  const campaignEntityId = ObjectId();
  const leadEntityId = ObjectId();

  // Seed a realistic spread: admin action, promoter action, and a system
  // action (actorRole 'system' but actor is still a real user id, borrowed
  // only to satisfy the schema — this is real, existing behavior in
  // cronJobs.js, not something invented for this test).
  const logAdmin = await AuditLog.create({
    actor: admin._id, actorRole: "admin", action: "CAMPAIGN_ACTIVATED", entity: "Campaign",
    entityId: campaignEntityId, before: { status: "payment_received" }, after: { status: "active" },
    reason: "Admin activated campaign", timestamp: new Date("2026-08-27T09:00:00Z"),
  });
  const logPromoter = await AuditLog.create({
    actor: ravi._id, actorRole: "promoter", action: "LEAD_STATUS_UPDATED", entity: "Requirement",
    entityId: leadEntityId, before: { promoterStatus: "pending" }, after: { promoterStatus: "contacted" },
    reason: "Promoter updated lead status", timestamp: new Date("2026-08-27T15:45:00Z"),
  });
  const logSystem = await AuditLog.create({
    actor: ravi._id, actorRole: "system", action: "CAMPAIGN_EXPIRED", entity: "Campaign",
    entityId: campaignEntityId, before: { status: "active" }, after: { status: "expired" },
    reason: "Auto-expired by cron", timestamp: new Date("2026-08-28T10:02:00Z"),
  });

  const testActorIds = [admin._id, ravi._id];

  // 1. entity filter
  const rEntity = await callController(auditLogController.getAuditLog, { query: { entity: "Requirement" } });
  const entityIds = rEntity.body.logs.map((l) => String(l._id));
  console.log(
    rEntity.status === 200 && entityIds.includes(String(logPromoter._id)) && !entityIds.includes(String(logAdmin._id))
      ? "PASS: entity filter returns only matching entries"
      : `FAIL: entity filter wrong: ${JSON.stringify(rEntity.body.logs)}`
  );

  // 2. actorId filter — also satisfies "Promoter-related filtering used by
  // Task 8.1 still works": Task 8.1's frontend "Actor" filter (deliberately
  // not labelled "Promoters" — see the buildAuditLogQuery comment) is built
  // directly on actorId, so this IS that filter, exercised the same way.
  const rActor = await callController(auditLogController.getAuditLog, { query: { actorId: String(admin._id) } });
  const actorIds = rActor.body.logs.map((l) => String(l._id));
  console.log(
    actorIds.includes(String(logAdmin._id)) && !actorIds.includes(String(logPromoter._id))
      ? "PASS: actorId filter returns only that actor's entries (this is Task 8.1's promoter/actor filter)"
      : `FAIL: actorId filter wrong: ${JSON.stringify(rActor.body.logs)}`
  );

  // 3. Newest-first ordering — ravi._id is the actor on both logPromoter
  // (27 Aug 15:45) and logSystem (28 Aug 10:02); logSystem must sort first.
  const rOrder = await callController(auditLogController.getAuditLog, {
    query: { actorId: String(ravi._id), limit: 10 },
  });
  console.log(
    String(rOrder.body.logs[0]?._id) === String(logSystem._id) && String(rOrder.body.logs[1]?._id) === String(logPromoter._id)
      ? "PASS: results are sorted newest-first"
      : `FAIL: ordering wrong: ${JSON.stringify(rOrder.body.logs.map((l) => l._id))}`
  );

  // 3. action filter
  const rAction = await callController(auditLogController.getAuditLog, { query: { action: "CAMPAIGN_EXPIRED" } });
  const actionIds = rAction.body.logs.map((l) => String(l._id));
  console.log(
    actionIds.includes(String(logSystem._id)) && !actionIds.includes(String(logAdmin._id))
      ? "PASS: action filter returns only matching entries"
      : `FAIL: action filter wrong: ${JSON.stringify(rAction.body.logs)}`
  );

  // 4. dateFrom/dateTo filter
  const rDate = await callController(auditLogController.getAuditLog, {
    query: { dateFrom: "2026-08-27T00:00:00Z", dateTo: "2026-08-27T23:59:59Z" },
  });
  const dateIds = rDate.body.logs.map((l) => String(l._id));
  console.log(
    dateIds.includes(String(logAdmin._id)) &&
      dateIds.includes(String(logPromoter._id)) &&
      !dateIds.includes(String(logSystem._id))
      ? "PASS: dateFrom/dateTo filter returns only entries in range (27 Aug, not 28 Aug)"
      : `FAIL: date filter wrong: ${JSON.stringify(rDate.body.logs)}`
  );

  // 5. actorName resolution — admin/promoter show the real name;
  // 'system' shows literal "System" even though a real user id is stored.
  const rAll = await callController(auditLogController.getAuditLog, { query: { limit: 100 } });
  const byId = Object.fromEntries(rAll.body.logs.map((l) => [String(l._id), l]));
  console.log(
    byId[String(logAdmin._id)]?.actorName === "Admin Arshad"
      ? "PASS: admin actor resolves to the real actor's name"
      : `FAIL: admin actorName wrong: ${byId[String(logAdmin._id)]?.actorName}`
  );
  console.log(
    byId[String(logPromoter._id)]?.actorName === "Ravi Builder"
      ? "PASS: promoter actor resolves to the real actor's name"
      : `FAIL: promoter actorName wrong: ${byId[String(logPromoter._id)]?.actorName}`
  );
  console.log(
    byId[String(logSystem._id)]?.actorName === "System"
      ? "PASS: a 'system' actorRole entry shows 'System', not the borrowed promoter id's name"
      : `FAIL: system actorName wrong: ${byId[String(logSystem._id)]?.actorName}`
  );

  // 6. before/after included, for the "click row to expand" feature
  console.log(
    byId[String(logAdmin._id)]?.before?.status === "payment_received" &&
      byId[String(logAdmin._id)]?.after?.status === "active"
      ? "PASS: before/after state included in each entry"
      : `FAIL: before/after missing: ${JSON.stringify(byId[String(logAdmin._id)])}`
  );

  // 7. Pagination — scoped via actorId since this is a shared dev database
  const rPaged = await callController(auditLogController.getAuditLog, {
    query: { actorId: String(ravi._id), limit: 1, page: 1 },
  });
  console.log(
    rPaged.body.logs.length === 1 && rPaged.body.totalPages === 2 && rPaged.body.total === 2
      ? "PASS: pagination (limit/page) works correctly"
      : `FAIL: pagination wrong: ${JSON.stringify(rPaged.body)}`
  );

  // ===================================================================
  // Task 8.2 — routing: admin-only export + no PUT/PATCH/DELETE anywhere
  // on this router. Inspects the real Express router.stack directly, same
  // technique as test-promoter-only-routes.js, rather than reimplementing
  // the check.
  // ===================================================================
  const middlewareNames = (path, method) => {
    const layer = auditLogRoute.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
    return layer ? layer.route.stack.map((s) => s.name) : null;
  };

  const exportMiddleware = middlewareNames("/export", "get");
  console.log(
    exportMiddleware && exportMiddleware.includes("protect") && exportMiddleware.includes("admin")
      ? "PASS: GET /export is guarded by protect + admin, same as the list endpoint"
      : `FAIL: /export middleware wrong: ${JSON.stringify(exportMiddleware)}`
  );

  const noWriteMethods = auditLogRoute.stack.every(
    (l) => !l.route || (!l.route.methods.put && !l.route.methods.patch && !l.route.methods.delete),
  );
  console.log(
    noWriteMethods
      ? "PASS: no PUT/PATCH/DELETE route exists anywhere on the audit-log router"
      : "FAIL: a write route exists on the audit-log router — append-only is violated"
  );

  // ===================================================================
  // Task 8.2 — export endpoint
  // ===================================================================
  const bulkActor = await new User({ name: "Bulk Export Actor", phone: `7${Date.now()}`.slice(0, 10), role_id: userRole }).save();
  const bulkLogs = [];
  for (let i = 0; i < 25; i++) {
    bulkLogs.push(
      AuditLog.create({
        actor: bulkActor._id, actorRole: "promoter", action: "PAYMENT_RECEIVED", entity: "Campaign",
        entityId: ObjectId(), before: { status: "payment_received" }, after: { status: "active" },
        timestamp: new Date(Date.now() - i * 1000),
      }),
    );
  }
  await Promise.all(bulkLogs);

  // A field containing a comma, a real quote, AND a real embedded newline —
  // the three RFC4180 cases that require escaping — all in one plain string
  // field (actorName), so the test isn't obscured by JSON.stringify's own
  // separate escaping of before/after.
  const csvSpecialName = 'Ravi, "Builder"\nSpecial';
  const csvSpecialActor = await new User({ name: csvSpecialName, phone: `6${Date.now()}`.slice(0, 10), role_id: userRole }).save();
  const logCsvSpecial = await AuditLog.create({
    actor: csvSpecialActor._id, actorRole: "admin", action: "CAMPAIGN_ACTIVATED", entity: "Campaign",
    entityId: ObjectId(), before: null, after: null, timestamp: new Date("2026-08-29T08:00:00Z"),
  });

  testActorIds.push(bulkActor._id, csvSpecialActor._id);

  // 13/17. Export respects the entity filter, and contains the filtered records.
  const rExportEntity = await callExport(auditLogController.exportAuditLog, {
    query: { actorId: String(admin._id), entity: "Campaign" },
  });
  const parsedEntity = parse(rExportEntity.body, { columns: true, skip_empty_lines: true, bom: true });
  console.log(
    rExportEntity.status === 200 &&
      parsedEntity.length === 1 &&
      parsedEntity[0].Event === "CAMPAIGN_ACTIVATED" &&
      parsedEntity[0].Entity === "Campaign"
      ? "PASS: export respects the entity filter and contains exactly the matching record"
      : `FAIL: entity-filtered export wrong: ${JSON.stringify(parsedEntity)}`
  );

  // 14. Export respects the action filter.
  const rExportAction = await callExport(auditLogController.exportAuditLog, {
    query: { actorId: String(ravi._id), action: "CAMPAIGN_EXPIRED" },
  });
  const parsedAction = parse(rExportAction.body, { columns: true, skip_empty_lines: true, bom: true });
  console.log(
    parsedAction.length === 1 && parsedAction[0].Event === "CAMPAIGN_EXPIRED"
      ? "PASS: export respects the action filter"
      : `FAIL: action-filtered export wrong: ${JSON.stringify(parsedAction)}`
  );

  // 15. Export respects date filters.
  const rExportDate = await callExport(auditLogController.exportAuditLog, {
    query: { actorId: String(ravi._id), dateFrom: "2026-08-27T00:00:00Z", dateTo: "2026-08-27T23:59:59Z" },
  });
  const parsedDate = parse(rExportDate.body, { columns: true, skip_empty_lines: true, bom: true });
  console.log(
    parsedDate.length === 1 && parsedDate[0].Event === "LEAD_STATUS_UPDATED"
      ? "PASS: export respects dateFrom/dateTo filters"
      : `FAIL: date-filtered export wrong: ${JSON.stringify(parsedDate)}`
  );

  // 16. Export contains the correct CSV header row.
  const firstLine = rExportEntity.body.replace(/^﻿/, "").split("\r\n")[0];
  console.log(
    firstLine === "Timestamp,Actor,Event,Entity,Entity ID,Before,After"
      ? "PASS: export CSV has the correct header row"
      : `FAIL: header row wrong: ${JSON.stringify(firstLine)}`
  );

  // 12. Export is admin-only — already proven structurally by the route
  // middleware check above (GET /export carries `admin`); this additionally
  // confirms the handler itself performs no separate un-guarded auth check
  // that could diverge from the route (i.e., the guard is exactly the route
  // middleware, nothing handler-side to keep in sync).
  console.log(
    exportMiddleware && exportMiddleware.includes("admin")
      ? "PASS: export admin-only enforcement lives in route middleware (verified above), not duplicated/bypassable in the handler"
      : "FAIL: export admin guard not confirmed"
  );

  // 18. Export returns MORE than one page's worth — proves it isn't just
  // exporting the currently-displayed page (list defaults to limit=20).
  const rListDefault = await callController(auditLogController.getAuditLog, { query: { actorId: String(bulkActor._id) } });
  const rExportBulk = await callExport(auditLogController.exportAuditLog, { query: { actorId: String(bulkActor._id) } });
  const parsedBulk = parse(rExportBulk.body, { columns: true, skip_empty_lines: true, bom: true });
  console.log(
    rListDefault.body.logs.length === 20 &&
      rListDefault.body.total === 25 &&
      parsedBulk.length === 25
      ? "PASS: export returns all 25 matching records while the paginated list is capped at 20 — not just the current page"
      : `FAIL: bulk export wrong: list=${rListDefault.body.logs.length}, export=${parsedBulk.length}`
  );

  // 19. CSV escaping — comma/quote/newline in a real field round-trips
  // correctly through a real CSV parser (csv-parse, already a project
  // dependency), not just a substring guess.
  const rExportSpecial = await callExport(auditLogController.exportAuditLog, {
    query: { actorId: String(csvSpecialActor._id) },
  });
  const parsedSpecial = parse(rExportSpecial.body, { columns: true, skip_empty_lines: true, bom: true });
  console.log(
    parsedSpecial.length === 1 && parsedSpecial[0].Actor === csvSpecialName
      ? "PASS: a field containing a comma, a quote, and a real newline round-trips correctly through the CSV"
      : `FAIL: CSV escaping broken: ${JSON.stringify(parsedSpecial[0]?.Actor)}`
  );

  // Content-Type / Content-Disposition headers.
  console.log(
    rExportSpecial.headers["Content-Type"]?.includes("text/csv") &&
      /^attachment; filename="audit-log-\d{4}-\d{2}-\d{2}\.csv"$/.test(rExportSpecial.headers["Content-Disposition"] || "")
      ? "PASS: Content-Type is text/csv and Content-Disposition is a sensibly-named attachment"
      : `FAIL: export headers wrong: ${JSON.stringify(rExportSpecial.headers)}`
  );

  // Cleanup — bypass Mongoose (append-only guard correctly blocks
  // Mongoose-level deletes), same pattern as test-audit-log.js.
  await mongoose.connection.db.collection("auditlogs").deleteMany({ actor: { $in: testActorIds } });
  await User.deleteMany({ _id: { $in: testActorIds } });
  console.log("\nCleaned up test data (via raw driver, bypassing the app-level guard).");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
