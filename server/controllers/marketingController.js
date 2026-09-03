const MarketingPlan = require("../models/MarketingPlan");
const MarketingRequest = require("../models/MarketingRequest");
const Property = require("../models/Property");
const emailService = require("../utils/emailService");
const User = require("../models/User");

// --- Marketing Plans (Admin) ---

exports.createPlan = async (req, res) => {
  try {
    if (!req.body.serviceName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required"
      });
    }

    const marketingPlan = new MarketingPlan({
      name: req.body.serviceName,
      priceRange: req.body.priceRange,
      description: req.body.description,
      isPopular: req.body.isPopular,
      status: req.body.status
    });

    const plan = await marketingPlan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await MarketingPlan.find({ status: "active" });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await MarketingPlan.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.serviceName) {
      updateData.name = updateData.serviceName;
      delete updateData.serviceName;
    }

    const plan = await MarketingPlan.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!plan)
      return res.status(404).json({ success: false, error: "Plan not found" });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await MarketingPlan.findByIdAndDelete(req.params.id);
    if (!plan)
      return res.status(404).json({ success: false, error: "Plan not found" });
    res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Marketing Requests (Sellers) ---

exports.createRequest = async (req, res) => {
  try {
    const { property_id, plan_id, notes } = req.body;

    // Check if property belongs to seller
    const property = await Property.findById(property_id);
    if (!property)
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });

    if (
      property.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Check if duplicate request exists for same property and plan
    const existingRequest = await MarketingRequest.findOne({
      property_id,
      plan_id,
      seller: req.user._id,
      status: "pending",
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({
          success: false,
          error: "A pending request already exists for this property and plan",
        });
    }

    const request = await MarketingRequest.create({
      seller_id: req.user._id,
      property_id,
      plan_id,
      notes,
    });

    // Populate for the notification
    const populatedRequest = await MarketingRequest.findById(request._id)
      .populate("seller_id", "name")
      .populate("plan_id", "name");

    // Emit socket event to notify admins
    const io = req.app.get("socketio");
    if (io) {
      io.emit("new-marketing-request", {
        message: `New marketing request from ${populatedRequest.seller_id?.name || "a seller"}`,
        request: populatedRequest,
      });
    }

    // Send email notification to admin
    try {
      const seller = await User.findById(req.user._id);
      const plan = await MarketingPlan.findById(plan_id);
      
      if (seller && property && plan) {
        emailService.sendMarketingLeadNotification(request, seller, property, plan);
      }
    } catch (err) {
      console.error("Failed to trigger marketing lead email:", err);
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getSellerRequests = async (req, res) => {
  try {
    const requests = await MarketingRequest.find({ seller_id: req.user._id })
      .populate("property_id", "title images price")
      .populate("plan_id", "name priceRange")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Marketing Requests (Admin) ---

exports.getAdminRequests = async (req, res) => {
  try {
    const requests = await MarketingRequest.find()
      .populate("seller_id", "name phone customId")
      .populate("property_id", "title images price location")
      .populate("plan_id", "name priceRange")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const request = await MarketingRequest.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true },
    );
    if (!request)
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const request = await MarketingRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Marketing request not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Marketing request deleted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
