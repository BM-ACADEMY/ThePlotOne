const SharedLead = require("../models/SharedLead");
const Subscription = require("../models/Subscription");
const Requirement = require("../models/Requirement");
const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");

// Get leads shared with the seller's current plan
exports.getSharedLeads = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get seller's most recent subscription (active or expired)
    const lastSubscription = await Subscription.findOne({
      user: userId,
    }).populate("plan").sort({ startDate: -1 });

    if (!lastSubscription) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No subscription found. Subscribe to see leads.",
      });
    }

    const isActive = lastSubscription && lastSubscription.status === "active" && 
                     (!lastSubscription.endDate || new Date(lastSubscription.endDate) > new Date());

    // Identify all plan variants with the same name as the seller's plan
    const sellerPlan = lastSubscription.plan;
    const allMatchingPlans = await SubscriptionPlan.find({ 
      name: sellerPlan.name,
      status: "active" 
    });
    const planIds = allMatchingPlans.map(p => p._id);

    // 2. Find leads shared with any of these plan variants
    const sharedLeads = await SharedLead.find({
      plan: { $in: planIds },
    })
      .populate({
        path: "requirement",
        select: "fullName phoneNumber email category usageType propertyType preferredLocation minBudget maxBudget propertyPreferences message createdAt" ,
      })
      .populate("acceptedBy", "name")
      .sort({ createdAt: -1 });

    // 3. Fetch current user with business type for visibility logic
    const currentUser = await User.findById(userId).populate("businessType");
    const sellerBusinessType = currentUser.businessType?.name || "";
    const isBuilder = /Builder|Promoter/i.test(sellerBusinessType);
    const isAgent = /Agent/i.test(sellerBusinessType);

    // Filter and Transform data
    const filteredLeads = sharedLeads.filter(lead => {
      // 1. Strict Role Matching Logic:
      // Priority 1: Builders Only
      if (lead.matchPriority === 1 && !isBuilder) return false;
      // Priority 2 & 3: Agents Only
      if ((lead.matchPriority === 2 || lead.matchPriority === 3) && !isAgent) return false;

      return true;
    });

    const leadsLimit = sellerPlan.leadsLimit ?? 2;
    const cycleStartDate = lastSubscription ? new Date(lastSubscription.startDate) : null;
    const cycleEndDate = lastSubscription?.endDate ? new Date(lastSubscription.endDate) : null;

    // Identify leads that belong to the most recent cycle
    const currentCycleLeads = filteredLeads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= cycleStartDate && (!cycleEndDate || leadDate <= cycleEndDate);
    });
    const totalInCycle = currentCycleLeads.length;

    const fullLeads = await Promise.all(filteredLeads.map(async (lead) => {
      if (!lead.requirement) return null; // Skip if requirement is missing

      const isAcceptedByMe = (lead.acceptedBy && lead.acceptedBy._id.toString() === userId.toString()) || 
                             (lead.acceptedByMatchedSellers && lead.acceptedByMatchedSellers.includes(userId));
      
      const isRejectedByMe = lead.rejectedByMatchedSellers && lead.rejectedByMatchedSellers.includes(userId);

      const leadDate = new Date(lead.createdAt);
      
      // Visibility Logic:
      // 1. If accepted by me -> Always show details
      // 2. If it is an EXACT MATCH and was within quota when received -> Show details
      
      let isWithinLimit = true;
      if (leadDate >= cycleStartDate && (!cycleEndDate || leadDate <= cycleEndDate)) {
          // Lead is within the most recent cycle (active or expired)
          const indexInCycle = currentCycleLeads.findIndex(e => e._id.toString() === lead._id.toString());
          isWithinLimit = leadsLimit === -1 || (totalInCycle - indexInCycle) <= leadsLimit;
      } else if (leadDate > cycleEndDate && !isActive) {
          // Lead arrived AFTER plan expired
          isWithinLimit = false; 
      }
      // If leadDate < cycleStartDate, isWithinLimit remains true (Historical/Legacy)

      let showFullDetails = isAcceptedByMe || (lead.matchType === "exact" && isWithinLimit);
      
      let reqDetails = { ...lead.requirement._doc };
      
      if (!showFullDetails) {
        // Mask sensitive fields
        reqDetails.fullName = "Contact Masked";
        reqDetails.email = "masked@example.com";
        reqDetails.phoneNumber = "XXXXXXXXXX";
      }

      return {
        _id: lead._id,
        requirement: reqDetails,
        status: isRejectedByMe ? "closed" : (isAcceptedByMe ? "accepted" : lead.status),
        leadStatus: isAcceptedByMe ? (lead.sellerStatuses?.find(s => s.seller.toString() === userId.toString())?.status || "not yet connected") : null,
        acceptedBy: lead.acceptedBy ? lead.acceptedBy.name : (isAcceptedByMe ? currentUser.name : null),
        isAcceptedByMe,
        isRejectedByMe,
        matchType: lead.matchType,
        matchPriority: lead.matchPriority,
        showFullDetails,
        createdAt: lead.createdAt
      };
    }));

    // Filter out any null entries from missing requirements
    const validLeads = fullLeads.filter(l => l !== null);

    res.status(200).json({
      success: true,
      data: validLeads,
    });
  } catch (error) {
    console.error("Error fetching shared leads:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch leads.",
    });
  }
};

