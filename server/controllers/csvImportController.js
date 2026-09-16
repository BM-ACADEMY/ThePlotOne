const { parse } = require("csv-parse/sync");
const Campaign = require("../models/Campaign");
const Property = require("../models/Property");
const Requirement = require("../models/Requirement");
const CsvImportBatch = require("../models/CsvImportBatch");
const { checkDuplicate } = require("../utils/deduplication");
const { writeAudit } = require("../utils/auditLogger");
const {
  sendPortalNotification,
  notifyLeadLimitReached,
  notifyPromoterLeadLimitReached,
} = require("../utils/notificationService");

// Default column map — used whenever the request doesn't supply a custom
// columnMapping (Task 8.2's mapping UI). Keeps every existing caller/test
// working unchanged.
const DEFAULT_COLUMN_MAP = {
  full_name: "fullName",
  phone_number: "phoneNumber",
  email: "email",
  preferred_area: "preferredLocation",
  min_budget: "minBudget",
  max_budget: "maxBudget",
  property_type: "propertyType",
  usage_type: "usageType",
  message: "message",
};

// System fields the Task 8.2 mapping UI may target. 'budget' is special: a
// single CSV column is written to BOTH minBudget and maxBudget, for CSVs
// (like Meta's) that export one budget figure rather than a min/max range.
const VALID_SYSTEM_FIELDS = new Set([
  "fullName",
  "phoneNumber",
  "email",
  "preferredLocation",
  "minBudget",
  "maxBudget",
  "budget",
  "propertyType",
  "usageType",
  "message",
]);

