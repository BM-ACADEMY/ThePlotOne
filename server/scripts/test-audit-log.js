const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const AuditLog = require("../models/AuditLog");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const actorId = ObjectId();
  const entityId = ObjectId();

  // 1. A fresh insert should work
  const log = await AuditLog.create({
    actor: actorId,
    actorRole: "admin",
    action: "CAMPAIGN_ACTIVATED",
    entity: "Campaign",
    entityId,
    before: { status: "payment_received" },
    after: { status: "active" },
    reason: "Manual activation",
  });
  console.log("PASS: AuditLog entry created:", log._id.toString());
  console.log(log.timestamp ? "PASS: timestamp auto-set" : "FAIL: timestamp missing");

  // 2. Missing required field should be rejected
  try {
    await AuditLog.create({ actorRole: "admin", action: "X", entity: "Campaign" });
    console.log("FAIL: entry missing required fields was accepted");
  } catch (e) {
    console.log("PASS: entry missing required fields rejected");
  }

  // 3. Model.updateOne() must be blocked
  try {
    await AuditLog.updateOne({ _id: log._id }, { $set: { action: "TAMPERED" } });
    console.log("FAIL: AuditLog.updateOne() succeeded — append-only violated!");
  } catch (e) {
    console.log("PASS: AuditLog.updateOne() blocked ->", e.message);
  }

  // 4. Model.findOneAndUpdate() must be blocked
  try {
    await AuditLog.findOneAndUpdate({ _id: log._id }, { $set: { action: "TAMPERED" } });
    console.log("FAIL: findOneAndUpdate() succeeded — append-only violated!");
  } catch (e) {
    console.log("PASS: findOneAndUpdate() blocked ->", e.message);
  }

  // 5. Re-saving a fetched, modified document must be blocked
  const fetched = await AuditLog.findById(log._id);
  fetched.action = "TAMPERED";
  try {
    await fetched.save();
    console.log("FAIL: re-save of existing entry succeeded — append-only violated!");
  } catch (e) {
    console.log("PASS: re-save of existing entry blocked ->", e.message);
  }

  // 6. Model.deleteOne() must be blocked
  try {
    await AuditLog.deleteOne({ _id: log._id });
    console.log("FAIL: AuditLog.deleteOne() succeeded — append-only violated!");
  } catch (e) {
    console.log("PASS: AuditLog.deleteOne() blocked ->", e.message);
  }

  // 7. Document-level .deleteOne() must be blocked too
  try {
    await fetched.deleteOne();
    console.log("FAIL: document.deleteOne() succeeded — append-only violated!");
  } catch (e) {
    console.log("PASS: document.deleteOne() blocked ->", e.message);
  }

  // 8. Confirm the entry is genuinely untouched in the DB
  const stillThere = await AuditLog.findById(log._id);
  console.log(
    stillThere && stillThere.action === "CAMPAIGN_ACTIVATED"
      ? "PASS: original entry is still present and unmodified"
      : "FAIL: entry was altered or removed despite blocks"
  );

  // Cleanup — bypass Mongoose deliberately, via the raw driver, since the
  // app-level append-only guard (correctly) blocks Mongoose-level deletes.
  await mongoose.connection.db.collection("auditlogs").deleteMany({ actor: actorId });
  console.log("\nCleaned up test data (via raw driver, bypassing the app-level guard).");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
