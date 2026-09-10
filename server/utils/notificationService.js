const Notification = require("../models/Notification");
const User = require("../models/User");
const Role = require("../models/Role");

// Portal notification — Promoter Module Task 6.1.
// Trigger point per the task spec: "when admin confirms CSV import → leads
// assigned to project." The CSV import controller doesn't exist yet anywhere
// in this codebase (no server/controllers/csvImportController.js) — so this
// utility is real and tested, but nothing calls it yet. Wire a call to this
// from the CSV import controller once that task is built.
const sendPortalNotification = async ({ userId, title, message, type, link, leadId, relatedModel }) => {
  await Notification.create({
    recipient: userId,
    title,
    message,
    type,
    link,
    relatedId: leadId,
    relatedModel: relatedModel || (leadId ? "Requirement" : undefined),
  });
};

// Lead Limit Reached — Promoter Module Task 6.2.
// Same trigger dependency as sendPortalNotification's doc comment above: meant
// to be called from the CSV import controller once it exists, right after it
// increments Campaign.deliveredCount / Property.deliveredLeads and detects
// deliveredCount >= committedMinimum. Nothing calls this yet.
//
// Note: the task's own spec names link: '/promoter/plans', which isn't a real
// route anywhere in the app. Using the actual plan-selection page built in
// Promoter Module Task 4.1 instead, so the notification doesn't 404.
const notifyLeadLimitReached = async ({ promoter, project, plan, committedMinimum }) => {
  await sendPortalNotification({
    userId: promoter._id,
    title: "Lead Limit Reached",
    message: `Your ${plan.name} plan for ${project.title} has reached its limit of ${committedMinimum} leads. Contact admin to extend your plan.`,
    type: "lead_limit_reached",
    link: "/seller/plans/select",
  });
};

// Shared admin-recipient lookup — same Role-admin + isSuperAdmin pattern
// already used for the push notification in verifyCampaignPayment
// (Promoter Module Task 4.3), reused here for portal notifications.
const getAdminRecipientIds = async () => {
  const adminIds = new Set(
    (await User.find({ isSuperAdmin: true }).distinct("_id")).map(String),
  );
  const adminRole = await Role.findOne({ role_name: { $regex: /^admin$/i } });
  if (adminRole) {
    (await User.find({ role_id: adminRole._id }).distinct("_id")).forEach((id) =>
      adminIds.add(String(id)),
    );
  }
  return [...adminIds];
};

// Promoter Lead Limit Reached (Admin) — Promoter Module Task 6.3.
// Same trigger dependency as the two notifications above — meant to be called
// alongside notifyLeadLimitReached from inside CSV import, once that exists.
//
// The task's pseudocode takes a single adminUser, but any admin/super-admin
// should plausibly see this, so this resolves recipients the same way
// verifyCampaignPayment already does and sends one notification per admin
// (each needs their own row to have independent read/unread state).
//
// Note: link: `/admin/campaigns/${campaign._id}` is kept as specified, but
// no admin campaign page/route exists anywhere yet (Admin Module Task 3.3) —
// clicking this notification will 404 until that's built.
const notifyPromoterLeadLimitReached = async ({ promoter, project, campaign, deliveredCount, committedMinimum }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Promoter Lead Limit Reached",
        message: `${promoter.name} — ${project.title} has reached ${deliveredCount}/${committedMinimum} leads.`,
        type: "admin_lead_limit",
        link: `/admin/campaigns/${campaign._id}`,
      }),
    ),
  );
};

// New Campaign Payment (Admin) — Promoter Module Task 6.4.
// Unlike 6.1-6.3, this trigger already exists for real: it's called directly
// from verifyCampaignPayment (Task 4.3), right after the Razorpay signature
// is verified for a campaign order — see subscriptionController.js.
//
// Note: link: '/admin/campaigns/pending' is kept as specified, but no admin
// campaign page/route exists anywhere yet (Admin Module Task 3.x/7.5) —
// clicking this notification will 404 until that's built, same as 6.3's link.
const notifyCampaignActivationRequired = async ({ promoter, project, plan, amount }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "New Campaign Payment — Action Required",
        message: `${promoter.name} paid ₹${amount} for ${plan.name} plan on ${project.title}. Please activate the campaign.`,
        type: "campaign_activation_required",
        link: "/admin/campaigns/pending",
      }),
    ),
  );
};

// Campaign Activated (Promoter) — Admin Task 7.2, step 9.
// Fired for real from campaignController.js's activateCampaign — this is a
// live trigger, not one waiting on CSV import like 6.1-6.3.
const notifyCampaignActivated = async ({ promoterId, projectTitle }) => {
  await sendPortalNotification({
    userId: promoterId,
    title: "Campaign Activated",
    message: `Your plan is active! Leads for ${projectTitle} will start arriving.`,
    type: "campaign_activated",
    link: "/seller/my-properties",
  });
};

