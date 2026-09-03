require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function dropStaleIndex() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const collection = mongoose.connection.collection("marketingplans");
  const indexes = await collection.indexes();
  const stale = indexes.find((i) => i.name === "serviceName_1");

  if (stale) {
    await collection.dropIndex("serviceName_1");
    console.log("Dropped stale index: serviceName_1");
  } else {
    console.log("Index serviceName_1 not found — nothing to drop");
  }

  await mongoose.disconnect();
}

dropStaleIndex().catch((err) => {
  console.error(err);
  process.exit(1);
});
