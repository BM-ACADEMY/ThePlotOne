const Coupon = require("../models/Coupon");
const PaymentHistory = require("../models/PaymentHistory");

// 1. Get All Coupons (Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Coupon (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. Update Coupon (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Delete Coupon (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Validate Coupon (User)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, planPrice } = req.body;
    const userId = req.user._id;

    if (!code) return res.status(400).json({ success: false, message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: "active" });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon code" });
    }

    // Check dates
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({ success: false, message: "Coupon is not yet active" });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    // Check min spend
    if (planPrice < coupon.minSpend) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum spend of ₹${coupon.minSpend} required for this coupon` 
      });
    }

    // Check total usage
    if (coupon.maxUsageTotal !== null && coupon.usedCount >= coupon.maxUsageTotal) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    // Check usage per user
    const userUsageCount = await PaymentHistory.countDocuments({
      user: userId,
      couponCode: coupon.code,
      paymentStatus: "completed"
    });

    if (userUsageCount >= coupon.maxUsagePerUser) {
      return res.status(400).json({ success: false, message: "You have already used this coupon maximum number of times" });
    }

    res.json({
      success: true,
      message: "Coupon applied successfully",
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      termsAndConditions: coupon.termsAndConditions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Valid Coupons (User)
exports.getValidCoupons = async (req, res) => {
  try {
    const { planPrice } = req.query;
    const userId = req.user._id;
    const now = new Date();

    // Fetch all active coupons within date range
    const coupons = await Coupon.find({
      status: "active",
      $and: [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ]
    }).sort({ discountValue: -1 });

    // Filter coupons based on usage and minSpend
    const validCoupons = [];
    for (const coupon of coupons) {
      // Check min spend
      if (planPrice && Number(planPrice) < coupon.minSpend) continue;

      // Check total usage
      if (coupon.maxUsageTotal !== null && coupon.usedCount >= coupon.maxUsageTotal) continue;

      // Check usage per user
      const userUsageCount = await PaymentHistory.countDocuments({
        user: userId,
        couponCode: coupon.code,
        paymentStatus: "completed"
      });
      if (userUsageCount >= coupon.maxUsagePerUser) continue;

      validCoupons.push(coupon);
    }

    res.json(validCoupons);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
