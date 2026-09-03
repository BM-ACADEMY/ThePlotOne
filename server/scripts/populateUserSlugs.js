const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function populateSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pondy");
    console.log("Connected to MongoDB");

    const users = await User.find({ slug: { $exists: false } });
    console.log(`Found ${users.length} users without slugs`);

    for (const user of users) {
      if (user.name) {
        // Trigger pre-save hook
        user.markModified("name"); 
        await user.save();
        console.log(`Updated slug for: ${user.name} -> ${user.slug}`);
      }
    }

    console.log("Finished updating slugs");
    process.exit(0);
  } catch (error) {
    console.error("Error populating slugs:", error);
    process.exit(1);
  }
}

populateSlugs();
