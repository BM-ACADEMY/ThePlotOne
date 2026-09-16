// Admin-facing audit log route — mounted at /api/admin/audit-log.
const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const auditLogController = require("../controllers/auditLogController");

// Admin Module Task 8.1 — paginated, filterable audit log
router.get("/", protect, admin, auditLogController.getAuditLog);

// Admin Module Task 8.2 — CSV export of the complete filtered set
router.get("/export", protect, admin, auditLogController.exportAuditLog);

// AuditLog is append-only — no PUT/PATCH/DELETE route exists here, and none
// should ever be added. Enforcement also exists at the schema level
// (models/AuditLog.js blocks update/delete middleware directly), so this is
// belt-and-suspenders, not the only guard.

module.exports = router;
