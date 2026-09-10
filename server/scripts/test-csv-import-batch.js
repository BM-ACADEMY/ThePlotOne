const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const CsvImportBatch = require("../models/CsvImportBatch");
const Requirement = require("../models/Requirement");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const campaignId = ObjectId();
  const adminId = ObjectId();

  // 1. Valid batch should save with defaults
  const batch = await new CsvImportBatch({
    campaign: campaignId,
    uploadedBy: adminId,
    fileName: "meta_leads_28aug.csv",
    totalRows: 20,
  }).save();
  console.log("PASS: CsvImportBatch saved:", batch._id.toString());
  console.log(
    batch.status === "processing" && batch.imported === 0 && batch.duplicates === 0 && batch.failed === 0
      ? "PASS: status/imported/duplicates/failed default correctly"
      : "FAIL: defaults wrong"
  );

  // 2. Missing required fields (campaign/uploadedBy) should be rejected
  try {
    await new CsvImportBatch({ fileName: "no_campaign.csv" }).save();
    console.log("FAIL: batch without campaign/uploadedBy was accepted");
  } catch (e) {
    console.log("PASS: batch without required fields rejected");
  }

  // 3. Bad status enum should be rejected
  try {
    await new CsvImportBatch({ campaign: campaignId, uploadedBy: adminId, status: "done" }).save();
    console.log("FAIL: invalid status was accepted");
  } catch (e) {
    console.log("PASS: invalid status rejected");
  }

  // 4. Update counts + errorLog + mark completed
  batch.imported = 17;
  batch.duplicates = 2;
  batch.failed = 1;
  batch.errorLog.push("Row 5: missing phone_number");
  batch.status = "completed";
  await batch.save();
  console.log("PASS: batch counts/errorLog/status updated");

  // 5. A Requirement referencing this batch should populate correctly
  const req = await new Requirement({
    fullName: "TEST Batch Buyer",
    phoneNumber: "9876543299",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    campaignId,
    csvImportBatch: batch._id,
  }).save();
  const populated = await Requirement.findById(req._id).populate("csvImportBatch");
  console.log(
    populated.csvImportBatch && populated.csvImportBatch._id.equals(batch._id)
      ? "PASS: Requirement.csvImportBatch populates back to CsvImportBatch doc"
      : "FAIL: population did not resolve"
  );

  // Cleanup
  await CsvImportBatch.deleteOne({ _id: batch._id });
  await Requirement.deleteOne({ _id: req._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
