const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const PaymentHistory = require("../models/PaymentHistory");
const Coupon = require("../models/Coupon");
const Campaign = require("../models/Campaign");
const Property = require("../models/Property");
const { getVolumeDiscount } = require("../utils/discountUtils");
const { writeAudit } = require("../utils/auditLogger");
const { sendPushNotificationToMultiple } = require("../utils/pushNotification");
const { notifyCampaignActivationRequired, getAdminRecipientIds } = require("../utils/notificationService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Order
exports.createOrder = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Restriction: Standard Plan can only be purchased once
    if (plan.name.toLowerCase().includes("standard")) {
      const alreadyPurchased = await PaymentHistory.findOne({
        user: req.user._id,
        planName: { $regex: /standard/i },
        paymentStatus: "completed"
      });

      if (alreadyPurchased) {
        return res.status(403).json({ 
          success: false, 
          message: "The Standard Plan can only be purchased once. Please choose a different plan." 
        });
      }
    }

    let finalAmount = plan.price;
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: "active" });
      if (validCoupon) {
        const now = new Date();
        const userUsageCount = await PaymentHistory.countDocuments({
          user: req.user._id,
          couponCode: validCoupon.code,
          paymentStatus: "completed"
        });

        const isDateValid = (!validCoupon.startDate || now >= validCoupon.startDate) && (!validCoupon.endDate || now <= validCoupon.endDate);
        const isUsageValid = validCoupon.maxUsageTotal === null || validCoupon.usedCount < validCoupon.maxUsageTotal;
        const isUserUsageValid = userUsageCount < validCoupon.maxUsagePerUser;
        const isMinSpendValid = plan.price >= validCoupon.minSpend;

        if (isDateValid && isUsageValid && isUserUsageValid && isMinSpendValid) {
          if (validCoupon.discountType === "percentage") {
            discountAmount = (plan.price * validCoupon.discountValue) / 100;
          } else {
            discountAmount = validCoupon.discountValue;
          }
          // Ensure discount doesn't exceed plan price
          discountAmount = Math.min(discountAmount, plan.price);
          finalAmount = plan.price - discountAmount;
        } else {
          return res.status(400).json({ success: false, message: "Coupon is no longer valid or requirements not met" });
        }
      } else {
        return res.status(400).json({ success: false, message: "Invalid coupon code" });
      }
    }

    if (finalAmount <= 0) {
      return res.json({
        free: true,
        amount: 0,
        planName: plan.name,
        discountAmount,
        couponCode: validCoupon?.code
      });
    }

    const options = {
      amount: Math.round(finalAmount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      discountAmount,
      couponCode: validCoupon?.code
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify Payment & Activate/Upgrade Subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planId,
      couponCode,
      discountAmount 
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Razorpay Signature Mismatch!");
      console.error("Expected:", expectedSignature);
      console.error("Received:", razorpay_signature);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Calculate dates
    const startDate = new Date();
    let endDate = null;
    if (plan.duration) {
      endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);
    }
    
    console.log("--- Subscription Debug ---");
    console.log("Plan Name:", plan.name);
    console.log("Duration (Days):", plan.duration);
    console.log("Start Date (Raw):", startDate);
    console.log("End Date (Calculated):", endDate);
    console.log("--------------------------");

    // --- Lead Carry Forward Logic ---
    const oldActiveSubscription = await Subscription.findOne({ 
      user: req.user._id, 
      status: "active" 
    }).populate("plan");

    if (oldActiveSubscription && oldActiveSubscription.plan) {
      const leadsLimit = oldActiveSubscription.plan.leadsLimit || 0;
      if (leadsLimit !== -1) { // Only carry forward if it wasn't unlimited
        const unusedLeads = Math.max(0, leadsLimit - oldActiveSubscription.leadsUsed);
        if (unusedLeads > 0) {
          await User.findByIdAndUpdate(req.user._id, {
            $inc: { carriedLeads: unusedLeads }
          });
          console.log(`Carried forward ${unusedLeads} leads for user ${req.user._id}`);
        }
      }
    }

    // Remove old active subscriptions for this user
    await Subscription.deleteMany({ user: req.user._id });

    // Create Subscription record (Current Active Plan)
    const subscription = new Subscription({
      user: req.user._id,
      plan: planId,
      startDate,
      endDate,
      status: "active",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: "completed",
      amountPaid: plan.price,
    });

    await subscription.save();

    const finalAmount = plan.price - (discountAmount || 0);
    // Create Payment History record (Permanent)
    const paymentHistory = new PaymentHistory({
      user: req.user._id,
      plan: planId,
      planName: plan.name,
      amountPaid: finalAmount,
      finalAmount: finalAmount,
      originalPrice: plan.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: "completed",
      transactionDate: new Date(),
      expiryDate: endDate,
      couponCode,
      discountAmount
    });

    await paymentHistory.save();

    // If coupon was used, increment usedCount
    if (couponCode) {
      await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
    }

    // Update User's active subscription
    await User.findByIdAndUpdate(req.user._id, {
      activeSubscription: subscription._id,
    });

    res.json({ success: true, message: "Subscription activated successfully", subscription });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CAMPAIGN ORDER — Promoter Module Task 4.2
// POST /api/campaigns/create-order
// Distinct from the generic account-level createOrder/verifyPayment above:
// this is per-project (Campaign), not per-account (Subscription only).
// ============================================================
// ============================================================
// MY CAMPAIGN STATUS — backend-derived campaign count/discount/eligibility
// GET /api/campaigns/my-campaign-status
// Single source of truth for the counters createCampaignOrder itself enforces
// (non-terminal campaign count, volume discount tier, 5th-campaign block), so
// the Select Plan UI can show the same numbers the backend will actually apply
// instead of approximating them from Property.isCampaignActive.
// ============================================================
exports.getMyCampaignStatus = async (req, res) => {
  try {
    const promoterId = req.user._id;

    const activeCampaignCount = await Campaign.countDocuments({
      promoter: promoterId,
      status: { $nin: ["completed", "expired"] },
    });

    const volumeDiscount = getVolumeDiscount(activeCampaignCount);

    res.json({
      success: true,
      activeCampaignCount,
      nextCampaignPosition: activeCampaignCount + 1,
      isBlocked: activeCampaignCount >= 4,
      discountTier: volumeDiscount?.tier || null,
      discountPercent: volumeDiscount?.discount || 0,
    });
  } catch (error) {
    console.error("Get My Campaign Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Coupon helpers shared by createCampaignOrder / activateFreeCampaign.
// Re-implements the SAME checks as the legacy createOrder's inline coupon
// block (couponController.js and the Coupon model are not touched) so both
// purchase flows stay behaviorally consistent.
// ============================================================
const validateCouponForPurchase = async (couponCode, userId, planPriceForMinSpend) => {
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: "active" });
  if (!coupon) {
    return { error: "Invalid or inactive coupon code" };
  }

  const now = new Date();
  const isDateValid = (!coupon.startDate || now >= coupon.startDate) && (!coupon.endDate || now <= coupon.endDate);
  if (!isDateValid) {
    return { error: "Coupon is not active or has expired" };
  }

  if (planPriceForMinSpend < coupon.minSpend) {
    return { error: `Minimum spend of ₹${coupon.minSpend} required for this coupon` };
  }

  const isUsageValid = coupon.maxUsageTotal === null || coupon.usedCount < coupon.maxUsageTotal;
  if (!isUsageValid) {
    return { error: "Coupon usage limit reached" };
  }

  const userUsageCount = await PaymentHistory.countDocuments({
    user: userId,
    couponCode: coupon.code,
    paymentStatus: "completed",
  });
  if (userUsageCount >= coupon.maxUsagePerUser) {
    return { error: "You have already used this coupon the maximum number of times" };
  }

  return { coupon };
};

// discountAmount is clamped so it never exceeds the amount it's applied
// against — and since that base is itself already <= plan.price (it's the
// volume-discounted amount), the coupon discount can never exceed plan.price.
const computeCouponDiscount = (coupon, baseAmount) => {
  const rawDiscount = coupon.discountType === "percentage" ? (baseAmount * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(Math.round(rawDiscount), baseAmount);
};

exports.createCampaignOrder = async (req, res) => {
  try {
    const { projectId, planId, couponCode } = req.body;
    const promoterId = req.user._id;

    if (!projectId || !planId) {
      return res.status(400).json({ success: false, message: "projectId and planId are required" });
    }

    // 1. Validate projectId belongs to this promoter
    const project = await Property.findOne({ _id: projectId, seller: promoterId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found or does not belong to you" });
    }

    // 2. No non-terminal campaign may already exist for this project (one campaign : one project)
    const existingCampaignForProject = await Campaign.findOne({
      project: projectId,
      status: { $nin: ["completed", "expired"] },
    });
    if (existingCampaignForProject) {
      return res.status(400).json({
        success: false,
        message: "This project already has an active or pending campaign.",
      });
    }

    // 3. Count this promoter's non-terminal campaigns (occupied slots) — 5th blocked
    const activeCampaignCount = await Campaign.countDocuments({
      promoter: promoterId,
      status: { $nin: ["completed", "expired"] },
    });

    if (activeCampaignCount >= 4) {
      return res.status(403).json({
        success: false,
        reason: "enterprise_required",
        message: "You already have 4 active campaigns — the maximum on a standard plan. Contact admin for an Enterprise plan.",
      });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // 4. 2nd+ campaign: block Starter, apply volume discount
    const isStarter = plan.name.toLowerCase().includes("starter");
    if (activeCampaignCount >= 1 && isStarter) {
      return res.status(400).json({
        success: false,
        reason: "starter_blocked",
        message: "Starter plan is only available for your first campaign. Choose Growth or Pro for additional campaigns.",
      });
    }

    if (!plan.committedMinimum || plan.committedMinimum <= 0) {
      return res.status(500).json({
        success: false,
        message: "This plan has no committed lead minimum configured yet. Contact admin.",
      });
    }

    const { tier: discountTier, discount: volumeDiscountPercent } = getVolumeDiscount(activeCampaignCount);
    const amountAfterVolumeDiscount = Math.round(plan.price * (1 - volumeDiscountPercent / 100));

    // Optional coupon — applied AFTER the volume discount (documented order,
    // see the Section C write-up): volume discount is the structural,
    // tier-based price the promoter already qualifies for; the coupon is a
    // promotional discount layered on top of that, not on the sticker price.
    // minSpend is checked against the ORIGINAL plan.price, matching the one
    // existing precedent (the legacy createOrder's own coupon check), so
    // minSpend semantics stay consistent platform-wide.
    let finalAmount = amountAfterVolumeDiscount;
    let couponDiscountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const { coupon, error } = await validateCouponForPurchase(couponCode, promoterId, plan.price);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      couponDiscountAmount = computeCouponDiscount(coupon, amountAfterVolumeDiscount);
      finalAmount = Math.max(0, amountAfterVolumeDiscount - couponDiscountAmount);
      appliedCouponCode = coupon.code;
    }

    const isFree = finalAmount <= 0;

    // 5. Create Razorpay order — skipped entirely when the coupon covers the
    // full amount. No fake Razorpay order/payment data is ever generated.
    let order = null;
    if (!isFree) {
      order = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // paise
        currency: "INR",
        receipt: `campaign_${Date.now()}`,
        notes: {
          projectId: String(projectId),
          planId: String(planId),
          promoterId: String(promoterId),
        },
      });
    }

    // 6. Create Campaign — status: 'draft' until payment is verified/free-activated
    const campaign = await Campaign.create({
      promoter: promoterId,
      project: projectId,
      plan: planId,
      committedMinimum: plan.committedMinimum,
      status: "draft",
      discountTier,
    });

    // 7. Create Subscription linked to the campaign — status: pending until
    // verify-payment/activate-free flips it. startDate/endDate here are
    // provisional (order-time estimate); Task 7.2's campaign activation
    // resets goLiveAt/expiresAt to the real go-live date.
    const durationDays = plan.duration || 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user: promoterId,
      plan: planId,
      campaign: campaign._id,
      project: projectId,
      startDate,
      endDate,
      status: "pending",
      razorpayOrderId: isFree ? `FREE_COUPON_${campaign._id}` : order.id,
      paymentStatus: "pending",
      amountPaid: finalAmount,
    });

    // Module 12 Task 12.1 — CAMPAIGN_CREATED. The task describes this as
    // "when admin creates campaign", but in the actual implemented flow a
    // Campaign is always created here, at promoter-initiated order-creation
    // time (admin only ever activates/pauses/extends/completes an existing
    // one) — actorRole reflects that accurately rather than mislabeling it.
    try {
      await writeAudit({
        actor: promoterId,
        actorRole: "promoter",
        action: "CAMPAIGN_CREATED",
        entity: "Campaign",
        entityId: campaign._id,
        before: null,
        after: { status: campaign.status, plan: plan.name, committedMinimum: campaign.committedMinimum },
        reason: `Campaign order created for project ${projectId}`,
      });
    } catch (auditError) {
      console.error("Campaign-created audit error (createCampaignOrder):", auditError);
    }

    res.json({
      success: true,
      free: isFree,
      orderId: isFree ? null : order.id,
      amount: isFree ? 0 : order.amount,
      currency: isFree ? "INR" : order.currency,
      campaignId: campaign._id,
      subscriptionId: subscription._id,
      planName: plan.name,
      planPrice: plan.price,
      discountTier,
      discountPercent: volumeDiscountPercent,
      couponCode: appliedCouponCode,
      couponDiscountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Create Campaign Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ACTIVATE FREE CAMPAIGN — 100%-coupon path
// POST /api/campaigns/activate-free
// Mirrors verifyCampaignPayment's side effects exactly (same idempotency
// guard, same records written), without any real Razorpay transaction.
// Never trusts a client-asserted "this is free" — the final amount is always
// recomputed here from data recorded at order-creation time.
// ============================================================
exports.activateFreeCampaign = async (req, res) => {
  try {
    const { campaignId, couponCode } = req.body;
    const promoterId = req.user._id;

    if (!campaignId) {
      return res.status(400).json({ success: false, message: "campaignId is required" });
    }

    const campaign = await Campaign.findOne({ _id: campaignId, promoter: promoterId })
      .populate("plan")
      .populate("project");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.status !== "draft") {
      // Already processed (or in an unexpected state) — don't reprocess. This
      // is the retry/duplicate-request guard: a second call with the same
      // campaignId lands here and is rejected BEFORE any coupon usage is
      // incremented or any record is written again.
      return res.status(400).json({
        success: false,
        message: `Campaign is already in '${campaign.status}' status`,
      });
    }

    const subscription = await Subscription.findOne({ campaign: campaign._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Matching order not found for this campaign" });
    }

    // Recompute the final amount from the campaign's own recorded discountTier
    // + the plan's real price — never from anything the client sends.
    const { discount: volumeDiscountPercent } = getVolumeDiscount(campaign.discountTier - 1);
    const amountAfterVolumeDiscount = Math.round(campaign.plan.price * (1 - volumeDiscountPercent / 100));

    let finalAmount = amountAfterVolumeDiscount;
    let couponDiscountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const { coupon, error } = await validateCouponForPurchase(couponCode, promoterId, campaign.plan.price);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      couponDiscountAmount = computeCouponDiscount(coupon, amountAfterVolumeDiscount);
      finalAmount = Math.max(0, amountAfterVolumeDiscount - couponDiscountAmount);
      appliedCoupon = coupon;
    }

    if (finalAmount > 0) {
      return res.status(400).json({
        success: false,
        message: "This campaign is not fully covered by a coupon — complete payment via Razorpay instead.",
      });
    }

    const beforeCampaignStatus = campaign.status;

    // 1. Campaign -> payment_received (NOT active — admin activates separately, Task 7.2)
    campaign.status = "payment_received";
    await campaign.save();

    // 2. Subscription -> active
    subscription.status = "active";
    subscription.paymentStatus = "completed";
    subscription.amountPaid = 0;
    await subscription.save();

    // 3. Property.committedLeads = plan.committedMinimum
    await Property.findByIdAndUpdate(campaign.project._id, {
      committedLeads: campaign.plan.committedMinimum,
    });

    // 4. PaymentHistory linked to campaign + project
    await PaymentHistory.create({
      user: promoterId,
      plan: campaign.plan._id,
      planName: campaign.plan.name,
      amountPaid: 0,
      finalAmount: 0,
      originalPrice: campaign.plan.price,
      razorpayOrderId: subscription.razorpayOrderId,
      razorpayPaymentId: `FREE_COUPON_${campaign._id}`,
      paymentStatus: "completed",
      expiryDate: subscription.endDate,
      campaign: campaign._id,
      project: campaign.project._id,
      couponCode: appliedCoupon?.code,
      discountAmount: appliedCoupon ? amountAfterVolumeDiscount : 0,
    });

    // 5. Coupon usage — incremented only after every guard above has passed,
    // so a retried request can never double-count (blocked by the
    // draft-status check well before this line runs).
    if (appliedCoupon) {
      await Coupon.findOneAndUpdate({ code: appliedCoupon.code }, { $inc: { usedCount: 1 } });
    }

    // 6. AuditLog: PAYMENT_RECEIVED
    await writeAudit({
      actor: promoterId,
      actorRole: "promoter",
      action: "PAYMENT_RECEIVED",
      entity: "Campaign",
      entityId: campaign._id,
      before: { status: beforeCampaignStatus },
      after: { status: campaign.status },
      reason: appliedCoupon
        ? `Campaign fully covered by coupon ${appliedCoupon.code}`
        : "Campaign fully covered (₹0 amount)",
    });

    // 7. Notify admin — push (immediate) + portal (persisted, Task 6.4)
    try {
      const promoter = await User.findById(promoterId);
      const projectTitle = campaign.project.basicInfo?.title || "project";
      const adminIds = await getAdminRecipientIds();

      if (adminIds.length > 0) {
        await sendPushNotificationToMultiple(adminIds, {
          title: "New Campaign Payment — Action Required",
          body: `New payment received — activate campaign for ${promoter?.name || "a promoter"} / ${projectTitle}`,
        });
      }

      await notifyCampaignActivationRequired({
        promoter: promoter || { name: "A promoter" },
        project: { title: projectTitle },
        plan: campaign.plan,
        amount: 0,
      });
    } catch (notifyError) {
      console.error("Admin notify error (activateFreeCampaign):", notifyError);
    }

    // 8. Return success to promoter
    res.json({
      success: true,
      message: "Campaign activated via coupon — payment received, admin activating soon",
      campaignId: campaign._id,
      campaignStatus: campaign.status,
    });
  } catch (error) {
    console.error("Activate Free Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// VERIFY CAMPAIGN PAYMENT — Promoter Module Task 4.3
// POST /api/campaigns/verify-payment
// Campaign lands on 'payment_received', NOT 'active' — admin activation is a
// separate step (Task 7.2). Distinct from the generic verifyPayment above.
// ============================================================
exports.verifyCampaignPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaignId } = req.body;
    const promoterId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !campaignId) {
      return res.status(400).json({ success: false, message: "Missing payment or campaign details" });
    }

    // Verify Razorpay signature (same method as the generic verifyPayment)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Campaign must belong to this promoter and still be awaiting payment
    const campaign = await Campaign.findOne({ _id: campaignId, promoter: promoterId })
      .populate("plan")
      .populate("project");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.status !== "draft") {
      // Already processed (or in an unexpected state) — don't reprocess.
      return res.status(400).json({
        success: false,
        message: `Campaign is already in '${campaign.status}' status`,
      });
    }

    // The order must be the one created for this exact campaign (Task 4.2)
    const subscription = await Subscription.findOne({
      campaign: campaign._id,
      razorpayOrderId: razorpay_order_id,
    });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Matching order not found for this campaign" });
    }

    const beforeCampaignStatus = campaign.status;

    // 1. Campaign -> payment_received (NOT active — admin activates separately, Task 7.2)
    campaign.status = "payment_received";
    await campaign.save();

    // 2. Subscription -> active
    subscription.status = "active";
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.paymentStatus = "completed";
    await subscription.save();

    // 3. Property.committedLeads = plan.committedMinimum
    await Property.findByIdAndUpdate(campaign.project._id, {
      committedLeads: campaign.plan.committedMinimum,
    });

    // 4. PaymentHistory linked to campaign + project
    await PaymentHistory.create({
      user: promoterId,
      plan: campaign.plan._id,
      planName: campaign.plan.name,
      amountPaid: subscription.amountPaid,
      finalAmount: subscription.amountPaid,
      originalPrice: campaign.plan.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: "completed",
      expiryDate: subscription.endDate,
      campaign: campaign._id,
      project: campaign.project._id,
    });

    // 5. AuditLog: PAYMENT_RECEIVED
    await writeAudit({
      actor: promoterId,
      actorRole: "promoter",
      action: "PAYMENT_RECEIVED",
      entity: "Campaign",
      entityId: campaign._id,
      before: { status: beforeCampaignStatus },
      after: { status: campaign.status },
      reason: `Razorpay payment ${razorpay_payment_id} verified`,
    });

    // 6. Notify admin — push (immediate) + portal (persisted, Task 6.4).
    // Push-first matches the channel policy; portal gives admin a dismissible
    // record since a push can be missed if the device is offline.
    try {
      const promoter = await User.findById(promoterId);
      const projectTitle = campaign.project.basicInfo?.title || "project";
      const adminIds = await getAdminRecipientIds();

      if (adminIds.length > 0) {
        await sendPushNotificationToMultiple(adminIds, {
          title: "New Campaign Payment — Action Required",
          body: `New payment received — activate campaign for ${promoter?.name || "a promoter"} / ${projectTitle}`,
        });
      }

      await notifyCampaignActivationRequired({
        promoter: promoter || { name: "A promoter" },
        project: { title: projectTitle },
        plan: campaign.plan,
        amount: subscription.amountPaid,
      });
    } catch (notifyError) {
      // Never fail the payment confirmation because a notification failed to send.
      console.error("Admin notify error (verifyCampaignPayment):", notifyError);
    }

    // 7. Return success to promoter
    res.json({
      success: true,
      message: "Payment received, admin activating soon",
      campaignId: campaign._id,
      campaignStatus: campaign.status,
    });
  } catch (error) {
    console.error("Verify Campaign Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// MY CAMPAIGN BILLING — Promoter Module Task 4.5 (backend support)
// GET /api/campaigns/my-billing
// Per-project active plans + campaign-only payment history. Distinct from
// getMyPaymentHistory (account-level, generic, used by SellerPaymentHistory.jsx).
// ============================================================
exports.getMyCampaignBilling = async (req, res) => {
  try {
    const promoterId = req.user._id;

    const subscriptions = await Subscription.find({ user: promoterId, campaign: { $ne: null } })
      .populate("plan", "name displayName price duration")
      .populate("project", "basicInfo.title committedLeads deliveredLeads")
      .populate("campaign", "status")
      .sort({ createdAt: -1 });

    const activePlans = subscriptions
      .filter((s) => s.status === "active" && s.project)
      .map((s) => ({
        subscriptionId: s._id,
        projectId: s.project._id,
        projectTitle: s.project.basicInfo?.title || "Untitled Project",
        planName: s.plan?.displayName || s.plan?.name || "—",
        amountPaid: s.amountPaid,
        committedLeads: s.project.committedLeads || 0,
        deliveredLeads: s.project.deliveredLeads || 0,
        campaignStatus: s.campaign?.status || "unknown",
      }));

    const paymentHistoryDocs = await PaymentHistory.find({ user: promoterId, campaign: { $ne: null } })
      .populate("plan", "name displayName")
      .populate("project", "basicInfo.title")
      .sort({ transactionDate: -1 });

    const paymentHistory = paymentHistoryDocs.map((p) => ({
      _id: p._id,
      date: p.transactionDate,
      projectTitle: p.project?.basicInfo?.title || "—",
      planName: p.plan?.displayName || p.plan?.name || "—",
      amountPaid: p.amountPaid,
    }));

    res.json({ activePlans, paymentHistory });
  } catch (error) {
    console.error("Get My Campaign Billing Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2b. Activate Free Plan (100% Discount Coupon)
exports.activateFreePlan = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: "active" });
    if (!coupon) return res.status(400).json({ error: "Invalid coupon" });

    // Check if it's actually 100% discount
    let calcDiscount = 0;
    if (coupon.discountType === "percentage") {
      calcDiscount = (plan.price * coupon.discountValue) / 100;
    } else {
      calcDiscount = coupon.discountValue;
    }

    if (calcDiscount < plan.price) {
      return res.status(400).json({ error: "Coupon does not provide a 100% discount" });
    }

    // Double check usage limits
    const now = new Date();
    const userUsageCount = await PaymentHistory.countDocuments({
      user: req.user._id,
      couponCode: coupon.code,
      paymentStatus: "completed"
    });

    const isDateValid = (!coupon.startDate || now >= coupon.startDate) && (!coupon.endDate || now <= coupon.endDate);
    const isUsageValid = coupon.maxUsageTotal === null || coupon.usedCount < coupon.maxUsageTotal;
    const isUserUsageValid = userUsageCount < coupon.maxUsagePerUser;
    const isMinSpendValid = plan.price >= coupon.minSpend;

    if (!isDateValid || !isUsageValid || !isUserUsageValid || !isMinSpendValid) {
      return res.status(400).json({ error: "Coupon is no longer valid or requirements not met" });
    }

    // Calculate dates
    const startDate = new Date();
    let endDate = null;
    if (plan.duration) {
      endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);
    }

    // --- Lead Carry Forward Logic --- (Same as verifyPayment)
    const oldActiveSubscription = await Subscription.findOne({ 
      user: req.user._id, 
      status: "active" 
    }).populate("plan");

    if (oldActiveSubscription && oldActiveSubscription.plan) {
      const leadsLimit = oldActiveSubscription.plan.leadsLimit || 0;
      if (leadsLimit !== -1) {
        const unusedLeads = Math.max(0, leadsLimit - oldActiveSubscription.leadsUsed);
        if (unusedLeads > 0) {
          await User.findByIdAndUpdate(req.user._id, {
            $inc: { carriedLeads: unusedLeads }
          });
        }
      }
    }

    // Remove old active subscriptions for this user
    await Subscription.deleteMany({ user: req.user._id });

    // Create Subscription record
    const subscription = new Subscription({
      user: req.user._id,
      plan: planId,
      startDate,
      endDate,
      status: "active",
      razorpayOrderId: "FREE_COUPON_" + Date.now(),
      razorpayPaymentId: "FREE_COUPON_" + Date.now(),
      paymentStatus: "completed",
      amountPaid: 0,
    });
    await subscription.save();

    // Create Payment History record
    const paymentHistory = new PaymentHistory({
      user: req.user._id,
      plan: planId,
      planName: plan.name,
      amountPaid: 0,
      finalAmount: 0,
      originalPrice: plan.price,
      razorpayOrderId: subscription.razorpayOrderId,
      razorpayPaymentId: subscription.razorpayPaymentId,
      paymentStatus: "completed",
      transactionDate: new Date(),
      expiryDate: endDate,
      couponCode: coupon.code,
      discountAmount: plan.price
    });
    await paymentHistory.save();

    // Update User's active subscription
    await User.findByIdAndUpdate(req.user._id, {
      activeSubscription: subscription._id,
    });

    // Increment coupon usedCount
    await Coupon.findOneAndUpdate({ code: coupon.code }, { $inc: { usedCount: 1 } });

    res.json({ success: true, message: "Subscription activated successfully via coupon", subscription });
  } catch (error) {
    console.error("Free Activation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get User Subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      user: req.user._id, 
      status: "active" 
    }).populate("plan");
    
    // On-the-fly expiry check
    if (subscription && subscription.endDate && new Date(subscription.endDate) < new Date()) {
      if (subscription.status !== "expired") {
        // Carry forward unused leads before marking as expired
        const leadsLimit = subscription.plan?.leadsLimit || 0;
        if (leadsLimit !== -1) {
          const unusedLeads = Math.max(0, leadsLimit - subscription.leadsUsed);
          if (unusedLeads > 0) {
            await User.findByIdAndUpdate(req.user._id, {
              $inc: { carriedLeads: unusedLeads }
            });
            console.log(`Auto-carried forward ${unusedLeads} leads for user ${req.user._id}`);
          }
        }
        
        subscription.status = "expired";
        await subscription.save();
      }
      // We still return it so the frontend can show an "Expired" message/modal
      return res.json(subscription);
    }
    
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Admin: Get Subscriptions Expiring Soon (within 7 days)
exports.getExpiringSoonSubscriptions = async (req, res) => {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const now = new Date();

    const subscriptions = await Subscription.find({
      status: "active",
      endDate: { $lte: sevenDaysFromNow, $gt: now }
    })
    .populate("user", "name phone email customId")
    .populate("plan", "name price")
    .sort({ endDate: 1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Admin: Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const history = await PaymentHistory.find()
      .populate("user", "name phone email")
      .populate("plan", "name price")
      .sort({ transactionDate: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 5. Seller: Get My Payment History
exports.getMyPaymentHistory = async (req, res) => {
  try {
    const history = await PaymentHistory.find({ user: req.user._id })
      .populate("plan", "name price")
      .sort({ transactionDate: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
