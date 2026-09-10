const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Notification = require("../models/Notification");
const { notifyLeadLimitReached } = require("../utils/notificationService");

const ObjectId = () => new mongoose.Types.ObjectId();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const promoterId = ObjectId();

  await notifyLeadLimitReached({
    promoter: { _id: promoterId },
    project: { title: "Villianur Layout" },
    plan: { name: "Growth" },
    committedMinimum: 50,
  });

  const notification = await Notification.findOne({ recipient: promoterId });

  console.log(
    notification &&
      notification.title === "Lead Limit Reached" &&
      notification.message === "Your Growth plan for Villianur Layout has reached its limit of 50 leads. Contact admin to extend your plan." &&
      notification.type === "lead_limit_reached" &&
      notification.link === "/seller/plans/select" &&
      notification.isRead === false
      ? "PASS: notifyLeadLimitReached creates the exact notification described in the task"
      : `FAIL: notification wrong: ${JSON.stringify(notification)}`
  );

  await Notification.deleteOne({ _id: notification._id });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