// Accept a shared lead
exports.acceptLead = async (req, res) => {
  try {
    const { id } = req.params; // SharedLead ID
    const userId = req.user.id;

    // 1. Verify seller has the right plan for this lead
    const lead = await SharedLead.findById(id).populate("plan");
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // 1. Handle Exact Match (Matched to Builder) immediately
    // No need to check subscription or limits for these as they are already shared/matched
    if (lead.matchType === "exact") {
      const updatedLead = await SharedLead.findByIdAndUpdate(
        id,
        { 
          $addToSet: { acceptedByMatchedSellers: userId },
          $push: { sellerStatuses: { seller: userId, status: "not yet connected" } }
        },
        { new: true }
      ).populate("requirement");

      return res.status(200).json({
        success: true,
        data: updatedLead,
        message: "Lead accepted successfully! It is now in your accepted leads.",
      });
    }

    // 2. For regular leads, verify seller has an active subscription OR carried leads
    const activeSubscription = await Subscription.findOne({
      user: userId,
      plan: lead.plan._id,
      status: "active",
      endDate: { $gt: new Date() },
    });

    const user = await User.findById(userId).populate("businessType");
    let usingCarriedLeads = false;

    if (!activeSubscription) {
      if (user.carriedLeads > 0) {
        usingCarriedLeads = true;
      } else {
        return res.status(403).json({
          success: false,
          message: "You do not have an active subscription for this plan.",
        });
      }
    }

    const businessType = user.businessType?.name || "";
    const isBuilder = /Builder|Promoter/i.test(businessType);
    const isAgent = /Agent/i.test(businessType);

    if (lead.matchPriority === 1 && !isBuilder) {
      return res.status(403).json({ success: false, message: "This lead is exclusively for Builders." });
    }
    if ((lead.matchPriority === 2 || lead.matchPriority === 3) && !isAgent) {
      return res.status(403).json({ success: false, message: "This lead is reserved for Agents." });
    }

    // 1.7 Lead Count Limit Check
    const leadsLimit = lead.plan.leadsLimit ?? 2;
    if (!usingCarriedLeads && activeSubscription) {
      if (leadsLimit !== -1 && activeSubscription.leadsUsed >= leadsLimit) {
        if (user.carriedLeads > 0) {
          usingCarriedLeads = true;
        } else {
          return res.status(403).json({
            success: false,
            message: `Lead Limit Reached: Your current plan allows only ${leadsLimit} leads. Please upgrade your plan for more leads.`,
          });
        }
      }
    }

    // 3. Atomically accept the regular (unmatched) lead
    const updatedLead = await SharedLead.findOneAndUpdate(
      { _id: id, status: "pending" },
      { 
        status: "accepted", 
        acceptedBy: userId,
        $push: { sellerStatuses: { seller: userId, status: "not yet connected" } }
      },
      { new: true }
    ).populate("requirement");

    if (!updatedLead) {
      // If no lead found with status pending, it means someone else already accepted it
      const alreadyAcceptedLead = await SharedLead.findById(id).populate("acceptedBy", "name");
      return res.status(400).json({
        success: false,
        message: "Deal Closed: This lead has already been accepted by another seller.",
        acceptedBy: alreadyAcceptedLead.acceptedBy ? alreadyAcceptedLead.acceptedBy.name : "another seller"
      });
    }

    // 4. Increment usage for regular leads
    if (usingCarriedLeads) {
      await User.findByIdAndUpdate(userId, { $inc: { carriedLeads: -1 } });
    } else if (activeSubscription) {
      await Subscription.findByIdAndUpdate(activeSubscription._id, { $inc: { leadsUsed: 1 } });
    }

    // 5. Update the parent Requirement status to "Closed"
    if (updatedLead.requirement) {
      await Requirement.findByIdAndUpdate(updatedLead.requirement._id, { status: "Closed" });
    }

    // 6. Close all other platforms' shared leads for this same requirement
    await SharedLead.updateMany(
      { 
        requirement: updatedLead.requirement._id, 
        _id: { $ne: id },
        status: "pending"
      },
      { 
        status: "closed",
        acceptedBy: userId
      }
    );

    // 7. Emit Socket.io events
    const io = req.app.get("socketio");
    if (io) {
      const allSharedLeads = await SharedLead.find({ 
        requirement: updatedLead.requirement._id 
      }).select("sharedWith");
      
      const allSellersToNotify = new Set();
      allSharedLeads.forEach(sl => {
        sl.sharedWith.forEach(sid => allSellersToNotify.add(sid.toString()));
      });

      allSellersToNotify.forEach(sellerId => {
        if (sellerId !== userId.toString()) {
          io.to(`seller-${sellerId}`).emit("lead-accepted-by-other", {
            requirementId: updatedLead.requirement._id,
            leadId: id,
            status: "closed",
            acceptedBy: req.user.name || "Another Seller"
          });
        }
      });

      io.emit("admin-lead-updated", { requirementId: updatedLead.requirement._id });
    }

    res.status(200).json({
      success: true,
      data: updatedLead,
      message: "Lead accepted successfully! You can now view the contact details.",
    });
  } catch (error) {
    console.error("Error accepting lead:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not accept lead.",
    });
  }
};

