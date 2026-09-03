// server/scripts/seedRoles.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Role = require("../models/Role");

dotenv.config({ path: path.join(__dirname, "../.env") });

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding roles...");

    const rolesToSeed = ["agent", "builder", "owner", "admin", "user", "seller"];
    
    for (const roleName of rolesToSeed) {
      const exists = await Role.findOne({ role_name: roleName });
      if (!exists) {
        await Role.create({ role_name: roleName });
        console.log(`Created role: ${roleName}`);
      } else {
        console.log(`Role ${roleName} already exists.`);
      }
    }

    console.log("Role seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding roles:", error);
    process.exit(1);
  }
};

seedRoles();
