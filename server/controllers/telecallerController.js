const mongoose = require("mongoose");
const Requirement = require("../models/Requirement");
const { applyInHouseMatchCheck } = require("../utils/inHouseMatchCheck");
const { writeAudit } = require("../utils/auditLogger");

const QUALIFIED_TIERS = ["tier1", "tier2"];
const PITCH_OUTCOMES = ["interested", "not_interested", "no_answer"];

// needTimeframe is a free string on Requirement; these are the options the
// Post Requirement forms offer that mean "30 days or sooner".
const TIMEFRAMES_WITHIN_30_DAYS = ["Immediate", "Within 15 days", "Within 30 days"];

// Auto-suggested tier shown to the telecaller before they submit:
//   budget confirmed AND needTimeframe <= 30 days -> tier2, otherwise tier1.
// The exact thresholds are a proposed default (STILL NEEDS CONFIRMATION in the
// Telecaller plan). "Budget confirmed" has no field of its own, so it is read
// as "the requirement carries a budget".
const suggestQualifiedTier = (requirement) => {
  const budgetConfirmed = requirement.minBudget > 0 || requirement.maxBudget > 0;
  const within30Days = TIMEFRAMES_WITHIN_30_DAYS.includes(requirement.needTimeframe);
  return budgetConfirmed && within30Days ? "tier2" : "tier1";
};

