const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function checkSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pondy");
    const users = await User.find({}).limit(10);
    users.forEach(u => console.log(`${u.name}: ${u.slug}`));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkSlugs();