// Reject a shared lead
exports.rejectLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const lead = await SharedLead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    if (lead.matchType === "exact") {
      // Exact match rejection is per-seller
      const updatedLead = await SharedLead.findByIdAndUpdate(
        id,
        { $addToSet: { rejectedByMatchedSellers: userId } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        data: updatedLead,
        message: "Lead moved to history.",
      });
    }

    // For non-exact matches, we could implement a general rejection, 
    // but the request was specifically for matched leads.
    // For now, let's just use the same per-seller rejection array for consistency
    // without affecting the global status.
    const updatedLead = await SharedLead.findByIdAndUpdate(
        id,
        { $addToSet: { rejectedByMatchedSellers: userId } },
        { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedLead,
      message: "Lead rejected and moved to history.",
    });
  } catch (error) {
    console.error("Error rejecting lead:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not reject lead.",
    });
  }
};

// Update lead status (for accepted leads)
exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!["not yet connected", "in process", "holded", "done"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const lead = await SharedLead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // Update or add the status for this seller
    const sellerStatusIndex = lead.sellerStatuses.findIndex(s => s.seller.toString() === userId.toString());
    
    if (sellerStatusIndex !== -1) {
      lead.sellerStatuses[sellerStatusIndex].status = status;
    } else {
      // If for some reason they accepted but didn't have a status record yet
      lead.sellerStatuses.push({ seller: userId, status });
    }

    await lead.save();

    res.status(200).json({
      success: true,
      data: lead,
      message: "Lead status updated.",
    });
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not update status.",
    });
  }
};
