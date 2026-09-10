const cron = require("node-cron");
const Property = require("../models/Property");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Requirement = require("../models/Requirement");
const SharedLead = require("../models/SharedLead");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Campaign = require("../models/Campaign");
const fs = require("fs");
const path = require("path");
const { processLeadSharingExpiry } = require("./leadSharingUtils");
const { writeAudit } = require("./auditLogger");
const {
  notifyCampaignBehindPace,
  notifyCampaignAheadOfPace,
  notifyCampaignExpiryExtended,
  notifyAdminCampaignExtended,
  notifyCampaignCompleted,
  notifyAdminCampaignCompleted,
  notifyDailySelfAudit,
} = require("./notificationService");

// Promoter Module Task 11.1 — Campaign Pacing Check. Extracted as a standalone
// function (not inlined in cron.schedule) so it can be called directly from a
// test script, same as every other controller/service in this codebase.
//
// Deviates from the task's literal pseudocode in one deliberate way: the doc
// calls notifyAdmin(...) unconditionally inside a check that runs daily,
// which would send an identical notification every single day a campaign
// simply remains behind/ahead. Instead, paceStatus is recomputed and saved
// every run (so it's always accurate), but admin is only notified on an
// actual TRANSITION into/out of behind or ahead — including recovering back
// to on_track, which the doc's pseudocode never covers either.
const runCampaignPacingCheck = async () => {
  const activeCampaigns = await Campaign.find({ status: "active" }).populate(
    "project",
    "basicInfo.title",
  );

  const now = Date.now();
  const results = [];

  for (const campaign of activeCampaigns) {
    if (!campaign.goLiveAt || !campaign.expiresAt) continue;

    const daysElapsed = Math.floor((now - new Date(campaign.goLiveAt).getTime()) / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((new Date(campaign.expiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
    const remainingNeeded = campaign.committedMinimum - campaign.deliveredCount;

    // No meaningful average yet (just went live), nothing left to pace
    // against (already expiring), or commitment already met (Task 6.2/6.3's
    // lead-limit notifications own that scenario, not pacing).
    if (daysElapsed < 1 || daysRemaining < 1 || remainingNeeded <= 0) continue;

    const dailyTarget = remainingNeeded / daysRemaining;
    const actualDailyAvg = campaign.deliveredCount / daysElapsed;

    let newPaceStatus = "on_track";
    if (actualDailyAvg < dailyTarget * 0.85) newPaceStatus = "behind";
    else if (actualDailyAvg > dailyTarget * 1.3) newPaceStatus = "ahead";

    if (newPaceStatus === campaign.paceStatus) continue; // no transition — nothing to save or notify

    const previousPaceStatus = campaign.paceStatus;
    campaign.paceStatus = newPaceStatus;
    await campaign.save();

    const projectTitle = campaign.project?.basicInfo?.title || "Untitled Project";
    const dailyTargetStr = dailyTarget.toFixed(1);
    const actualDailyAvgStr = actualDailyAvg.toFixed(1);

    if (newPaceStatus === "behind") {
      await notifyCampaignBehindPace({
        campaignId: campaign._id,
        projectTitle,
        dailyTarget: dailyTargetStr,
        actualDailyAvg: actualDailyAvgStr,
      });
    } else if (newPaceStatus === "ahead") {
      await notifyCampaignAheadOfPace({
        campaignId: campaign._id,
        projectTitle,
        dailyTarget: dailyTargetStr,
        actualDailyAvg: actualDailyAvgStr,
      });
    }

    results.push({ campaignId: campaign._id, from: previousPaceStatus, to: newPaceStatus });
  }

  return results;
};

// Promoter Module Task 11.2 — Campaign Expiry Check. Standalone/exported for
// the same testability reason as runCampaignPacingCheck above.
//
// Subscription-cron collision (found during Task 11.1, resolved here): the
// legacy 30-minute Subscription-expiry cron now excludes campaign-linked
// subscriptions entirely (campaign: null filter, see initCronJobs below) —
// this function is the sole owner of a campaign-linked Subscription's
// lifecycle from here on:
//   - extended  -> Subscription.endDate is pushed to match the new
//                  Campaign.expiresAt, so the two stay numerically identical
//   - completed -> Subscription.status is set to 'expired' directly (the
//                  legacy cron will never see it to do this itself)
// Idempotent by construction, not by an extra guard: an extended campaign's
// new expiresAt is 7 days out, so it no longer matches expiresAt <= now on a
// second run the same day; a completed campaign is no longer status:
// 'active', so it's excluded from the query entirely. Re-running the job
// finds nothing left to do for either one.
const runCampaignExpiryCheck = async () => {
  const now = new Date();
  const expiringCampaigns = await Campaign.find({
    status: "active",
    expiresAt: { $lte: now },
  })
    .populate("promoter", "name")
    .populate("project", "basicInfo.title");

  const results = [];

  for (const campaign of expiringCampaigns) {
    // Guard: a campaign somehow missing a valid expiresAt can't be processed
    // meaningfully (addDays on it would produce garbage) — skip it rather
    // than crash the whole run for every other campaign.
    if (!campaign.expiresAt || Number.isNaN(new Date(campaign.expiresAt).getTime())) continue;

    const projectTitle = campaign.project?.basicInfo?.title || "Untitled Project";
    const subscription = await Subscription.findOne({ campaign: campaign._id });

    const before = {
      status: campaign.status,
      expiresAt: campaign.expiresAt,
      paceStatus: campaign.paceStatus,
    };

    const metCommitment = campaign.deliveredCount >= campaign.committedMinimum;

    if (!metCommitment) {
      // Minimum not met — extend by 7 days
      const newExpiresAt = new Date(new Date(campaign.expiresAt).getTime() + 7 * 24 * 60 * 60 * 1000);
      campaign.expiresAt = newExpiresAt;
      campaign.paceStatus = "behind";
      await campaign.save();

      if (subscription) {
        subscription.endDate = newExpiresAt;
        await subscription.save();
      }

      if (campaign.promoter) {
        await notifyCampaignExpiryExtended({ promoterId: campaign.promoter._id, projectTitle });
      }
      await notifyAdminCampaignExtended({
        campaignId: campaign._id,
        projectTitle,
        deliveredCount: campaign.deliveredCount,
        committedMinimum: campaign.committedMinimum,
      });

      // Module 12 Task 12.1 — CAMPAIGN_EXTENDED, same action name as the
      // admin-manual extend in campaignController.js (extendCampaign) — same
      // underlying fact (expiresAt pushed out), just a different trigger,
      // distinguished via actorRole/reason rather than a separate action.
      await writeAudit({
        actor: campaign.promoter?._id,
        actorRole: "system",
        action: "CAMPAIGN_EXTENDED",
        entity: "Campaign",
        entityId: campaign._id,
        before,
        after: { status: campaign.status, expiresAt: campaign.expiresAt, paceStatus: campaign.paceStatus },
        reason: `Committed minimum not met (${campaign.deliveredCount}/${campaign.committedMinimum}) — auto-extended 7 days`,
      });

      results.push({ campaignId: campaign._id, outcome: "extended", newExpiresAt });
    } else {
      // Minimum met — mark expired
      campaign.status = "expired";
      await campaign.save();

      if (subscription) {
        subscription.status = "expired";
        await subscription.save();
      }

      if (campaign.promoter) {
        await notifyCampaignCompleted({ promoterId: campaign.promoter._id, projectTitle });
      }
      await notifyAdminCampaignCompleted({ campaignId: campaign._id, projectTitle });

      // Module 12 Task 12.1 — CAMPAIGN_EXPIRED, deliberately distinct from
      // CAMPAIGN_COMPLETED (campaignController.js's admin-manual "Mark
      // Complete"): the underlying Campaign.status values are already
      // different too ('expired' here vs 'completed' there), so the audit
      // action names stay consistent with that existing distinction.
      await writeAudit({
        actor: campaign.promoter?._id,
        actorRole: "system",
        action: "CAMPAIGN_EXPIRED",
        entity: "Campaign",
        entityId: campaign._id,
        before,
        after: { status: campaign.status },
        reason: `Committed minimum met (${campaign.deliveredCount}/${campaign.committedMinimum}) — auto-expired`,
      });

      results.push({ campaignId: campaign._id, outcome: "expired" });
    }
  }

  return results;
};

// Legacy per-account Subscription expiry check — pre-existing, predates the
// Campaign feature. Extracted into a named/exported function with the exact
// same behavior as before (same treatment as the two functions above), so
// its real code — not a reimplementation of its query — can be exercised
// directly in a test. The only actual behavior change from before Task 11.2
// is the `campaign: null` filter (see initCronJobs below for why); nothing
// else about it was touched.
const runLegacySubscriptionExpiryCheck = async () => {
  const now = new Date();
  const expiredSubscriptions = await Subscription.find({
    status: "active",
    endDate: { $lt: now },
    campaign: null,
  }).populate({
    path: "user",
    populate: { path: "builderProfile" }
  }).populate("plan");

  if (expiredSubscriptions.length === 0) {
    return [];
  }

  for (const sub of expiredSubscriptions) {
    // 2. Mark subscription as expired
    sub.status = "expired";
    await sub.save();

    // 3. Update user: set activeSubscription to null (fall back to default)
    await User.findByIdAndUpdate(sub.user, {
      activeSubscription: null
    });

    // 4. Send Email Notification
    const { sendSubscriptionExpiredNotification } = require("./emailService");
    if (sub.user) {
      await sendSubscriptionExpiredNotification(sub.user, sub);
    }
  }

  return expiredSubscriptions.map((s) => s._id);
};

// Promoter Module Task 11.3 — 7AM Self-Audit Job. Standalone/exported, same
// as the three functions above.
//
// "Check all cron jobs ran successfully" has no concrete mechanism anywhere
// in the doc, and no execution-history infrastructure exists in this
// codebase to check against (node-cron itself doesn't track run history).
// Per your explicit direction: this job's own successful completion — real
// numbers, freshly computed from the DB every morning — stands in as the
// evidence the system is healthy, rather than building new tracking
// infrastructure the task's own 45m estimate doesn't account for.
const runDailySelfAudit = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeCampaigns, pendingActivation, leadsImportedToday, behindPace, orphanedLeads, overDeliveredCandidates] =
    await Promise.all([
      Campaign.countDocuments({ status: "active" }),
      Campaign.countDocuments({ status: "payment_received" }),
      Requirement.countDocuments({ campaignId: { $ne: null }, deliveredAt: { $gte: startOfToday } }),
      Campaign.countDocuments({ status: "active", paceStatus: "behind" }),
      // Orphaned: campaignId set (a campaign lead) but never actually
      // delivered — a data-integrity anomaly, since CSV import always sets
      // deliveredAt in the same write that sets campaignId.
      Requirement.countDocuments({
        campaignId: { $ne: null },
        $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }],
      }),
      Campaign.find({ committedMinimum: { $gt: 0 } }).select("deliveredCount committedMinimum"),
    ]);

  const overDelivered = overDeliveredCandidates.filter((c) => c.deliveredCount > c.committedMinimum).length;

  const summary = { activeCampaigns, leadsImportedToday, pendingActivation, behindPace, orphanedLeads, overDelivered };

  const message = [
    `Active Campaigns    : ${summary.activeCampaigns}`,
    `Leads imported today: ${summary.leadsImportedToday}`,
    `Pending activation  : ${summary.pendingActivation}`,
    `Behind pace         : ${summary.behindPace}`,
    `Orphaned leads      : ${summary.orphanedLeads}`,
    `Over-delivered      : ${summary.overDelivered}`,
  ].join("\n");

  await notifyDailySelfAudit({ message });

  return summary;
};

