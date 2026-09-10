const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  // 1. New property should default the campaign fields correctly
  const property = await new Property({
    seller: ObjectId(),
    basicInfo: {
      title: "TEST Villianur Layout",
      category: "Sell/Buy",
      usageType: "Residential",
      propertyType: "Plot",
    },
    slug: `test-villianur-layout-${Date.now()}`,
  }).save();
  console.log("PASS: Property saved:", property._id.toString());
  console.log(
    property.isCampaignActive === false &&
      property.committedLeads === 0 &&
      property.deliveredLeads === 0
      ? "PASS: isCampaignActive/committedLeads/deliveredLeads default correctly"
      : "FAIL: campaign field defaults wrong"
  );
  console.log(
    property.activeCampaign === undefined && property.totalUnits === undefined && property.availableUnits === undefined
      ? "PASS: activeCampaign/totalUnits/availableUnits are optional (undefined when not set)"
      : "FAIL: optional fields not behaving as optional"
  );

  // 2. Activating a campaign on the property + setting unit counts
  const campaign = await new Campaign({
    promoter: property.seller,
    project: property._id,
    plan: ObjectId(),
    committedMinimum: 50,
  }).save();

  property.isCampaignActive = true;
  property.activeCampaign = campaign._id;
  property.committedLeads = 50;
  property.totalUnits = 120;
  property.availableUnits = 98;
  await property.save();

  const reloaded = await Property.findById(property._id).populate("activeCampaign");
  console.log(
    reloaded.isCampaignActive === true &&
      reloaded.activeCampaign &&
      reloaded.activeCampaign._id.equals(campaign._id) &&
      reloaded.committedLeads === 50 &&
      reloaded.totalUnits === 120 &&
      reloaded.availableUnits === 98
      ? "PASS: campaign activation + unit fields saved and activeCampaign populates"
      : "FAIL: campaign activation fields did not persist correctly"
  );

  // 3. deliveredLeads increments the way a CSV import would use it
  reloaded.deliveredLeads += 17;
  await reloaded.save();
  const afterImport = await Property.findById(property._id);
  console.log(afterImport.deliveredLeads === 17 ? "PASS: deliveredLeads increments correctly" : "FAIL: deliveredLeads increment broken");

  // Cleanup
  await Property.deleteOne({ _id: property._id });
  await Campaign.deleteOne({ _id: campaign._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
