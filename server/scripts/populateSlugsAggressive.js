const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function populateSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    console.log(`Checking ${users.length} users...`);

    for (const user of users) {
      if (user.name && !user.slug) {
        let baseSlug = user.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        let slug = baseSlug;
        let count = 1;

        while (true) {
          const existing = await User.findOne({
            slug,
            _id: { $ne: user._id },
          });
          if (!existing) break;
          slug = `${baseSlug}-${count++}`;
        }
        
        user.slug = slug;
        await user.save();
        console.log(`Updated: ${user.name} -> ${slug}`);
      } else if (user.slug) {
        console.log(`Already has slug: ${user.name} -> ${user.slug}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

populateSlugs();
