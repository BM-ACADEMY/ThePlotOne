const mongoose = require("mongoose");
require("dotenv").config();

const fixIndexes = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const db = mongoose.connection.db;
    const collection = db.collection("users");

    console.log("Fetching existing indexes...");
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));

    const indexesToDrop = ["email_1"];

    for (const indexName of indexesToDrop) {
      if (indexes.some(i => i.name === indexName)) {
        console.log(`Dropping index: ${indexName}...`);
        await collection.dropIndex(indexName);
        console.log(`Index ${indexName} dropped.`);
      } else {
        console.log(`Index ${indexName} not found, skipping.`);
      }
    }

    console.log("All specified indexes processed.");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing indexes:", error);
    process.exit(1);
  }
};

fixIndexes();