const normalizePhone = (raw) => {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

const toNumberOrUndefined = (raw) => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

// Parses+validates a caller-supplied column mapping (JSON string or object).
// Falls back to DEFAULT_COLUMN_MAP on anything malformed, empty, or with no
// recognized target fields — never throws.
const parseColumnMapping = (raw) => {
  if (!raw) return DEFAULT_COLUMN_MAP;
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return DEFAULT_COLUMN_MAP;
  }
  const cleaned = {};
  for (const [csvCol, field] of Object.entries(parsed || {})) {
    if (VALID_SYSTEM_FIELDS.has(field)) cleaned[csvCol] = field;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : DEFAULT_COLUMN_MAP;
};

// Maps + validates one raw CSV row against the active column mapping.
// Property type/usage type/category fall back to the project's own values
// when the row doesn't specify them — every imported lead is inherently
// about this campaign's one project.
const mapAndValidateRow = (rawRow, columnMap, project) => {
  const mapped = {};
  for (const [csvCol, field] of Object.entries(columnMap)) {
    if (rawRow[csvCol] === undefined) continue;
    if (field === "budget") {
      const val = toNumberOrUndefined(rawRow[csvCol]);
      if (val !== undefined) {
        mapped.minBudget = val;
        mapped.maxBudget = val;
      }
    } else {
      mapped[field] = rawRow[csvCol];
    }
  }

  const fullName = (mapped.fullName || "").trim();
  const phoneNumber = normalizePhone(mapped.phoneNumber);

  if (!fullName) return { ok: false, reason: "missing full_name" };
  if (phoneNumber.length !== 10) {
    return { ok: false, reason: `phone_number must be 10 digits (got "${mapped.phoneNumber || ""}")` };
  }

  return {
    ok: true,
    data: {
      fullName,
      phoneNumber,
      email: mapped.email || undefined,
      preferredLocation: mapped.preferredLocation || undefined,
      minBudget: toNumberOrUndefined(mapped.minBudget),
      maxBudget: toNumberOrUndefined(mapped.maxBudget),
      propertyType: mapped.propertyType || project.basicInfo?.propertyType,
      usageType: mapped.usageType || project.basicInfo?.usageType,
      category: project.basicInfo?.category,
      message: mapped.message || undefined,
    },
  };
};

// POST /api/admin/campaigns/:id/import-leads — Task 8.1
// Body (multipart/form-data): file (required), columnMapping (optional JSON
// string, Task 8.2), dryRun (optional "true" — Task 8.2 preview step)
exports.importLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;
    const isDryRun = req.body?.dryRun === "true" || req.body?.dryRun === true;
    const columnMap = parseColumnMapping(req.body?.columnMapping);

    // Step 1: Receive CSV file (multer, via csvUploadMiddleware)
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const campaign = await Campaign.findById(id)
      .populate("project")
      .populate("plan")
      .populate("promoter", "name");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (!campaign.project) {
      return res.status(400).json({ success: false, message: "Campaign has no linked project" });
    }
    if (campaign.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Leads can only be imported into an 'active' campaign (currently '${campaign.status}')`,
      });
    }

    // Step 2: Parse CSV rows
    let rows;
    try {
      rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch (parseError) {
      return res.status(400).json({ success: false, message: `Could not parse CSV: ${parseError.message}` });
    }
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "CSV file has no data rows" });
    }

    // Step 6: Create CsvImportBatch record — a dry run never gets a permanent
    // batch row, only a real commit does.
    const batch = isDryRun
      ? null
      : await CsvImportBatch.create({
          campaign: campaign._id,
          uploadedBy: adminId,
          fileName: req.file.originalname,
          totalRows: rows.length,
          imported: 0,
          duplicates: 0,
          failed: 0,
          status: "processing",
          errorLog: [],
        });

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const errorLog = [];
    const createdLeads = [];
    const seenThisPass = new Set(); // phones already counted as imported this pass
    // Task 4.3 — first 5 importable rows, for the dry-run preview table only.
    const PREVIEW_SAMPLE_SIZE = 5;
    const previewRows = [];

    // Sequential, not parallel — a later row with a repeated phone number
    // must see the earlier row already counted/created this pass, in both
    // dry-run (in-memory check) and real-run (real DB check) modes.
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // +1 for header, +1 for 1-indexing

      // Steps 3-4: Map columns + validate
      const result = mapAndValidateRow(rows[i], columnMap, campaign.project);
      if (!result.ok) {
        failedCount++;
        errorLog.push(`Row ${rowNum}: ${result.reason}`);
        continue;
      }

      const { phoneNumber } = result.data;

      // Step 5: Deduplication (intra-pass, then real DB)
      if (seenThisPass.has(phoneNumber)) {
        duplicateCount++;
        continue;
      }
      const isDuplicate = await checkDuplicate(phoneNumber, campaign._id, campaign.project._id);
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      if (isDryRun) {
        seenThisPass.add(phoneNumber);
        importedCount++;
        if (previewRows.length < PREVIEW_SAMPLE_SIZE) {
          previewRows.push({
            fullName: result.data.fullName,
            phoneNumber: result.data.phoneNumber,
            preferredLocation: result.data.preferredLocation || null,
            minBudget: result.data.minBudget ?? null,
            maxBudget: result.data.maxBudget ?? null,
          });
        }
        continue;
      }

      // Step 7: Create Requirement — campaignId is immutable once set (schema-enforced)
      try {
        const lead = await Requirement.create({
          ...result.data,
          campaignId: campaign._id,
          matchedProject: campaign.project._id,
          csvImportBatch: batch._id,
          tier: "tier1",
          source: "meta_ad",
          promoterStatus: "pending",
          deliveredAt: new Date(),
        });
        seenThisPass.add(phoneNumber);
        createdLeads.push(lead);
        importedCount++;
      } catch (createError) {
        failedCount++;
        errorLog.push(`Row ${rowNum}: ${createError.message}`);
      }
    }

    if (isDryRun) {
      return res.json({
        success: true,
        dryRun: true,
        imported: importedCount,
        duplicates: duplicateCount,
        failed: failedCount,
        previewRows,
        total: rows.length,
        errorLog,
      });
    }

    // Step 8: Update Campaign.deliveredCount / Property.deliveredLeads
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaign._id,
      { $inc: { deliveredCount: importedCount } },
      { new: true },
    );
    if (importedCount > 0) {
      await Property.findByIdAndUpdate(campaign.project._id, { $inc: { deliveredLeads: importedCount } });
    }

    // Finalize the batch record
    batch.imported = importedCount;
    batch.duplicates = duplicateCount;
    batch.failed = failedCount;
    batch.status = "completed";
    batch.errorLog = errorLog;
    await batch.save();

    // Step 9: Lead limit reached?
    if (importedCount > 0 && updatedCampaign.deliveredCount >= updatedCampaign.committedMinimum) {
      try {
        await notifyLeadLimitReached({
          promoter: { _id: campaign.promoter._id },
          project: { title: campaign.project.basicInfo?.title || "your project" },
          plan: { name: campaign.plan?.displayName || campaign.plan?.name || "your plan" },
          committedMinimum: updatedCampaign.committedMinimum,
        });
        await notifyPromoterLeadLimitReached({
          promoter: { name: campaign.promoter?.name || "A promoter" },
          project: { title: campaign.project.basicInfo?.title || "project" },
          campaign: { _id: campaign._id },
          deliveredCount: updatedCampaign.deliveredCount,
          committedMinimum: updatedCampaign.committedMinimum,
        });
      } catch (notifyError) {
        console.error("Lead-limit notify error (importLeads):", notifyError);
      }

      // Module 12 Task 12.1 — LEAD_LIMIT_REACHED, distinct from this batch's
      // own LEADS_IMPORTED entry below: this one marks the specific moment
      // deliveredCount first reached committedMinimum, not the import itself.
      try {
        await writeAudit({
          actor: adminId,
          actorRole: "admin",
          action: "LEAD_LIMIT_REACHED",
          entity: "Campaign",
          entityId: campaign._id,
          before: null,
          after: { deliveredCount: updatedCampaign.deliveredCount, committedMinimum: updatedCampaign.committedMinimum },
          reason: `Campaign for ${campaign.project.basicInfo?.title || "project"} reached its committed minimum`,
        });
      } catch (auditError) {
        console.error("Lead-limit audit error (importLeads):", auditError);
      }
    }

    // Step 10: Notify promoter for each new lead
    try {
      await Promise.all(
        createdLeads.map((lead) =>
          sendPortalNotification({
            userId: campaign.promoter._id,
            title: "New Lead Received",
            message: `You have a new lead for ${campaign.project.basicInfo?.title || "your project"}`,
            type: "new_lead",
            link: "/seller/my-leads",
            leadId: lead._id,
          }),
        ),
      );
    } catch (notifyError) {
      console.error("Per-lead notify error (importLeads):", notifyError);
    }

    // Step 11: AuditLog
    await writeAudit({
      actor: adminId,
      actorRole: "admin",
      action: "LEADS_IMPORTED",
      entity: "CsvImportBatch",
      entityId: batch._id,
      before: null,
      after: { imported: importedCount, duplicates: duplicateCount, failed: failedCount, total: rows.length },
      reason: `Admin imported CSV for campaign ${campaign._id}`,
    });

    // Step 12: Return summary
    res.json({
      success: true,
      imported: importedCount,
      duplicates: duplicateCount,
      failed: failedCount,
      total: rows.length,
      batchId: batch._id,
      campaignDelivered: updatedCampaign.deliveredCount,
      campaignCommitted: updatedCampaign.committedMinimum,
      errorLog,
    });
  } catch (error) {
    console.error("Import Leads Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