// Pause / Extend / Complete (Promoter) — Admin Module Task 7.4.
// Fired for real from campaignController.js's pauseCampaign/extendCampaign/completeCampaign.
const notifyCampaignPaused = async ({ promoterId, projectTitle }) => {
  await sendPortalNotification({
    userId: promoterId,
    title: "Campaign Paused",
    message: `Your campaign for ${projectTitle} has been paused. Lead delivery is on hold until it's resumed.`,
    type: "campaign_paused",
    link: "/seller/my-properties",
  });
};

const notifyCampaignExtended = async ({ promoterId, projectTitle, extraDays }) => {
  await sendPortalNotification({
    userId: promoterId,
    title: "Campaign Extended",
    message: `Your plan for ${projectTitle} has been extended by ${extraDays} days.`,
    type: "campaign_extended",
    link: "/seller/my-properties",
  });
};

const notifyCampaignCompleted = async ({ promoterId, projectTitle }) => {
  await sendPortalNotification({
    userId: promoterId,
    title: "Campaign Complete",
    message: `Your plan for ${projectTitle} is complete. Contact admin to renew.`,
    type: "campaign_completed",
    link: "/seller/plans/select",
  });
};

// Campaign Pacing Check (Admin) — Promoter Module Task 11.1.
// Fired from the daily pacing cron in cronJobs.js, only on an actual
// paceStatus transition (see that file's own comment for why) — not once per
// day a campaign simply remains behind/ahead.
const notifyCampaignBehindPace = async ({ campaignId, projectTitle, dailyTarget, actualDailyAvg }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Campaign Behind Pace",
        message: `${projectTitle} is behind pace. Target: ${dailyTarget}/day | Actual: ${actualDailyAvg}/day`,
        type: "campaign_behind_pace",
        link: `/admin/campaigns/${campaignId}`,
      }),
    ),
  );
};

const notifyCampaignAheadOfPace = async ({ campaignId, projectTitle, dailyTarget, actualDailyAvg }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Campaign Ahead of Pace",
        message: `${projectTitle} is ahead of pace. Target: ${dailyTarget}/day | Actual: ${actualDailyAvg}/day`,
        type: "campaign_ahead_of_pace",
        link: `/admin/campaigns/${campaignId}`,
      }),
    ),
  );
};

// Campaign Expiry Check (Promoter + Admin) — Promoter Module Task 11.2.
// Fired from runCampaignExpiryCheck in cronJobs.js. The promoter-facing
// "completed" message is intentionally identical wording to
// notifyCampaignCompleted (Admin Task 7.4's Mark Complete) — same outcome
// from the promoter's point of view, just triggered automatically by expiry
// instead of manually by an admin — so that one is reused directly rather
// than duplicated. The other three are new: the exact wording and the
// delivered/committed counts in Task 11.2's spec don't match any existing
// function's signature.
const notifyCampaignExpiryExtended = async ({ promoterId, projectTitle }) => {
  await sendPortalNotification({
    userId: promoterId,
    title: "Campaign Extended",
    message: "Your plan has been extended. We will complete your leads.",
    type: "campaign_extended",
    link: "/seller/my-properties",
  });
};

const notifyAdminCampaignExtended = async ({ campaignId, projectTitle, deliveredCount, committedMinimum }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Campaign Extended (Commitment Not Met)",
        message: `${projectTitle} extended — ${deliveredCount}/${committedMinimum} leads`,
        type: "admin_campaign_extended",
        link: `/admin/campaigns/${campaignId}`,
      }),
    ),
  );
};

const notifyAdminCampaignCompleted = async ({ campaignId, projectTitle }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Campaign Completed",
        message: `${projectTitle} campaign completed.`,
        type: "admin_campaign_completed",
        link: `/admin/campaigns/${campaignId}`,
      }),
    ),
  );
};

// Daily Self-Audit (Admin) — Promoter Module Task 11.3. Portal-only, per the
// task's own wording ("Send summary to admin portal notification") — no push
// notification, matching how 11.1/11.2's admin notifications were also kept
// portal-only.
const notifyDailySelfAudit = async ({ message }) => {
  const adminIds = await getAdminRecipientIds();
  await Promise.all(
    adminIds.map((adminId) =>
      sendPortalNotification({
        userId: adminId,
        title: "Daily Audit",
        message,
        type: "daily_self_audit",
        link: "/admin/dashboard",
      }),
    ),
  );
};

module.exports = {
  sendPortalNotification,
  notifyLeadLimitReached,
  notifyPromoterLeadLimitReached,
  notifyCampaignActivationRequired,
  notifyCampaignActivated,
  notifyCampaignPaused,
  notifyCampaignExtended,
  notifyCampaignCompleted,
  notifyCampaignBehindPace,
  notifyCampaignAheadOfPace,
  notifyCampaignExpiryExtended,
  notifyAdminCampaignExtended,
  notifyAdminCampaignCompleted,
  notifyDailySelfAudit,
  getAdminRecipientIds,
};
