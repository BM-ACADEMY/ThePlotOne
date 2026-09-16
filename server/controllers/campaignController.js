// Admin-facing campaign management — Promoter Module Task 7.x.
// Distinct from subscriptionController.js's createCampaignOrder/verifyCampaignPayment
// (promoter-facing, mounted at /api/campaigns). This is admin-facing, mounted
// at /api/admin/campaigns, guarded by the `admin` middleware, not `isPromoter`.
const Campaign = require("../models/Campaign");
const Property = require("../models/Property");
const Requirement = require("../models/Requirement");
const CsvImportBatch = require("../models/CsvImportBatch");
const PaymentHistory = require("../models/PaymentHistory");
const { writeAudit } = require("../utils/auditLogger");
const {
  notifyCampaignActivated,
  notifyCampaignPaused,
  notifyCampaignExtended,
  notifyCampaignCompleted,
} = require("../utils/notificationService");

// GET /api/admin/campaigns — Campaigns Overview (Task 7.1)
// Optional filters: status, promoterId, planId
exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, promoterId, planId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (promoterId) query.promoter = promoterId;
    if (planId) query.plan = planId;

    const campaigns = await Campaign.find(query)
      .populate("promoter", "name")
      .populate("project", "basicInfo.title")
      .populate("plan", "name displayName")
      .sort({ createdAt: -1 });

    const formatted = campaigns.map((c) => ({
      _id: c._id,
      promoterId: c.promoter?._id || null,
      promoterName: c.promoter?.name || "Unknown",
      projectId: c.project?._id || null,
      projectTitle: c.project?.basicInfo?.title || "Untitled Project",
      planId: c.plan?._id || null,
      planName: c.plan?.displayName || c.plan?.name || "—",
      deliveredCount: c.deliveredCount || 0,
      committedMinimum: c.committedMinimum || 0,
      status: c.status,
      paceStatus: c.paceStatus,
    }));

    res.json({ success: true, campaigns: formatted });
  } catch (error) {
    console.error("Get All Campaigns Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/pending — Pending Campaigns Queue (Task 7.5)
// Must be registered BEFORE GET /:id in the router — otherwise Express would
// match "pending" as an :id and this handler would never be reached.
exports.getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "payment_received" })
      .populate("promoter", "name")
      .populate("project", "basicInfo.title")
      .populate("plan", "name displayName")
      .sort({ createdAt: 1 }); // oldest waiting first

    const campaignIds = campaigns.map((c) => c._id);
    const payments = await PaymentHistory.find({ campaign: { $in: campaignIds } }).sort({ transactionDate: -1 });
    const paymentByCampaign = new Map();
    payments.forEach((p) => {
      const key = String(p.campaign);
      if (!paymentByCampaign.has(key)) paymentByCampaign.set(key, p); // most recent per campaign
    });

    const formatted = campaigns.map((c) => {
      const payment = paymentByCampaign.get(String(c._id));
      return {
        _id: c._id,
        promoterName: c.promoter?.name || "Unknown",
        projectTitle: c.project?.basicInfo?.title || "Untitled Project",
        planName: c.plan?.displayName || c.plan?.name || "—",
        committedMinimum: c.committedMinimum || 0,
        amountPaid: payment?.amountPaid ?? null,
        paidAt: payment?.transactionDate ?? null,
      };
    });

    res.json({ success: true, campaigns: formatted, count: formatted.length });
  } catch (error) {
    console.error("Get Pending Campaigns Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/by-promoter/:id — Promoter Detail View campaign
// summary (Task 9.1). Distinct from GET /:id (Campaign Detail) — this is
// keyed by promoter/user id, not campaign id, and returns every one of that
// promoter's projects (including ones with no campaign at all — "No Plan"),
// not just their campaigns.
exports.getPromoterCampaigns = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties, campaigns, paymentHistoryDocs] = await Promise.all([
      Property.find({ seller: id }).select("basicInfo.title").sort({ createdAt: -1 }),
      Campaign.find({ promoter: id })
        .populate("plan", "name displayName price")
        .populate("project", "basicInfo.title location.locality"),
      PaymentHistory.find({ user: id, campaign: { $ne: null } })
        .populate("plan", "name displayName")
        .populate("project", "basicInfo.title")
        .sort({ transactionDate: -1 }),
    ]);

    // c.project is now a populated document (Task 6.2 needs project.title/
    // location.locality on the campaign object) — key this map by its _id,
    // not by the document itself, or every lookup below would silently miss.
    const campaignByProject = new Map(campaigns.map((c) => [String(c.project?._id), c]));

    const projects = properties.map((p) => {
      const c = campaignByProject.get(String(p._id));
      if (!c) {
        return {
          projectId: p._id,
          campaignId: null,
          projectTitle: p.basicInfo?.title || "Untitled Project",
          planName: null,
          deliveredCount: null,
          committedMinimum: null,
          status: "no_plan",
        };
      }
      const atLimit = c.committedMinimum > 0 && c.deliveredCount >= c.committedMinimum;
      return {
        projectId: p._id,
        campaignId: c._id,
        projectTitle: p.basicInfo?.title || "Untitled Project",
        planName: c.plan?.displayName || c.plan?.name || "—",
        deliveredCount: c.deliveredCount || 0,
        committedMinimum: c.committedMinimum || 0,
        status: atLimit ? "limit_reached" : c.status,
      };
    });

    const paymentHistory = paymentHistoryDocs.map((p) => ({
      _id: p._id,
      date: p.transactionDate,
      projectTitle: p.project?.basicInfo?.title || "—",
      planName: p.plan?.displayName || p.plan?.name || "—",
      amountPaid: p.amountPaid,
      paymentStatus: p.paymentStatus,
    }));

    // Task 6.2 — one row per actual campaign (unlike `projects` above, which
    // is one row per project and includes no-plan placeholder rows for
    // Task 6.1's SellerList table). Built from the same `campaigns` query
    // result, no extra DB round-trip. Field names/shape match the task's
    // spec literally, including the real SubscriptionPlan/Property field
    // names (plan.name, not the displayName fallback used above).
    const formattedCampaigns = campaigns.map((c) => ({
      _id: c._id,
      status: c.status,
      plan: {
        name: c.plan?.name || null,
        price: c.plan?.price ?? null,
      },
      project: {
        title: c.project?.basicInfo?.title || null,
        location: {
          locality: c.project?.location?.locality || null,
        },
      },
      committedMinimum: c.committedMinimum || 0,
      deliveredCount: c.deliveredCount || 0,
      goLiveAt: c.goLiveAt,
      expiresAt: c.expiresAt,
      paceStatus: c.paceStatus,
    }));

    res.json({ success: true, projects, campaigns: formattedCampaigns, paymentHistory });
  } catch (error) {
    console.error("Get Promoter Campaigns Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/stats — Campaign Status widget for the Admin
// Dashboard (Task 9.2). Must be registered BEFORE GET /:id — same
// route-ordering hazard as /pending above.
exports.getCampaignStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeCampaigns, pendingActivation, leadsUploadedToday, atLimitCandidates, campaignsBehindPace] = await Promise.all([
      Campaign.countDocuments({ status: "active" }),
      Campaign.countDocuments({ status: "payment_received" }),
      Requirement.countDocuments({ campaignId: { $ne: null }, deliveredAt: { $gte: startOfToday } }),
      Campaign.find({ status: "active", committedMinimum: { $gt: 0 } }).select("deliveredCount committedMinimum"),
      Campaign.countDocuments({ paceStatus: "behind" }),
    ]);

    const campaignsAtLimit = atLimitCandidates.filter((c) => c.deliveredCount >= c.committedMinimum).length;

    res.json({
      success: true,
      activeCampaigns,
      pendingActivation,
      leadsUploadedToday,
      campaignsAtLimit,
      campaignsBehindPace,
    });
  } catch (error) {
    console.error("Get Campaign Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/:id — Campaign Detail View (Task 7.3)
exports.getCampaignDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id)
      .populate("promoter", "name phone")
      .populate("project", "basicInfo.title location.locality location.city")
      .populate("plan", "name displayName price")
      .populate("activatedBy", "name");

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Tier 1 / Tier 2 split — leads carrying this campaign's immutable campaignId
    const [tier1Count, tier2Count] = await Promise.all([
      Requirement.countDocuments({ campaignId: campaign._id, tier: "tier1" }),
      Requirement.countDocuments({ campaignId: campaign._id, tier: "tier2" }),
    ]);

    let daysRemaining = null;
    if (campaign.expiresAt) {
      const msRemaining = new Date(campaign.expiresAt).getTime() - Date.now();
      daysRemaining = Math.max(Math.ceil(msRemaining / (24 * 60 * 60 * 1000)), 0);
    }

    const csvBatches = await CsvImportBatch.find({ campaign: campaign._id })
      .populate("uploadedBy", "name")
      .sort({ createdAt: 1 });

    // Discount ladder — same tiers as discountUtils.getVolumeDiscount, keyed
    // by the tier already stamped on the campaign at creation time rather
    // than recomputed here (discountTier is immutable per campaign).
    const DISCOUNT_PERCENT_BY_TIER = { 1: 0, 2: 20, 3: 25, 4: 30 };
    const ORDINAL = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
    let discountLabel = null;
    if (campaign.discountTier) {
      const percent = DISCOUNT_PERCENT_BY_TIER[campaign.discountTier] ?? 0;
      discountLabel =
        percent > 0
          ? `${percent}% off — ${ORDINAL[campaign.discountTier]} campaign (Tier ${campaign.discountTier})`
          : `No discount — ${ORDINAL[campaign.discountTier]} campaign`;
    }

    const locationParts = [campaign.project?.location?.locality, campaign.project?.location?.city].filter(Boolean);

    res.json({
      success: true,
      campaign: {
        _id: campaign._id,
        projectTitle: campaign.project?.basicInfo?.title || "Untitled Project",
        projectLocation: locationParts.join(", ") || null,
        planName: campaign.plan?.displayName || campaign.plan?.name || "—",
        planPrice: campaign.plan?.price ?? null,
        promoterName: campaign.promoter?.name || "Unknown",
        promoterPhone: campaign.promoter?.phone || null,
        status: campaign.status,
        paceStatus: campaign.paceStatus,
        discountLabel,
        goLiveAt: campaign.goLiveAt,
        expiresAt: campaign.expiresAt,
        daysRemaining,
        deliveredCount: campaign.deliveredCount || 0,
        committedMinimum: campaign.committedMinimum || 0,
        tier1Count,
        tier2Count,
        activatedByName: campaign.activatedBy?.name || null,
      },
      csvImportBatches: csvBatches.map((b, index) => ({
        _id: b._id,
        batchNumber: index + 1,
        fileName: b.fileName,
        imported: b.imported || 0,
        duplicates: b.duplicates || 0,
        failed: b.failed || 0,
        uploadedByName: b.uploadedBy?.name || "Unknown",
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get Campaign Detail Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/:id/activate — Task 7.2
exports.activateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    // 1. Find campaign with status: 'payment_received'
    const campaign = await Campaign.findById(id).populate("plan").populate("project");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.status !== "payment_received") {
      return res.status(400).json({
        success: false,
        message: `Campaign must be in 'payment_received' status to activate (currently '${campaign.status}')`,
      });
    }
    if (!campaign.project) {
      return res.status(400).json({ success: false, message: "Campaign has no linked project" });
    }

    const before = {
      status: campaign.status,
      goLiveAt: campaign.goLiveAt,
      expiresAt: campaign.expiresAt,
      activatedBy: campaign.activatedBy,
    };

    // 2-5. Activate + set the go-live window from the plan's real duration
    const now = new Date();
    const durationDays = campaign.plan?.duration || 30;
    campaign.status = "active";
    campaign.goLiveAt = now;
    campaign.expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    campaign.activatedBy = adminId;
    await campaign.save();

    // 6-7. This is the real trigger that flips the promoter-facing campaign flags
    await Property.findByIdAndUpdate(campaign.project._id, {
      isCampaignActive: true,
      activeCampaign: campaign._id,
    });

    // 8. AuditLog: CAMPAIGN_ACTIVATED
    await writeAudit({
      actor: adminId,
      actorRole: "admin",
      action: "CAMPAIGN_ACTIVATED",
      entity: "Campaign",
      entityId: campaign._id,
      before,
      after: {
        status: campaign.status,
        goLiveAt: campaign.goLiveAt,
        expiresAt: campaign.expiresAt,
        activatedBy: campaign.activatedBy,
      },
      reason: "Admin activated campaign",
    });

    // 9. Notify promoter
    try {
      await notifyCampaignActivated({
        promoterId: campaign.promoter,
        projectTitle: campaign.project.basicInfo?.title || "your project",
      });
    } catch (notifyError) {
      // Never fail activation because the notification failed to send.
      console.error("Promoter notify error (activateCampaign):", notifyError);
    }

    res.json({
      success: true,
      message: "Campaign activated",
      campaign: {
        _id: campaign._id,
        status: campaign.status,
        goLiveAt: campaign.goLiveAt,
        expiresAt: campaign.expiresAt,
        activatedBy: campaign.activatedBy,
      },
    });
  } catch (error) {
    console.error("Activate Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/:id/pause — Task 7.4
exports.pauseCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const campaign = await Campaign.findById(id).populate("project", "basicInfo.title");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Only an 'active' campaign can be paused (currently '${campaign.status}')`,
      });
    }

    const beforeStatus = campaign.status;
    campaign.status = "paused";
    await campaign.save();

    await writeAudit({
      actor: adminId,
      actorRole: "admin",
      action: "CAMPAIGN_PAUSED",
      entity: "Campaign",
      entityId: campaign._id,
      before: { status: beforeStatus },
      after: { status: campaign.status },
      reason: "Admin paused campaign",
    });

    try {
      await notifyCampaignPaused({
        promoterId: campaign.promoter,
        projectTitle: campaign.project?.basicInfo?.title || "your project",
      });
    } catch (notifyError) {
      console.error("Promoter notify error (pauseCampaign):", notifyError);
    }

    res.json({ success: true, message: "Campaign paused", campaign: { _id: campaign._id, status: campaign.status } });
  } catch (error) {
    console.error("Pause Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/:id/extend — Task 7.4 — Body: { extraDays: 7, reason?: "..." }
exports.extendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;
    const extraDays = Number(req.body.extraDays);
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    if (!Number.isFinite(extraDays) || extraDays <= 0) {
      return res.status(400).json({ success: false, message: "extraDays must be a positive number" });
    }

    const campaign = await Campaign.findById(id).populate("project", "basicInfo.title");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (!["active", "paused"].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Only an 'active' or 'paused' campaign can be extended (currently '${campaign.status}')`,
      });
    }
    if (!campaign.expiresAt) {
      return res.status(400).json({ success: false, message: "Campaign has no expiry date set to extend from" });
    }

    const beforeExpiresAt = campaign.expiresAt;
    campaign.expiresAt = new Date(campaign.expiresAt.getTime() + extraDays * 24 * 60 * 60 * 1000);
    await campaign.save();

    await writeAudit({
      actor: adminId,
      actorRole: "admin",
      action: "CAMPAIGN_EXTENDED",
      entity: "Campaign",
      entityId: campaign._id,
      before: { expiresAt: beforeExpiresAt },
      after: { expiresAt: campaign.expiresAt },
      reason: reason
        ? `Admin extended campaign by ${extraDays} days — ${reason}`
        : `Admin extended campaign by ${extraDays} days`,
    });

    try {
      await notifyCampaignExtended({
        promoterId: campaign.promoter,
        projectTitle: campaign.project?.basicInfo?.title || "your project",
        extraDays,
      });
    } catch (notifyError) {
      console.error("Promoter notify error (extendCampaign):", notifyError);
    }

    res.json({
      success: true,
      message: `Campaign extended by ${extraDays} days`,
      campaign: { _id: campaign._id, expiresAt: campaign.expiresAt },
    });
  } catch (error) {
    console.error("Extend Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/:id/complete — Task 7.4
exports.completeCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const campaign = await Campaign.findById(id).populate("project", "basicInfo.title");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (!["active", "paused"].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Only an 'active' or 'paused' campaign can be marked complete (currently '${campaign.status}')`,
      });
    }

    const beforeStatus = campaign.status;
    campaign.status = "completed";
    campaign.paceStatus = "completed";
    await campaign.save();

    if (campaign.project) {
      // The project genuinely has no active plan now — a new campaign can be purchased for it.
      await Property.findByIdAndUpdate(campaign.project._id, { isCampaignActive: false });
    }

    await writeAudit({
      actor: adminId,
      actorRole: "admin",
      action: "CAMPAIGN_COMPLETED",
      entity: "Campaign",
      entityId: campaign._id,
      before: { status: beforeStatus },
      after: { status: campaign.status, paceStatus: campaign.paceStatus },
      reason: "Admin marked campaign complete",
    });

    try {
      await notifyCampaignCompleted({
        promoterId: campaign.promoter,
        projectTitle: campaign.project?.basicInfo?.title || "your project",
      });
    } catch (notifyError) {
      console.error("Promoter notify error (completeCampaign):", notifyError);
    }

    res.json({ success: true, message: "Campaign marked complete", campaign: { _id: campaign._id, status: campaign.status } });
  } catch (error) {
    console.error("Complete Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
