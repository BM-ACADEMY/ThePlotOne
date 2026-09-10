const Requirement = require("../models/Requirement");

// CSV Lead Import Task 8.1 step 5 / Task 8.3.
// A phone number is a duplicate if it already exists either:
//  1. in this exact campaign, or
//  2. anywhere in this project (any campaign, or the organic/no-campaign pool)
const checkDuplicate = async (phoneNumber, campaignId, projectId) => {
  const inCampaign = await Requirement.findOne({ phoneNumber, campaignId });
  if (inCampaign) return true;

  const inProject = await Requirement.findOne({ phoneNumber, matchedProject: projectId });
  return !!inProject;
};

module.exports = { checkDuplicate };
