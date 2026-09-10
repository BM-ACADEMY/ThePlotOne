const AuditLog = require("../models/AuditLog");

// Append-only audit log writer (Promoter Module Task 12.1). AuditLog itself
// blocks update/delete at the schema level — this utility only ever creates.
const writeAudit = async ({ actor, actorRole, action, entity, entityId, before, after, reason }) => {
  await AuditLog.create({
    actor,
    actorRole,
    action,
    entity,
    entityId,
    before,
    after,
    reason,
    timestamp: new Date(),
  });
};

module.exports = { writeAudit };
