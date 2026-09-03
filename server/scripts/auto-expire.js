const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Subscription = require("../models/Subscription");
const User = require("../models/User");

async function autoTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find a user with an active subscription
    const user = await User.findOne({ activeSubscription: { $ne: null } }).populate("activeSubscription");
    
    if (!user || !user.activeSubscription) {
      console.log("No user with active subscription found.");
      process.exit(0);
    }

    console.log(`Targeting User: ${user.name} (${user.phone})`);
    
    const sub = await Subscription.findById(user.activeSubscription);
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    sub.endDate = pastDate;
    await sub.save();

    console.log(`✅ EXPIRED: Subscription for ${user.phone} set to ${sub.endDate}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

autoTest();