const initCronJobs = (io) => {
  // Schedule task to run every minute for automated lead sharing
  cron.schedule("*/5 * * * * *", async () => {
    // console.log("🕒 Checking lead sharing timers...");
    try {
      const requirementsInProgress = await Requirement.find({ 
        sharingStatus: "in-progress" 
      });

      if (requirementsInProgress.length === 0) return;

      const { internalShareLeadWithPlanName } = require("../controllers/requirementController");

      for (const req of requirementsInProgress) {
        await processLeadSharingExpiry(req, io);
      }
    } catch (error) {
      console.error("❌ Error in lead sharing cron job:", error);
    }
  });

  // Schedule task to run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log(
      "🕒 Running daily cleanup for expired properties (21+ days)...",
    );

    try {
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

      // 1. Find properties older than 21 days
      const allExpiredProperties = await Property.find({
        createdAt: { $lt: twentyOneDaysAgo },
      }).populate({
        path: "seller",
        populate: { path: "role_id" },
      });

      // Filter out properties where seller is ADMIN
      const expiredProperties = allExpiredProperties.filter((property) => {
        const roleName = property.seller?.role_id?.role_name?.toUpperCase();
        return roleName !== "ADMIN";
      });

      if (expiredProperties.length === 0) {
        // console.log("✅ No expired properties found for cleanup.");
        return;
      }

      console.log(
        `Found ${expiredProperties.length} expired properties. Cleaning up...`,
      );

      // 2. Cleanup and Notify
      for (const property of expiredProperties) {
        const title = property.basicInfo?.title || "Untitled Property";

        // Notify seller via WebSocket before deletion
        if (io && property.seller) {
          io.to(`seller-${property.seller._id}`).emit("property-expired", {
            message: `Your property "${title}" has expired and has been removed.`,
            propertyId: property._id,
            title: title,
          });
        }

        // Cleanup associated image files from the filesystem
        const imagesToDelete = [];
        if (property.media?.featuredImage) imagesToDelete.push(property.media.featuredImage);
        if (property.media?.images && Array.isArray(property.media.images)) {
          imagesToDelete.push(...property.media.images);
        }
        if (property.media?.floorPlan) imagesToDelete.push(property.media.floorPlan);

        for (const imageUrl of imagesToDelete) {
          if (imageUrl) {
            const fileName = path.basename(imageUrl);
            const filePath = path.join(
              __dirname,
              "../uploads/properties",
              fileName,
            );

            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              console.error(`Error deleting file ${filePath}:`, err);
            }
          }
        }
      }

      // 3. Delete property records from database
      const deleteResult = await Property.deleteMany({
        _id: { $in: expiredProperties.map((p) => p._id) },
      });

      console.log(
        `✅ Successfully deleted ${deleteResult.deletedCount} properties and their files.`,
      );
    } catch (error) {
      console.error("❌ Error in property cleanup cron job:", error);
    }
  });
  
  // Schedule task to run every 30 minutes for subscription expiry.
  // campaign: null (inside runLegacySubscriptionExpiryCheck above) excludes
  // campaign-linked subscriptions (Builder/Promoter) — those are owned
  // entirely by runCampaignExpiryCheck (Task 11.2), the only place that
  // knows whether a campaign should be extended (commitment not met) before
  // its Subscription is allowed to expire. This generic per-account cron
  // predates campaigns and still handles Seller/Agent/Owner exactly as
  // before — that filter only narrows it, nothing else about it changed.
  cron.schedule("*/30 * * * *", async () => {
    console.log("🕒 Running periodic check for expired subscriptions...");
    try {
      const processedIds = await runLegacySubscriptionExpiryCheck();
      if (processedIds.length === 0) {
        // console.log("✅ No expired subscriptions found.");
        return;
      }
      console.log(`✅ Successfully processed ${processedIds.length} expired subscriptions.`);
    } catch (error) {
      console.error("❌ Error in subscription expiry cron job:", error);
    }
  });

  // Schedule task to run every hour for subscription expiry warning (7 days)
  cron.schedule("0 * * * *", async () => {
    console.log("🕒 Running periodic check for subscriptions expiring in 7 days...");
    try {
      const sevenDaysFromNowStart = new Date();
      sevenDaysFromNowStart.setDate(sevenDaysFromNowStart.getDate() + 7);
      sevenDaysFromNowStart.setHours(0, 0, 0, 0);

      const sevenDaysFromNowEnd = new Date();
      sevenDaysFromNowEnd.setDate(sevenDaysFromNowEnd.getDate() + 7);
      sevenDaysFromNowEnd.setHours(23, 59, 59, 999);

      // 1. Find all active subscriptions that expire in 7 days
      const expiringSubscriptions = await Subscription.find({
        status: "active",
        endDate: { $gte: sevenDaysFromNowStart, $lte: sevenDaysFromNowEnd }
      }).populate({
        path: "user",
        populate: { path: "builderProfile" }
      }).populate("plan");

      if (expiringSubscriptions.length === 0) {
        // console.log("✅ No subscriptions expiring in 7 days.");
        return;
      }

      console.log(`Found ${expiringSubscriptions.length} subscriptions expiring in 7 days. Sending warnings...`);

      const { sendSubscriptionExpiryWarning } = require("./emailService");

      for (const sub of expiringSubscriptions) {
        if (sub.user) {
          await sendSubscriptionExpiryWarning(sub.user, sub, 7);
        }
      }

      console.log(`✅ Successfully sent ${expiringSubscriptions.length} subscription expiry warnings.`);
    } catch (error) {
      console.error("❌ Error in subscription expiry warning cron job:", error);
    }
  });

  // Schedule task to run every hour for subscription expiry warning (1 day)
  cron.schedule("15 * * * *", async () => {
    console.log("🕒 Running periodic check for subscriptions expiring in 1 day...");
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // 1. Find all active subscriptions that expire tomorrow
      const expiringSubscriptions = await Subscription.find({
        status: "active",
        endDate: { $gte: tomorrowStart, $lte: tomorrowEnd }
      }).populate({
        path: "user",
        populate: { path: "builderProfile" }
      }).populate("plan");

      if (expiringSubscriptions.length === 0) {
        // console.log("✅ No subscriptions expiring tomorrow.");
        return;
      }

      console.log(`Found ${expiringSubscriptions.length} subscriptions expiring tomorrow. Sending final warnings...`);

      const { sendSubscriptionExpiryWarning } = require("./emailService");

      for (const sub of expiringSubscriptions) {
        if (sub.user) {
          await sendSubscriptionExpiryWarning(sub.user, sub, 1);
        }
      }

      console.log(`✅ Successfully sent ${expiringSubscriptions.length} final subscription expiry warnings.`);
    } catch (error) {
      console.error("❌ Error in subscription expiry warning (1 day) cron job:", error);
    }
  });


  // Schedule task to run daily at 7:00 AM — Task 11.1
  cron.schedule("0 7 * * *", async () => {
    console.log("🕒 Running daily campaign pacing check...");
    try {
      const results = await runCampaignPacingCheck();
      if (results.length === 0) {
        console.log("✅ Campaign pacing check complete. No pace-status changes.");
      } else {
        results.forEach((r) => console.log(`Campaign ${r.campaignId} pace: ${r.from} -> ${r.to}`));
        console.log(`✅ Campaign pacing check complete. ${results.length} campaign(s) changed pace status.`);
      }
    } catch (error) {
      console.error("❌ Error in campaign pacing cron job:", error);
    }
  });

  // Schedule task to run daily at midnight — Task 11.2
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running daily campaign expiry check...");
    try {
      const results = await runCampaignExpiryCheck();
      if (results.length === 0) {
        console.log("✅ Campaign expiry check complete. No campaigns due.");
      } else {
        results.forEach((r) => console.log(`Campaign ${r.campaignId}: ${r.outcome}`));
        console.log(`✅ Campaign expiry check complete. ${results.length} campaign(s) processed.`);
      }
    } catch (error) {
      console.error("❌ Error in campaign expiry cron job:", error);
    }
  });

  // Schedule task to run daily at 7:00 AM — Task 11.3 (independent of the
  // Task 11.1 pacing check above, which also runs at 7:00 AM — two separate
  // registrations, node-cron fires both)
  cron.schedule("0 7 * * *", async () => {
    console.log("🕒 Running daily self-audit...");
    try {
      const summary = await runDailySelfAudit();
      console.log(`✅ Daily audit complete: ${JSON.stringify(summary)}`);
    } catch (error) {
      console.error("❌ Error in daily self-audit cron job:", error);
    }
  });

  console.log(
    "🚀 Property & Subscription cron jobs initialized.",
  );
};
module.exports = {
  initCronJobs,
  runCampaignPacingCheck,
  runCampaignExpiryCheck,
  runLegacySubscriptionExpiryCheck,
  runDailySelfAudit,
};
