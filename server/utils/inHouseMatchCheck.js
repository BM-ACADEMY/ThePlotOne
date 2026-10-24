const Property = require("../models/Property");
const { getPropertyMatchQuery } = require("../controllers/requirementController");

const TIER1_HOLD_MS = 24 * 60 * 60 * 1000;
const TIER2_HOLD_MS = 6 * 60 * 60 * 1000;

// getPropertyMatchQuery only filters by area when the requirement has
// coordinates or preferredLocation text. Without either it would match any
// in-house listing of the right type and budget — a match needs area too.
const hasUsableLocation = (requirement) =>
  Boolean(
    (requirement.lat && requirement.lng) ||
    (requirement.preferredLocation && requirement.preferredLocation.trim() !== "")
  );

// Same matching the lead-sharing flow uses (getPropertyMatchQuery), limited to
// in-house inventory: exact area first, then the 5 km radius when the
// requirement has coordinates.
const findInHouseMatch = async (requirement) => {
  if (!hasUsableLocation(requirement)) return null;

  const exactQuery = getPropertyMatchQuery(null, requirement, "exact");
  let match = await Property.findOne({ ...exactQuery, isInHouseInventory: true });

  if (!match && requirement.lat && requirement.lng) {
    const radiusQuery = getPropertyMatchQuery(null, requirement, "radius");
    match = await Property.findOne({ ...radiusQuery, isInHouseInventory: true });
  }
  return match;
};

// In-House Match Check (Telecaller Module Task 3.2) — runs right after a
// requirement is qualified. Sets the routing fields on the document and
// returns what it decided; the caller saves.
//   campaign lead        -> untouched (the campaign already locked the destination)
//   no in-house match    -> skip the hold, hand off to campaign matching
//   no usable location   -> treated as no in-house match
//   in-house match       -> hold: tier1 = 24h, tier2 = 6h
const applyInHouseMatchCheck = async (requirement, now = new Date()) => {
  if (requirement.campaignId) {
    return { outcome: "campaign_lead", match: null };
  }

  const match = await findInHouseMatch(requirement);
  if (!match) {
    requirement.routingStage = "awaiting_campaign_match";
    return { outcome: "no_match", match: null };
  }

  requirement.matchedInHouseProperty = match._id;
  requirement.inHouseHoldStatus = "holding";
  requirement.routingStage = "in_house_hold";
  requirement.inHouseHoldExpiresAt = new Date(
    now.getTime() + (requirement.qualifiedTier === "tier2" ? TIER2_HOLD_MS : TIER1_HOLD_MS)
  );
  return { outcome: "hold", match };
};

module.exports = { applyInHouseMatchCheck };
