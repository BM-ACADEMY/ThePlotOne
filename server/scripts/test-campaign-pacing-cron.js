// Campaign Pacing Check — Module 11 Task 11.1. Tests runCampaignPacingCheck
// directly (the same function the 7:00 AM cron calls), not the cron
// scheduling itself.
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Property = require("../models/Property");
const Campaign = require("../models/Campaign");
const Notification = require("../models/Notification");
const { runCampaignPacingCheck } = require("../utils/cronJobs");

const ObjectId = () => new mongoose.Types.ObjectId();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const makeProject = async (title) =>
  new Property({
    seller: ObjectId(),
    basicInfo: { title, category: "Sell/Buy", usageType: "Residential", propertyType: "Plot" },
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }).save();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  const cleanup = { projects: [], campaigns: [] };

  // Behind pace: 10 days elapsed, 10 days remaining, needs 80 more at 8/day,
  // only averaging 2/day so far (2 < 8*0.85=6.8)
  const projBehind = await makeProject("Pacing Test Behind");
  const campBehind = await new Campaign({
    promoter: ObjectId(), project: projBehind._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 20, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(10), expiresAt: daysFromNow(10),
  }).save();
  cleanup.projects.push(projBehind._id); cleanup.campaigns.push(campBehind._id);

  // Ahead of pace: 5 days elapsed, 15 days remaining, needs only 10 more at
  // 0.67/day, already averaging 18/day (18 > 0.67*1.3=0.87)
  const projAhead = await makeProject("Pacing Test Ahead");
  const campAhead = await new Campaign({
    promoter: ObjectId(), project: projAhead._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 90, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(5), expiresAt: daysFromNow(15),
  }).save();
  cleanup.projects.push(projAhead._id); cleanup.campaigns.push(campAhead._id);

  // On track: 10 elapsed, 10 remaining, needs 50 more at 5/day, averaging
  // exactly 5/day so far (right on target, well within the 0.85x-1.3x band)
  const projOnTrack = await makeProject("Pacing Test On Track");
  const campOnTrack = await new Campaign({
    promoter: ObjectId(), project: projOnTrack._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 50, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(10), expiresAt: daysFromNow(10),
  }).save();
  cleanup.projects.push(projOnTrack._id); cleanup.campaigns.push(campOnTrack._id);

  // Recovery: was 'behind', now computes 'on_track' (same on-target numbers as above)
  const projRecovering = await makeProject("Pacing Test Recovering");
  const campRecovering = await new Campaign({
    promoter: ObjectId(), project: projRecovering._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 50, status: "active", paceStatus: "behind",
    goLiveAt: daysAgo(10), expiresAt: daysFromNow(10),
  }).save();
  cleanup.projects.push(projRecovering._id); cleanup.campaigns.push(campRecovering._id);

  // Guard: went live today — daysElapsed < 1, must be skipped entirely
  const projFresh = await makeProject("Pacing Test Fresh");
  const campFresh = await new Campaign({
    promoter: ObjectId(), project: projFresh._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 0, status: "active", paceStatus: "on_track",
    goLiveAt: new Date(), expiresAt: daysFromNow(20),
  }).save();
  cleanup.projects.push(projFresh._id); cleanup.campaigns.push(campFresh._id);

  // Guard: commitment already met — remainingNeeded <= 0, must be skipped
  const projMet = await makeProject("Pacing Test Met");
  const campMet = await new Campaign({
    promoter: ObjectId(), project: projMet._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 120, status: "active", paceStatus: "on_track",
    goLiveAt: daysAgo(10), expiresAt: daysFromNow(10),
  }).save();
  cleanup.projects.push(projMet._id); cleanup.campaigns.push(campMet._id);

  // Guard: paused campaign with "behind" numbers — must not be touched at all
  // (not status: active, so excluded from the query entirely)
  const projPaused = await makeProject("Pacing Test Paused");
  const campPaused = await new Campaign({
    promoter: ObjectId(), project: projPaused._id, plan: ObjectId(),
    committedMinimum: 100, deliveredCount: 5, status: "paused", paceStatus: "on_track",
    goLiveAt: daysAgo(10), expiresAt: daysFromNow(10),
  }).save();
  cleanup.projects.push(projPaused._id); cleanup.campaigns.push(campPaused._id);

  const results = await runCampaignPacingCheck();

  const campaignAfter = async (id) => Campaign.findById(id);

  const behindAfter = await campaignAfter(campBehind._id);
  console.log(
    behindAfter.paceStatus === "behind"
      ? "PASS: behind-pace campaign transitions to paceStatus 'behind'"
      : `FAIL: behind campaign paceStatus = ${behindAfter.paceStatus}`
  );

  const aheadAfter = await campaignAfter(campAhead._id);
  console.log(
    aheadAfter.paceStatus === "ahead"
      ? "PASS: ahead-of-pace campaign transitions to paceStatus 'ahead'"
      : `FAIL: ahead campaign paceStatus = ${aheadAfter.paceStatus}`
  );

  const onTrackAfter = await campaignAfter(campOnTrack._id);
  console.log(
    onTrackAfter.paceStatus === "on_track"
      ? "PASS: on-target campaign stays paceStatus 'on_track'"
      : `FAIL: on-track campaign paceStatus = ${onTrackAfter.paceStatus}`
  );

  const recoveringAfter = await campaignAfter(campRecovering._id);
  console.log(
    recoveringAfter.paceStatus === "on_track"
      ? "PASS: a recovering campaign transitions back from 'behind' to 'on_track' (not covered by the doc's own pseudocode, added for correctness)"
      : `FAIL: recovering campaign paceStatus = ${recoveringAfter.paceStatus}`
  );

  const freshAfter = await campaignAfter(campFresh._id);
  console.log(
    freshAfter.paceStatus === "on_track"
      ? "PASS: a campaign that just went live today (daysElapsed < 1) is skipped, untouched"
      : `FAIL: fresh campaign paceStatus = ${freshAfter.paceStatus}`
  );

  const metAfter = await campaignAfter(campMet._id);
  console.log(
    metAfter.paceStatus === "on_track"
      ? "PASS: a campaign that already met its committed minimum is skipped (lead-limit notifications own that scenario, not pacing)"
      : `FAIL: met-commitment campaign paceStatus = ${metAfter.paceStatus}`
  );

  const pausedAfter = await campaignAfter(campPaused._id);
  console.log(
    pausedAfter.paceStatus === "on_track"
      ? "PASS: a paused campaign is excluded entirely (not status: active), even with 'behind'-shaped numbers"
      : `FAIL: paused campaign paceStatus = ${pausedAfter.paceStatus}`
  );

  console.log(
    results.length === 3 &&
      results.some((r) => String(r.campaignId) === String(campBehind._id) && r.from === "on_track" && r.to === "behind") &&
      results.some((r) => String(r.campaignId) === String(campAhead._id) && r.from === "on_track" && r.to === "ahead") &&
      results.some((r) => String(r.campaignId) === String(campRecovering._id) && r.from === "behind" && r.to === "on_track")
      ? "PASS: returned results array reports exactly the 3 real transitions, each with correct from/to"
      : `FAIL: results wrong: ${JSON.stringify(results)}`
  );

  const behindNotif = await Notification.findOne({ type: "campaign_behind_pace", message: { $regex: "Pacing Test Behind" } });
  console.log(
    behindNotif && behindNotif.title === "Campaign Behind Pace" && /Target: 8\.0\/day \| Actual: 2\.0\/day/.test(behindNotif.message)
      ? "PASS: admin notified with correct title/target/actual numbers for the behind-pace campaign"
      : `FAIL: behind-pace notification missing/wrong: ${JSON.stringify(behindNotif)}`
  );

  const aheadNotif = await Notification.findOne({ type: "campaign_ahead_of_pace", message: { $regex: "Pacing Test Ahead" } });
  console.log(
    aheadNotif && aheadNotif.title === "Campaign Ahead of Pace"
      ? "PASS: admin notified for the ahead-of-pace campaign"
      : "FAIL: ahead-of-pace notification missing/wrong"
  );

  const recoveringNotif = await Notification.findOne({ message: { $regex: "Pacing Test Recovering" } });
  console.log(
    !recoveringNotif
      ? "PASS: recovering back to on_track does NOT send a notification (only behind/ahead deviations alert admin)"
      : "FAIL: an unexpected notification was sent for the recovering campaign"
  );

  const onTrackNotif = await Notification.findOne({ message: { $regex: "Pacing Test On Track" } });
  console.log(
    !onTrackNotif
      ? "PASS: a campaign that stays on_track never generates a notification"
      : "FAIL: an unexpected notification was sent for the always-on-track campaign"
  );

  // Anti-spam: running the check again immediately for the still-behind
  // campaign must NOT create any additional notifications. (This DB has 2
  // real admin accounts, so one notify call fans out to 2 rows — the
  // anti-spam property being tested is that the count doesn't grow on a
  // second run, not that it equals exactly 1.)
  const behindNotifCountBefore = await Notification.countDocuments({ type: "campaign_behind_pace", message: { $regex: "Pacing Test Behind" } });
  await runCampaignPacingCheck();
  const behindNotifCountAfter = await Notification.countDocuments({ type: "campaign_behind_pace", message: { $regex: "Pacing Test Behind" } });
  console.log(
    behindNotifCountAfter === behindNotifCountBefore && behindNotifCountBefore > 0
      ? `PASS: running the check again while a campaign remains 'behind' does not re-notify (stayed at ${behindNotifCountBefore}, no daily spam)`
      : `FAIL: behind-pace notification count changed on re-run: ${behindNotifCountBefore} -> ${behindNotifCountAfter}`
  );

  // Cleanup
  await Campaign.deleteMany({ _id: { $in: cleanup.campaigns } });
  await Property.deleteMany({ _id: { $in: cleanup.projects } });
  await Notification.deleteMany({ message: { $regex: "Pacing Test" } });
  console.log("\nCleaned up test data.");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
