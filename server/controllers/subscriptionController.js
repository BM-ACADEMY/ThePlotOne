const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const PaymentHistory = require("../models/PaymentHistory");
const Coupon = require("../models/Coupon");

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