// PUT /api/telecaller/requirements/:id/qualify — Task 3.1
// Body: { qualifiedTier: 'tier1'|'tier2', qualificationNotes, overrideReason? }
exports.qualifyRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { qualifiedTier, qualificationNotes, overrideReason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid requirement id" });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }
    if (requirement.qualifiedAt) {
      return res.status(400).json({ success: false, message: "Requirement is already qualified" });
    }

    // Task 3.6 — campaign lead: note-only. The campaign already locked the
    // destination, so the lead is not re-tiered and routingStage /
    // inHouseHoldStatus are never touched (no in-house match check either).
    if (requirement.campaignId) {
      if (qualificationNotes !== undefined) requirement.qualificationNotes = qualificationNotes;
      requirement.qualifiedBy = req.user._id;
      requirement.qualifiedAt = new Date();
      await requirement.save();

      return res.json({
        success: true,
        message: "Campaign lead qualification saved",
        suggestedTier: null,
        overridden: false,
        inHouseMatch: "campaign_lead",
        matchedInHouseProperty: null,
        requirement,
      });
    }

    if (!QUALIFIED_TIERS.includes(qualifiedTier)) {
      return res.status(400).json({ success: false, message: "qualifiedTier must be 'tier1' or 'tier2'" });
    }

    // Overriding the suggestion needs a reason
    const suggestedTier = suggestQualifiedTier(requirement);
    const overridden = qualifiedTier !== suggestedTier;
    if (overridden && (typeof overrideReason !== "string" || !overrideReason.trim())) {
      return res.status(400).json({
        success: false,
        message: "overrideReason is required when overriding the suggested tier",
        suggestedTier,
      });
    }

    requirement.qualifiedTier = qualifiedTier;
    if (qualificationNotes !== undefined) requirement.qualificationNotes = qualificationNotes;
    requirement.qualifiedBy = req.user._id;
    requirement.qualifiedAt = new Date();

    // Task 3.2 — in-house match check decides hold vs. hand-off
    const inHouse = await applyInHouseMatchCheck(requirement, requirement.qualifiedAt);
    await requirement.save();

    res.json({
      success: true,
      message: "Requirement qualified",
      suggestedTier,
      overridden,
      inHouseMatch: inHouse.outcome,
      matchedInHouseProperty: inHouse.match,
      requirement,
    });
  } catch (error) {
    console.error("Qualify Requirement Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/telecaller/requirements/:id/pitch-outcome — Task 3.4
// Body: { outcome: 'interested' | 'not_interested' | 'no_answer' }
exports.submitPitchOutcome = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid requirement id" });
    }
    if (!PITCH_OUTCOMES.includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "outcome must be 'interested', 'not_interested' or 'no_answer'",
      });
    }

    const interested = outcome === "interested";
    const update = interested
      ? { inHouseHoldStatus: "pitched_interested", routingStage: "closed_in_house", status: "Closed" }
      // not interested / no answer: RELEASE IMMEDIATELY — never wait out the remaining hold clock
      : { inHouseHoldStatus: "pitched_not_interested", routingStage: "awaiting_campaign_match" };

    // Only a requirement currently on in-house hold can take a pitch outcome.
    // The hold check is part of the write itself, so two submissions (or the
    // expiry sweeper) can never both act on the same hold.
    const previous = await Requirement.findOneAndUpdate(
      { _id: id, routingStage: "in_house_hold", inHouseHoldStatus: "holding" },
      { $set: update },
      { new: false }
    );
    if (!previous) {
      const exists = await Requirement.exists({ _id: id });
      return exists
        ? res.status(400).json({ success: false, message: "Requirement is not on in-house hold" })
        : res.status(404).json({ success: false, message: "Requirement not found" });
    }

    try {
      await writeAudit({
        actor: req.user._id,
        actorRole: "telecaller",
        action: interested ? "IN_HOUSE_DEAL_CLOSED" : "IN_HOUSE_HOLD_RELEASED",
        entity: "Requirement",
        entityId: previous._id,
        before: {
          routingStage: previous.routingStage,
          inHouseHoldStatus: previous.inHouseHoldStatus,
          status: previous.status,
        },
        after: {
          routingStage: update.routingStage,
          inHouseHoldStatus: update.inHouseHoldStatus,
          status: update.status || previous.status,
          matchedInHouseProperty: previous.matchedInHouseProperty,
        },
        reason: interested
          ? "Buyer interested in the in-house listing"
          : `In-house pitch outcome: ${outcome}`,
      });
    } catch (auditError) {
      console.error("Pitch-outcome audit error (submitPitchOutcome):", auditError);
    }

    const requirement = await Requirement.findById(id);
    res.json({
      success: true,
      message: interested ? "In-house deal closed" : "In-house hold released",
      requirement,
    });
  } catch (error) {
    console.error("Submit Pitch Outcome Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/telecaller/requirements/tier2-catchall — Task 4.1
// Query: page, limit
// Leads the whole agent ladder passed on (agentRoutingStatus =
// 'expired_no_taker', set by the Agent module's offer-expiry sweeper) — the
// telecaller's own brokerage, oldest first.
//
// agentRoutingStatus is added to the Requirement schema by the Agent module,
// which is not built yet; strictQuery is switched off for this query so the
// filter is always sent to MongoDB rather than being dropped as an unknown
// path (which would return every requirement). Campaign leads are excluded:
// a lead carrying a campaignId is never pitched our own inventory.
exports.getTier2CatchAllQueue = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = { agentRoutingStatus: "expired_no_taker", campaignId: null };

    const [requirements, total] = await Promise.all([
      Requirement.find(query)
        .setOptions({ strictQuery: false })
        .populate("matchedInHouseProperty", "basicInfo.title location.city location.locality pricing slug")
        .populate("qualifiedBy", "name")
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Requirement.countDocuments(query).setOptions({ strictQuery: false }),
    ]);

    res.json({
      success: true,
      requirements,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get Tier 2 Catch-All Queue Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/telecaller/verification/site-visits — Task 5.1
// Query: page, limit
// Read-only list of leads with a site visit scheduled, for the telecaller's
// follow-up confirmation calls. Promoter side only: campaign leads whose
// promoterStatus is 'site_visit_scheduled'. The Agent side (an accepted
// LeadOffer awaiting the buyer-side OTP) is pending until the Agent module
// provides LeadOffer.
//
// Requirement has no site-visit date field — statusUpdatedAt is when the
// promoter moved the lead to 'site_visit_scheduled', not the visit time.
exports.getSiteVisitVerifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = { promoterStatus: "site_visit_scheduled", campaignId: { $ne: null } };

    const [leads, total] = await Promise.all([
      Requirement.find(query)
        .populate({ path: "campaignId", select: "promoter", populate: { path: "promoter", select: "name phone" } })
        .populate("matchedProject", "basicInfo.title location.city location.locality slug")
        .sort({ promoterStatusUpdatedAt: 1, createdAt: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Requirement.countDocuments(query),
    ]);

    const siteVisits = leads.map((lead) => ({
      _id: lead._id,
      source: "promoter",
      buyerName: lead.fullName,
      buyerPhone: lead.phoneNumber,
      promoterStatus: lead.promoterStatus,
      statusUpdatedAt: lead.promoterStatusUpdatedAt || null,
      promoterNotes: lead.promoterNotes || null,
      qualificationNotes: lead.qualificationNotes || null,
      campaignId: lead.campaignId?._id || null,
      project: lead.matchedProject
        ? {
            _id: lead.matchedProject._id,
            title: lead.matchedProject.basicInfo?.title || null,
            city: lead.matchedProject.location?.city || null,
            locality: lead.matchedProject.location?.locality || null,
            slug: lead.matchedProject.slug || null,
          }
        : null,
      promoter: lead.campaignId?.promoter
        ? {
            _id: lead.campaignId.promoter._id,
            name: lead.campaignId.promoter.name || null,
            phone: lead.campaignId.promoter.phone || null,
          }
        : null,
    }));

    res.json({
      success: true,
      siteVisits,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get Site Visit Verifications Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.suggestQualifiedTier = suggestQualifiedTier;
