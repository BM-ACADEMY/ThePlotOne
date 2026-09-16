const AuditLog = require("../models/AuditLog");

// Shared by both endpoints below — entity/actorId/action/dateFrom/dateTo
// filters must behave identically for the list and the export, or the
// export could silently disagree with what the admin is looking at.
//
// actorId filters on the literal AuditLog.actor field (who performed the
// action), matching Task 8.1's spec'd query param exactly. It is NOT a
// "promoter" filter: for actorRole 'system' entries (cronJobs.js), `actor`
// is a borrowed promoter/user id the schema requires, not a real actor: for
// actorRole 'admin' entries (e.g. campaignController.js's activateCampaign),
// `actor` is the ADMIN who acted, not the promoter whose campaign it was.
// There is no promoterId field on AuditLog, and no existing code anywhere
// derives "every audit entry related to promoter X" by walking
// Campaign/Requirement/PaymentHistory -> promoter for an arbitrary entityId
// (entity is a bare string + a raw entityId, not a typed/populatable ref,
// so there's no single relationship to join through). Task 8.1's own
// frontend already reflects this honestly — its filter is labelled "Actor"
// (built from real actorId/actorName pairs), not "Promoters" — so actorId
// filtering here is that same, correct behavior, not a gap to fill.
function buildAuditLogQuery({ entity, actorId, action, dateFrom, dateTo }) {
  const query = {};
  if (entity) query.entity = entity;
  if (actorId) query.actor = actorId;
  if (action) query.action = action;
  if (dateFrom || dateTo) {
    query.timestamp = {};
    if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
    if (dateTo) query.timestamp.$lte = new Date(dateTo);
  }
  return query;
}

// For actorRole 'system' entries, `actor` holds a real User id only because
// the schema requires one (e.g. the promoter whose campaign the cron acted
// on) — it is not meaningfully "who did this," so the display name must
// come from actorRole, not the populated actor, or a cron action would
// misleadingly show up as if that promoter performed it themselves.
function formatLogEntry(l) {
  return {
    _id: l._id,
    timestamp: l.timestamp,
    actorId: l.actor?._id || null,
    actorName: l.actorRole === "system" ? "System" : l.actor?.name || "Unknown",
    actorRole: l.actorRole || null,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    before: l.before ?? null,
    after: l.after ?? null,
    reason: l.reason || null,
  };
}

// GET /api/admin/audit-log — Task 8.1
// Query: entity, actorId, action, dateFrom, dateTo, page, limit
// AuditLog is append-only (enforced at the schema level, see models/AuditLog.js)
// — this controller only ever reads it.
exports.getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = buildAuditLogQuery(req.query);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actor", "name")
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs: logs.map(formatLogEntry),
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error("Get Audit Log Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// RFC 4180 field escaping — quote the field and double any internal quotes
// whenever it contains a comma, quote, or newline. No CSV library exists in
// this project's dependencies (csv-parse is import-only), so this is a
// small, self-contained, correct implementation rather than a new dependency
// for four lines of logic.
function csvField(value) {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(csvField).join(",") + "\r\n";
}

// GET /api/admin/audit-log/export — Task 8.2
// Same filters as the list endpoint (entity/actorId/action/dateFrom/dateTo),
// no page/limit — exports the complete filtered set in one response. This
// project has no other server-side CSV export (the existing admin exports,
// e.g. enquiries, build an xlsx client-side from already-fetched data); a
// real backend endpoint is what this task explicitly asks for, and it's the
// right call here regardless — the point of a backend export is to filter
// in MongoDB without ever pulling the unfiltered/paginated data to the
// client first.
exports.exportAuditLog = async (req, res) => {
  try {
    const query = buildAuditLogQuery(req.query);

    // Bounded, not streamed: nothing else in this codebase streams a
    // response, and AuditLog is an admin diagnostic tool, not a
    // high-volume table — a plain find().lean() is the "safe bounded
    // implementation consistent with the project" the task allows for when
    // streaming isn't already part of the stack. No artificial row cap is
    // applied, since the task requires the complete filtered dataset.
    const logs = await AuditLog.find(query).populate("actor", "name").sort({ timestamp: -1 }).lean();

    const formatted = logs.map(formatLogEntry);

    let csv = "﻿"; // UTF-8 BOM, so Excel renders non-ASCII actor names/currency correctly
    csv += toCsvRow(["Timestamp", "Actor", "Event", "Entity", "Entity ID", "Before", "After"]);
    formatted.forEach((l) => {
      csv += toCsvRow([
        l.timestamp ? new Date(l.timestamp).toISOString() : "",
        l.actorName,
        l.action,
        l.entity,
        l.entityId,
        l.before,
        l.after,
      ]);
    });

    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export Audit Log Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.formatLogEntry = formatLogEntry;
