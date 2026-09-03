const SubscriptionPlan = require("../models/SubscriptionPlan");

// Get all plans (Filtered by user's business type if available and not requested all)
exports.getAllPlans = async (req, res) => {
  try {
    const query = { status: "active" };
    
    // If user is a seller, and not requesting all plans, only show plans for their business type
    if (req.user && req.user.businessType && req.query.allPlans !== "true") {
      query.businessType = req.user.businessType;
    }

    const plans = await SubscriptionPlan.find(query).populate("businessType");

    // Add purchase restriction info for 'Standard' plans
    let purchasedStandard = false;
    if (req.user) {
      const PaymentHistory = require("../models/PaymentHistory");
      const alreadyPurchased = await PaymentHistory.findOne({
        user: req.user._id,
        planName: { $regex: /standard/i },
        paymentStatus: "completed"
      });
      if (alreadyPurchased) purchasedStandard = true;
    }

    const modifiedPlans = plans.map(plan => {
      const planObj = plan.toObject();
      if (plan.name.toLowerCase().includes("standard") && purchasedStandard) {
        planObj.isAlreadyPurchased = true;
      }
      return planObj;
    });

    res.json(modifiedPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all plans including inactive
exports.adminGetAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().populate("businessType");
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Create/Update Plan
exports.savePlan = async (req, res) => {
  try {
    const { id, name, displayName, price, propertyLimit, leadsLimit, duration, features, notIncluded, isPopular, status, businessType } = req.body;
    
    if (id) {
      const plan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        { name, displayName, price, propertyLimit, leadsLimit, duration, features, notIncluded, isPopular, status, businessType },
        { new: true }
      ).populate("businessType");
      return res.json({ message: "Plan updated successfully", plan });
    }

    const plan = new SubscriptionPlan({ name, displayName, price, propertyLimit, leadsLimit, duration, features, notIncluded, isPopular, status, businessType });
    await plan.save();
    res.status(201).json({ message: "Plan created successfully", plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Delete Plan (or deactivate)
exports.deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
