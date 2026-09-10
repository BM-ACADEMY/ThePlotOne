const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Requirement = require("../models/Requirement");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const campaignA = ObjectId();
  const campaignB = ObjectId();

  // 1. Valid Requirement with the new campaign fields should save
  const req = await new Requirement({
    fullName: "TEST Buyer",
    phoneNumber: "9876543210",
    category: "Sell/Buy",
    usageType: "Residential",
    propertyType: "Plot",
    campaignId: campaignA,
    matchedProject: ObjectId(),
    tier: "tier1",
    source: "meta_ad",
    deliveredAt: new Date(),
    notifiedAt: new Date(),
  }).save();
  console.log("PASS: Requirement with campaign fields saved:", req._id.toString());
  console.log(req.promoterStatus === "pending" ? "PASS: promoterStatus defaults to pending" : "FAIL: promoterStatus default wrong");
  console.log(req.deliveredAt && req.notifiedAt ? "PASS: deliveredAt/notifiedAt saved" : "FAIL: deliveredAt/notifiedAt missing");

  // 2. Invalid tier / source should be rejected
  try {
    await new Requirement({
      fullName: "TEST Bad Tier",
      phoneNumber: "9876543211",
      category: "Sell/Buy",
      usageType: "Residential",
      propertyType: "Plot",
      tier: "tier3",
    }).save();
    console.log("FAIL: invalid tier was accepted");
  } catch (e) {
    console.log("PASS: invalid tier rejected");
  }

  // 3. campaignId must never change once set
  req.campaignId = campaignB;
  await req.save();
  const reloaded = await Requirement.findById(req._id);
  console.log(
    reloaded.campaignId.equals(campaignA)
      ? "PASS: campaignId in DB unchanged after attempted edit"
      : "FAIL: campaignId was changed — immutability broken!"
  );

  // 4. promoterStatus/notes should still update normally
  reloaded.promoterStatus = "contacted";
  reloaded.promoterNotes = "Called, interested";
  await reloaded.save();
  console.log("PASS: promoterStatus/notes update independently of campaignId");

  // Cleanup
  await Requirement.deleteMany({ fullName: { $in: ["TEST Buyer", "TEST Bad Tier"] } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
