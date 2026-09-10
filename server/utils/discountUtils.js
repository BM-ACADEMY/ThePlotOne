// Volume discount ladder — Pricing & Distribution V7.0 FINAL §2.2
// activeCampaignCount = number of the promoter's CURRENTLY ACTIVE (non-terminal)
// campaigns, BEFORE the one being created now.
const getVolumeDiscount = (activeCampaignCount) => {
  switch (activeCampaignCount) {
    case 0:
      return { tier: 1, discount: 0 }; // 1st campaign — full price
    case 1:
      return { tier: 2, discount: 20 }; // 2nd campaign — 20% off
    case 2:
      return { tier: 3, discount: 25 }; // 3rd campaign — 25% off
    case 3:
      return { tier: 4, discount: 30 }; // 4th campaign — 30% off
    default:
      return null; // 5th+ — Enterprise only, caller must block before this
  }
};

module.exports = { getVolumeDiscount };
