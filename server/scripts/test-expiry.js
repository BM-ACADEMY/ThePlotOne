const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const Subscription = require("../models/Subscription");
const User = require("../models/User");

async function expireSubscription(phone) {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected successfully.`);

    // 1. Find User
    const user = await User.findOne({ phone: phone });
    if (!user) {
      console.error(`❌ User with phone ${phone} not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user._id})`);

    // 2. Find Active Subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: "active"
    });

    if (!subscription) {
      console.error(`❌ No active subscription found for this user.`);
      process.exit(1);
    }

    // 3. Set to Expired
    console.log(`Current Expiry: ${subscription.endDate}`);
    
    // Set endDate to 1 hour ago
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    subscription.endDate = pastDate;
    await subscription.save();

    console.log(`✅ Success! Subscription for ${phone} has been manually set to expire.`);
    console.log(`New Expiry: ${subscription.endDate}`);
    console.log(`\nNow refresh your browser or access the billing page to see it transition to the default plan.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Get phone from command line
const phoneArg = process.argv[2];
if (!phoneArg) {
  console.log("Usage: node scripts/test-expiry.js <phone_number>");
  process.exit(1);
}

expireSubscription(phoneArg);
