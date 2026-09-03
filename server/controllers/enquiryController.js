const Enquiry = require("../models/Enquiry");
const Property = require("../models/Property");
const Subscription = require("../models/Subscription");
const Role = require("../models/Role");
const User = require("../models/User");
const emailService = require("../utils/emailService");

exports.createEnquiry = async (req, res) => {
  try {
    console.log("Create Enquiry Body:", req.body);
    const { property_id, seller_id, message, name, phone } = req.body;

    // Basic validation — only require property_id and seller_id
    if (!property_id || !seller_id) {
      return res
        .status(400)
        .json({ error: "Property ID and Seller ID are required" });
    }

    // Check if an enquiry already exists for this property by this user/phone
    let existingEnquiry = null;
    if (req.user) {
      existingEnquiry = await Enquiry.findOne({
        property_id,
        $or: [
          { user_id: req.user._id },
          ...(phone ? [{ enquirer_phone: phone }] : [])
        ]
      });
    } else if (phone) {
      existingEnquiry = await Enquiry.findOne({
        property_id,
        enquirer_phone: phone
      });
    }

    if (existingEnquiry) {
      return res.status(400).json({ error: "You already enquired about this property" });
    }

    // Fetch property title for snapshot
    const property = await Property.findById(property_id);
    const propertyTitle = property?.basicInfo?.title || property?.title || "Untitled Property";

    const enquiryData = {
      property_id,
      seller_id,
      property_title: propertyTitle,
      message: message || "I'm interested in this property",
      enquirer_name: name,
      enquirer_phone: phone,
      visitor_info: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    };

    // If logged-in user, attach their info and fill any missing fields
    if (req.user) {
      enquiryData.user_id = req.user._id;
      if (!enquiryData.enquirer_name) enquiryData.enquirer_name = req.user.name;
      if (!enquiryData.enquirer_phone) enquiryData.enquirer_phone = req.user.phone;
    }

    const enquiry = new Enquiry(enquiryData);
    await enquiry.save();

    // Increment lead usage for the seller if they have an active plan
    const activeSubscription = await Subscription.findOne({
      user: seller_id,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (activeSubscription) {
      await Subscription.findByIdAndUpdate(activeSubscription._id, { $inc: { leadsUsed: 1 } });
    }

    // Trigger email notification to admin
    try {
      const fullProperty = await Property.findById(property_id);
      const seller = await User.findById(seller_id);
      if (fullProperty && seller) {
        emailService.sendEnquiryNotification(enquiry, seller, fullProperty);
      }
    } catch (emailErr) {
      console.error("Failed to send enquiry email:", emailErr);
    }

    // Emit socket event for real-time notification
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("new-enquiry", {
        message: `New enquiry from ${enquiryData.enquirer_name || "a user"}`,
        enquiry,
      });
    }

    res.status(201).json({ message: "Enquiry recorded successfully", enquiry });

  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({ error: "Failed to record enquiry" });
  }
};

exports.getEnquiries = async (req, res) => {
  try {

    const filter = {};

    // Fetch user doc to check role and superAdmin status
    const userDoc = await User.findById(req.user._id).populate("role_id");
    const isAdmin = userDoc?.role_id?.role_name?.toLowerCase() === "admin";
    const isSuperAdmin = userDoc?.isSuperAdmin;

    // Filter Logic
    if (isAdmin) {
      // Find Admin Role and all Admin Users to filter "Admin Leads"
      const adminRole = await Role.findOne({ role_name: { $regex: /admin/i } });
      const adminUserIds = await User.find({ role_id: adminRole?._id }).distinct("_id");
      
      if (req.query.view === "my") {
        // Admin viewing leads for their own properties
        filter.seller_id = req.user._id;
      } else if (req.query.view === "seller") {
        // Admin viewing leads for seller-owned properties (sellers, i.e., non-admins)
        filter.seller_id = { $nin: adminUserIds };
      } else {
        // Only show leads for admin-owned properties
        filter.seller_id = { $in: adminUserIds };
      }
    } else {
      // Seller: Only see their own leads
      filter.seller_id = req.user._id;
    }

    const WhatsappLead = require("../models/WhatsappLead");

    // 1. Fetch Enquiries
    const enquiries = await Enquiry.find(filter)
      .populate("property_id", "basicInfo location media")
      .populate("user_id", "name phone")
      .populate("seller_id", "name phone")
      .populate("updatedBy", "name")
      .lean();

    // 2. Fetch WhatsappLeads
    const whatsappLeads = await WhatsappLead.find(filter)
      .populate("property_id", "title location images")
      .populate("user_id", "name phone")
      .populate("seller_id", "name")
      .populate("updatedBy", "name")
      .lean();

    // 3. Normalize & Sort
    const normalizedLeads = whatsappLeads.map((lead) => ({
      ...lead,
      enquirer_name: lead.user_id?.name || "WhatsApp User",
      enquirer_phone: lead.user_id?.phone || "",
      message: lead.message || "WhatsApp Inquiry",
      status: lead.status || "new",
      type: "whatsapp_lead",
    }));

    const allEnquiries = [...enquiries, ...normalizedLeads].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    // 4. Restricted Visibility Logic for Sellers
    if (!isAdmin) {
      // Fetch the most recent subscription (active or expired)
      const lastSubscription = await Subscription.findOne({
        user: req.user._id,
      }).populate("plan").sort({ startDate: -1 });

      const isActive = lastSubscription && lastSubscription.status === "active" && 
                       (!lastSubscription.endDate || new Date(lastSubscription.endDate) > new Date());
      
      const leadsLimit = lastSubscription?.plan?.leadsLimit ?? 0;
      const cycleStartDate = lastSubscription ? new Date(lastSubscription.startDate) : null;
      const cycleEndDate = lastSubscription?.endDate ? new Date(lastSubscription.endDate) : null;

      // Identify leads that belong to the most recent cycle
      const currentCycleLeads = allEnquiries.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= cycleStartDate && (!cycleEndDate || leadDate <= cycleEndDate);
      });
      const totalInCycle = currentCycleLeads.length;

      const maskedEnquiries = allEnquiries.map((lead) => {
          // If no subscription ever existed, mask everything
          if (!lastSubscription) {
              return {
                  ...lead,
                  enquirer_phone: "XXXXXXXXXX",
                  message: "Content Locked (Upgrade to View)",
              };
          }

          const leadDate = new Date(lead.createdAt);

          // Rule 1: Legacy leads (before first sub) are unlocked
          if (leadDate < cycleStartDate) {
              return lead;
          }

          // Rule 2: If plan is active, check ranking within cycle
          if (isActive) {
              const indexInCycle = currentCycleLeads.findIndex(e => e._id.toString() === lead._id.toString());
              if (leadsLimit !== -1 && (totalInCycle - indexInCycle) > leadsLimit) {
                  return {
                      ...lead,
                      enquirer_phone: "XXXXXXXXXX",
                      message: "Content Locked (Upgrade to View)",
                  };
              }
              return lead;
          }

          // Rule 3: Plan is Expired
          // If lead arrived within the cycle, it preserves its unlock state from that time
          if (cycleEndDate && leadDate <= cycleEndDate) {
              const indexInCycle = currentCycleLeads.findIndex(e => e._id.toString() === lead._id.toString());
              if (leadsLimit !== -1 && (totalInCycle - indexInCycle) > leadsLimit) {
                  return {
                      ...lead,
                      enquirer_phone: "XXXXXXXXXX",
                      message: "Content Locked (Upgrade to View)",
                  };
              }
              return lead;
          }

          // Rule 4: Lead arrived AFTER the plan expired (in the gap)
          return {
              ...lead,
              enquirer_phone: "XXXXXXXXXX",
              message: "Content Locked (Upgrade to View)",
          };
      });

      return res.json(maskedEnquiries);
    }

    res.json(allEnquiries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllEnquiriesAdmin = async (req, res) => {
  try {

    const userDoc = await User.findById(req.user._id).populate("role_id");
    const isSuperAdmin = userDoc?.isSuperAdmin;
    const filter = {};

    // Filter by admin sellers only
    const adminRole = await Role.findOne({ role_name: { $regex: /admin/i } });
    const adminUserIds = await User.find({ role_id: adminRole?._id }).distinct("_id");
    filter.seller_id = { $in: adminUserIds };

    const enquiries = await Enquiry.find(filter)
      .populate("property_id", "basicInfo location media")
      .populate("user_id", "name phone")
      .populate("seller_id", "name phone")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    // Authorization check: Only admin can delete
    const isAdmin =
      req.user.role_id && req.user.role_id.role_name.toLowerCase() === "admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this enquiry. Contact Admin." });
    }

    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWhatsappLead = async (req, res) => {
  try {
    const WhatsappLead = require("../models/WhatsappLead");
    const lead = await WhatsappLead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "WhatsApp lead not found" });
    }

    // Authorization check
    const isAdmin =
      req.user.role_id && req.user.role_id.role_name.toLowerCase() === "admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this lead. Contact Admin." });
    }

    await WhatsappLead.findByIdAndDelete(req.params.id);
    res.json({ message: "WhatsApp lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type } = req.body;
    const WhatsappLead = require("../models/WhatsappLead");


    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    let lead;
    let model;

    // Determine which model to use
    if (type === "whatsapp_lead") {
      model = WhatsappLead;
    } else {
      model = Enquiry;
    }

    lead = await model.findById(id);

    if (!lead) {
      // Fallback: search across both if type is missing or incorrect
      lead = await Enquiry.findById(id);
      model = Enquiry;
      if (!lead) {
        lead = await WhatsappLead.findById(id);
        model = WhatsappLead;
      }
    }

    if (!lead) {
      return res.status(404).json({ error: "Lead/Enquiry not found" });
    }

    // Authorization check
    const userDoc = await User.findById(req.user._id).populate("role_id");
    const isAdmin = userDoc?.role_id?.role_name?.toLowerCase() === "admin";
    const isOwner = lead.seller_id?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Not authorized to update this status" });
    }

    lead.status = status;
    lead.updatedBy = req.user._id;
    await lead.save();

    // Trigger email notification for status update
    try {
      const fullProperty = await Property.findById(lead.property_id);
      const seller = await User.findById(lead.seller_id);
      const updater = await User.findById(req.user._id);
      
      if (fullProperty && seller) {
        emailService.sendEnquiryNotification(lead, seller, fullProperty, updater, true);
      }
    } catch (emailErr) {
      console.error("Failed to send status update email:", emailErr);
    }

    res.json({ message: "Status updated successfully", lead });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ error: error.message });
  }
};
