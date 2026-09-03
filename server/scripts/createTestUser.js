require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");
const Role = require("../models/Role");

async function createTestUser() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ phone: "9999999999" });
  if (existing) {
    console.log("Test user already exists:");
    console.log(`  _id   : ${existing._id}`);
    console.log(`  phone : ${existing.phone}`);
    console.log(`  role  : ${existing.role_id}`);
    await mongoose.disconnect();
    return;
  }

  const sellerRole = await Role.findOne({ role_name: "seller" });
  if (!sellerRole) {
    console.error("Seller role not found in DB");
    await mongoose.disconnect();
    return;
  }

  const customId = `USER-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const user = new User({
    phone: "9999999999",
    name: "Test User",
    role_id: sellerRole._id,
    isVerified: true,
    customId,
  });

  await user.save();
  console.log("Test user created:");
  console.log(`  _id   : ${user._id}`);
  console.log(`  phone : ${user.phone}`);
  console.log(`  role  : ${sellerRole.role_name} (${sellerRole._id})`);
  console.log("\nYou can now update the role/businessType in MongoDB Atlas.");

  await mongoose.disconnect();
}

createTestUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
