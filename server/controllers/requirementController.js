const mongoose = require("mongoose");
const Requirement = require("../models/Requirement");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const SharedLead = require("../models/SharedLead");
const Property = require("../models/Property");
const BusinessType = require("../models/BusinessType");
const WebsiteSetting = require("../models/WebsiteSetting");
const { sendRequirementNotificationToAdmin } = require("../utils/emailService");

// Create a new requirement
exports.createRequirement = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      category,
      usageType,
      propertyType,
      preferredLocation,
      minBudget,
      maxBudget,
      propertyPreferences,
      message,
      heardFrom,
      lat,
      lng,
      locationText,
      locality,
      needTimeframe,
    } = req.body;

    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && (req.user.role_id?.role_name?.toLowerCase() === "admin" || req.user.role?.name?.toLowerCase() === "admin");

    const newRequirement = new Requirement({
      fullName,
      phoneNumber,
      email,
      category,
      usageType,
      propertyType,
      preferredLocation,
      lat,
      lng,
      locationText,
      locality,
      minBudget,
      maxBudget,
      propertyPreferences,
      message,
      heardFrom,
      needTimeframe,
      user: userId,
      createdBy: isAdmin ? req.user._id : null
    });

    const savedRequirement = await newRequirement.save();

    // Emit socket event for real-time notification
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("new-requirement", {
        requirementId: savedRequirement._id,
        fullName: savedRequirement.fullName,
        message: `New requirement posted by ${savedRequirement.fullName}`,
      });
    }

    // Send email notification to admin
    try {
      await sendRequirementNotificationToAdmin(savedRequirement);
    } catch (emailErr) {
      console.error("Failed to send requirement notification email:", emailErr);
    }

    res.status(201).json({
      success: true,
      data: savedRequirement,
      message: "Requirement submitted successfully!",
    });
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not submit requirement.",
    });
  }
};

// Get all requirements (Admin only)
exports.getRequirements = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user._id).populate("role_id");
    const isAdmin = userDoc?.role_id?.role_name?.toLowerCase() === "admin";
    const isSuperAdmin = userDoc?.isSuperAdmin;
    const filter = {};



    const requirements = await Requirement.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    // Enhance requirements with sharing info (who accepted it)
    const enhancedRequirements = await Promise.all(
      requirements.map(async (reqDoc) => {
        const acceptedLeads = await SharedLead.find({ 
          requirement: reqDoc._id, 
          $or: [
            { status: "accepted" },
            { acceptedByMatchedSellers: { $exists: true, $not: { $size: 0 } } }
          ]
        }).populate({
          path: "acceptedBy",
          select: "name email phone businessType",
          populate: { path: "businessType", select: "name" }
        }).populate({
          path: "sellerStatuses.seller",
          select: "name email phone businessType",
          populate: { path: "businessType", select: "name" }
        });

        // Flatten all sellers across all shared leads for this requirement
        const allSellersWithStatus = [];
        acceptedLeads.forEach(sl => {
          // Add sellers from sellerStatuses (New System)
          sl.sellerStatuses.forEach(ss => {
            if (ss.seller) {
              allSellersWithStatus.push({
                ...ss.seller.toObject(),
                leadStatus: ss.status
              });
            }
          });

          // Fallback for Legacy Data: If status is accepted but sellerStatuses is empty, add acceptedBy
          if (sl.status === "accepted" && sl.acceptedBy && sl.sellerStatuses.length === 0) {
            allSellersWithStatus.push({
              ...sl.acceptedBy.toObject(),
              leadStatus: "not yet connected"
            });
          }
        });

        // Get the highest priority match it was shared with (to show in table)
        const anySharedLead = await SharedLead.findOne({ requirement: reqDoc._id })
          .sort({ matchPriority: 1 }); // 1 is highest priority

        return {
          ...reqDoc.toObject(),
          acceptedBy: allSellersWithStatus.length > 0 ? allSellersWithStatus[0] : null, // Fallback for backward compatibility
          allSellers: allSellersWithStatus,
          isShared: !!anySharedLead,
          matchPriority: anySharedLead ? anySharedLead.matchPriority : null,
          sharingStatus: reqDoc.sharingStatus,
          sharingConfig: reqDoc.sharingConfig,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enhancedRequirements,
    });
  } catch (error) {
    console.error("Error fetching requirements:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch requirements.",
    });
  }
};

// Update requirement status (Admin only)
exports.updateRequirementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, closureDate, needTimeframe } = req.body;

    if (!["Pending", "Contacted", "Closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const requirement = await Requirement.findByIdAndUpdate(
      id,
      { 
        status,
        closureDate,
        needTimeframe,
        updatedBy: req.user._id
      },
      { new: true }
    ).populate("updatedBy", "name");

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: requirement,
      message: `Status updated to ${status}.`,
    });
  } catch (error) {
    console.error("Error updating requirement status:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not update status.",
    });
  }
};

// Delete requirement (Admin only)
exports.deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findByIdAndDelete(id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Requirement deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not delete requirement.",
    });
  }
};

// Helper function to build the property matching query
const getPropertyMatchQuery = (sellerId, requirement, matchType = "exact") => {
  if (!requirement) return null;

  const isRent = requirement.category === "Rent";
  
  // Fuzzy Matching Logic (80% - 120%)
  const minBudget = (requirement.minBudget || 0) * 0.8;
  const maxBudget = requirement.maxBudget ? requirement.maxBudget * 1.2 : Infinity;

  const priceField = isRent ? "pricing.rent.monthlyRent" : "pricing.sell.price";
  const minPriceField = isRent ? "pricing.rent.minRent" : "pricing.sell.minPrice";
  const maxPriceField = isRent ? "pricing.rent.maxRent" : "pricing.sell.maxPrice";

  // Base query filters
  // NOTE: We allow Pending and Edit Pending Approval for admin matching so they can see potential matches
  const matchQuery = {
    status: { $in: ["Active", "Pending", "Edit Pending Approval"] },
    "basicInfo.category": requirement.category,
    "basicInfo.usageType": requirement.usageType,
    "basicInfo.propertyType": { $regex: requirement.propertyType.split(' / ')[0], $options: "i" },
    $and: [
      {
        $or: [
          { [priceField]: { $gte: minBudget, $lte: maxBudget } },
          {
            [minPriceField]: { $lte: maxBudget },
            [maxPriceField]: { $gte: minBudget }
          }
        ]
      }
    ]
  };

  // Add seller filter ONLY if a specific sellerId is provided
  if (sellerId && (typeof sellerId === "string" || sellerId instanceof mongoose.Types.ObjectId)) {
    matchQuery.seller = sellerId;
  }

  // Location matching logic
  if (requirement.lat && requirement.lng) {
    const radiusInRadians = 5 / 6378.1;
    
    if (matchType === "exact") {
      // Step 1: Locality Match (Search in locality, subArea, and city)
      let targetLocality = requirement.locality;
      
      // Fallback: If locality is missing, try to get it from the start of locationText
      if (!targetLocality && requirement.locationText) {
        targetLocality = requirement.locationText.split(',')[0].trim();
      }

      if (targetLocality && targetLocality.trim() !== "") {
        const locRegex = new RegExp(targetLocality.trim(), "i");
        matchQuery.$and.push({
          $or: [
            { "location.locality": locRegex },
            { "location.subArea": locRegex },
            { "location.city": locRegex }
          ]
        });
      } else {
        // If no text locality, fall back to small radius (1km) as "exact"
        const smallRadius = 1 / 6378.1;
        matchQuery.$and.push({
          "location.locationPoint": {
            $geoWithin: {
              $centerSphere: [[requirement.lng, requirement.lat], smallRadius],
            },
          },
        });
      }
    } else if (matchType === "radius") {
      // Step 2: 5 km Radius Match
      matchQuery.$and.push({
        "location.locationPoint": {
          $geoWithin: {
            $centerSphere: [[requirement.lng, requirement.lat], radiusInRadians],
          },
        },
      });
    }
  } else if (requirement.preferredLocation && requirement.preferredLocation.trim() !== "") {
    // Step 3: Text-based Regex Fallback (for old data or missing coordinates)
    const locTerm = requirement.preferredLocation.trim();
    const locRegex = new RegExp(locTerm, "i");
    matchQuery.$and.push({
      $or: [
        { "location.city": locRegex },
        { "location.locality": locRegex },
        { "location.subArea": locRegex }
      ]
    });
  }

  return matchQuery;
};

// Get subscription stats for lead sharing (Admin)
exports.getSubscriptionStats = async (req, res) => {
  try {
    const { requirementId } = req.query;
    let requirement = null;
    
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
    }

    const allPlans = await SubscriptionPlan.find({ status: "active" });
    
    // Group sub-plans by name to avoid duplicate entries in the UI
    const planGroups = {};
    allPlans.forEach(p => {
      if (!planGroups[p.name]) planGroups[p.name] = [];
      planGroups[p.name].push(p);
    });

    // Find if at least one Builder matches globally for Priority 1 logic
    let hasGlobalBuilderMatch = false;

    // Determine if we should show Exact Matches or Radius Matches
    let finalMatchType = "exact";
    if (requirement.lat && requirement.lng) {
      const globalExactQuery = getPropertyMatchQuery(null, requirement, "exact");
      const exactExists = await Property.exists(globalExactQuery);
      
      console.log(`[DEBUG] Matching requirement: ${requirement.locationText || requirement.locality}`);
      console.log(`[DEBUG] Global Exact Match exists? ${exactExists}`);
      
      if (!exactExists) {
        finalMatchType = "radius";
      }
      console.log(`[DEBUG] Final Match Type selected: ${finalMatchType}`);
    }

    const stats = await Promise.all(
      Object.entries(planGroups).map(async ([planName, plansInGroup]) => {
        const planIds = plansInGroup.map(p => p._id);
        
        // Find active subscriptions for any plan in this group
        const activeSubscriptions = await Subscription.find({
          plan: { $in: planIds },
          status: "active",
          endDate: { $gt: new Date() },
        }).populate({
          path: "user",
          select: "name email phone businessType",
          populate: { path: "businessType", select: "name" }
        });

        const sellers = await Promise.all(activeSubscriptions
          .filter(sub => sub.user)
          .map(async (sub) => {
            const user = sub.user;
            const businessType = user.businessType?.name || "";
            const isBuilder = /Builder|Promoter/i.test(businessType);
            const isAgent = /Agent/i.test(businessType);

            let isMatch = false;
            let matchPriority = 3; // Default: No match
            let matchingProperties = [];

            if (requirement) {
              const matchQuery = getPropertyMatchQuery(user._id, requirement, finalMatchType);
              const props = await Property.find(matchQuery).select("basicInfo.title");
              
              if (props.length > 0) {
                isMatch = true;
                matchPriority = isBuilder ? 1 : isAgent ? 2 : 3;
                if (isBuilder) hasGlobalBuilderMatch = true;
                matchingProperties = props.map(p => p.basicInfo.title);
              }
            }

            const planForSub = plansInGroup.find(p => p._id.toString() === sub.plan.toString());

            return {
              id: user._id,
              name: user.name || "Unnamed Seller",
              email: user.email,
              phone: user.phone,
              businessType: businessType,
              isBuilder,
              isAgent,
              isMatch,
              matchPriority,
              matchingProperties,
              leadsLimit: planForSub?.leadsLimit || 0,
              leadsUsed: sub.leadsUsed || 0,
            };
          }));

        // Check if this requirement has already been shared with this plan group
        let isAlreadyShared = false;
        if (requirementId) {
          const SharedLead = mongoose.model("SharedLead");
          const existingShare = await SharedLead.findOne({
            requirement: requirementId,
            plan: { $in: planIds }
          });
          if (existingShare) isAlreadyShared = true;
        }

        return {
          planId: plansInGroup[0]._id, // Representative ID for frontend reference
          planName: planName,
          displayName: plansInGroup[0].displayName || planName,
          sellerCount: sellers.length,
          sellers: sellers,
          isAlreadyShared,
          // Plan level matches
          hasBuilderMatch: sellers.some(s => s.isBuilder && s.isMatch),
          hasAgentMatch: sellers.some(s => s.isAgent && s.isMatch),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        stats,
        hasGlobalBuilderMatch
      },
    });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch subscription stats.",
    });
  }
};

// Share requirement with one or more subscription plans (Admin)
// Internal helper to share lead with all agents in a plan by name
exports.internalShareLeadWithPlanName = async (requirementId, planName, io, matchPriority = 3) => {
  try {
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) return { status: "error", message: "Requirement not found" };

    // Find all plan variants with the same name
    const allMatchingPlans = await SubscriptionPlan.find({ 
      name: planName,
      status: "active" 
    });
    if (allMatchingPlans.length === 0) return { status: "no_sellers", plan: planName };
    
    const allPlanVariantIds = allMatchingPlans.map(p => p._id);
    const representativePlanId = allMatchingPlans[0]._id;

    // Check if already shared with this plan group
    const existingShare = await SharedLead.findOne({ 
      requirement: requirementId, 
      plan: { $in: allPlanVariantIds } 
    });
    if (existingShare) return { status: "already_shared", plan: planName };

    // Determine if we should show Exact Matches or Radius Matches (Exclusive Priority)
    let finalMatchType = "exact";
    if (requirement.lat && requirement.lng) {
      const globalExactQuery = getPropertyMatchQuery(null, requirement, "exact");
      const exactExists = await Property.exists(globalExactQuery);
      if (!exactExists) {
        finalMatchType = "radius";
      }
    }

    // Find active sellers for all plan variants
    const activeSubscriptions = await Subscription.find({
      plan: { $in: allPlanVariantIds },
      status: "active",
      endDate: { $gt: new Date() },
    }).populate({
      path: "user",
      select: "name businessType",
      populate: { path: "businessType", select: "name" }
    });
    
    let sellerIds = [];
    let skippedDueToLimit = 0;

    // Matching logic
    if (matchPriority === 1) {
      // Priority 1: ONLY Builders matching the criteria
      const builderSubs = activeSubscriptions.filter(sub => sub.user && /Builder|Promoter/i.test(sub.user.businessType?.name));
      for (const sub of builderSubs) {
        const planForSub = allMatchingPlans.find(p => p._id.toString() === sub.plan.toString());
        const leadsLimit = planForSub?.leadsLimit ?? 2;
        if (leadsLimit !== -1 && sub.leadsUsed >= leadsLimit) {
          skippedDueToLimit++;
          continue;
        }
        const matchQuery = getPropertyMatchQuery(sub.user._id, requirement, finalMatchType);
        if (await Property.exists(matchQuery)) {
          sellerIds.push(sub.user._id);
          await Subscription.findByIdAndUpdate(sub._id, { $inc: { leadsUsed: 1 } });
        }
      }
    } else if (matchPriority === 2) {
      // Priority 2: ONLY Agents matching the criteria
      const agentSubs = activeSubscriptions.filter(sub => sub.user && /Agent/i.test(sub.user.businessType?.name));
      for (const sub of agentSubs) {
        const planForSub = allMatchingPlans.find(p => p._id.toString() === sub.plan.toString());
        const leadsLimit = planForSub?.leadsLimit ?? 2;
        if (leadsLimit !== -1 && sub.leadsUsed >= leadsLimit) {
          skippedDueToLimit++;
          continue;
        }
        const matchQuery = getPropertyMatchQuery(sub.user._id, requirement, finalMatchType);
        if (await Property.exists(matchQuery)) {
          sellerIds.push(sub.user._id);
          await Subscription.findByIdAndUpdate(sub._id, { $inc: { leadsUsed: 1 } });
        }
      }
    } else {
      // Priority 3 (Fallback): ALL Agents in the plan
      const agentSubs = activeSubscriptions.filter(sub => sub.user && /Agent/i.test(sub.user.businessType?.name));
      for (const sub of agentSubs) {
         const planForSub = allMatchingPlans.find(p => p._id.toString() === sub.plan.toString());
         const leadsLimit = planForSub?.leadsLimit ?? 2;
         if (leadsLimit === -1 || sub.leadsUsed < leadsLimit) {
           sellerIds.push(sub.user._id);
         } else {
           skippedDueToLimit++;
         }
      }
    }

    if (sellerIds.length === 0) {
      return { status: skippedDueToLimit > 0 ? "no_credits" : "no_sellers", plan: planName };
    }

    const sharedLead = new SharedLead({
      requirement: requirementId,
      plan: representativePlanId,
      sharedWith: sellerIds,
      status: "pending",
      matchType: (matchPriority === 1 || matchPriority === 2) ? "exact" : "not-exact",
      matchPriority: matchPriority
    });

    await sharedLead.save();

    // Notify sellers
    if (io) {
      sellerIds.forEach(sellerId => {
        io.to(`seller-${sellerId}`).emit("new-lead-shared", {
          leadId: sharedLead._id,
          requirement: {
            category: requirement.category,
            usageType: requirement.usageType,
            propertyType: requirement.propertyType,
            preferredLocation: requirement.preferredLocation,
            propertyPreferences: requirement.propertyPreferences,
            message: requirement.message,
          },
        });
      });
    }

    return { status: "success", plan: planName, count: sellerIds.length };
  } catch (error) {
    console.error(`Error in internalShareLeadWithPlanName for ${planName}:`, error);
    return { status: "error", message: error.message };
  }
};

// Share requirement with one or more subscription plans (Admin)
exports.shareRequirement = async (req, res) => {
  try {
    const { id } = req.params; // Requirement ID
    let { planId, planIds, matchPriority } = req.body;
    
    matchPriority = Number(matchPriority) || 3;

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: "Requirement not found." });
    }

    // Check if the lead is already accepted
    const alreadyAccepted = await SharedLead.findOne({ requirement: id, status: "accepted" });
    if (alreadyAccepted) {
      return res.status(400).json({ success: false, message: "This deal is already closed/accepted." });
    }

    let targetPlanIds = planIds && Array.isArray(planIds) ? planIds : (planId ? [planId] : []);
    if (targetPlanIds.length === 0) {
      return res.status(400).json({ success: false, message: "No subscription plans provided." });
    }

    const results = [];
    const io = req.app.get("socketio");

    for (const pId of targetPlanIds) {
      const selectedPlan = await SubscriptionPlan.findById(pId);
      if (!selectedPlan) continue;
      
      const result = await exports.internalShareLeadWithPlanName(id, selectedPlan.name, io, matchPriority);
      results.push(result);
    }

    const successCount = results.filter(r => r.status === "success").length;
    const alreadySharedCount = results.filter(r => r.status === "already_shared").length;

    if (successCount === 0) {
      if (alreadySharedCount > 0) {
        return res.status(200).json({ 
          success: true, 
          message: alreadySharedCount === 1 ? "Already shared with this plan." : "Already shared with these plans.", 
          details: results 
        });
      }
      return res.status(400).json({ success: false, message: "Failed to share lead.", details: results });
    }

    res.status(200).json({ success: true, message: `Lead shared with ${successCount} plan(s).`, details: results });
  } catch (error) {
    console.error("Error sharing requirement:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Trigger automated lead sharing with timer
exports.triggerLeadSharingTimer = async (req, res) => {
  try {
    const { id } = req.params;
    let { timer, timerUnit } = req.body;
    
    const plans = ["Pro", "Premium", "Standard"];
    let finalTimer = Number(timer) || 10;
    if (timerUnit === "hours") {
      finalTimer = finalTimer * 60;
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: "Requirement not found." });
    }

    // CHECK: Only allow automation for requirements with NO matches
    let finalMatchType = "exact";
    if (requirement.lat && requirement.lng) {
      const globalExactQuery = getPropertyMatchQuery(null, requirement, "exact");
      const exactExists = await Property.exists(globalExactQuery);
      if (!exactExists) {
        finalMatchType = "radius";
      }
    }

    const globalMatchQuery = getPropertyMatchQuery(null, requirement, finalMatchType);
    
    // Find all properties that match
    const matchingProperties = await Property.find(globalMatchQuery).select("seller");
    const matchingSellerIds = [...new Set(matchingProperties.map(p => p.seller.toString()))];

    let hasActiveMatches = false;
    if (matchingSellerIds.length > 0) {
      const Subscription = mongoose.model("Subscription");
      const activeSubs = await Subscription.exists({
        user: { $in: matchingSellerIds },
        status: "active",
        endDate: { $gt: new Date() }
      });
      if (activeSubs) hasActiveMatches = true;
    }

    if (hasActiveMatches) {
      return res.status(400).json({ 
        success: false, 
        message: "Automated sharing is disabled for requirements with existing matches. Please use the manual 'Share' button instead." 
      });
    }

    // NEW: Clean up all previous shared leads for this requirement to start fresh
    await SharedLead.deleteMany({ requirement: id });

    // Initialize sharing config
    requirement.sharingStatus = "in-progress";
    requirement.acceptedBy = null; // Clear previous acceptance if resharing
    requirement.sharingConfig = {
      plans: plans,
      timer: finalTimer,
      currentPlanIndex: 0,
      startTime: new Date()
    };

    await requirement.save();

    // Execute first step (or skip to next if no sellers)
    const io = req.app.get("socketio");
    let currentPlanIndex = 0;
    let success = false;

    while (currentPlanIndex < plans.length && !success) {
      const currentPlan = plans[currentPlanIndex];
      const result = await exports.internalShareLeadWithPlanName(id, currentPlan, io, 3);
      
      if (result.status === "success" || result.status === "already_shared") {
        success = true;
        requirement.sharingConfig.currentPlanIndex = currentPlanIndex;
        requirement.sharingConfig.startTime = new Date();
        requirement.markModified('sharingConfig');
        await requirement.save();
      } else {
        currentPlanIndex++;
      }
    }

    if (!success) {
      requirement.sharingStatus = "expired";
      requirement.status = "Closed";
      await requirement.save();
      return res.status(200).json({
        success: true,
        message: "Timer mode started, but no eligible sellers found. Marked as expired.",
        data: requirement
      });
    }

    res.status(200).json({
      success: true,
      message: `Lead sharing timer started. Currently sharing with ${plans[currentPlanIndex]} agents.`,
      data: requirement
    });
  } catch (error) {
    console.error("Error triggering lead sharing timer:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Stop lead sharing timer manually
exports.stopLeadSharingTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findById(id);
    if (!requirement) return res.status(404).json({ success: false, message: "Requirement not found." });

    requirement.sharingStatus = "none";
    requirement.sharingConfig = undefined;
    await requirement.save();

    res.status(200).json({ success: true, message: "Lead sharing timer stopped." });
  } catch (error) {
    console.error("Error stopping lead sharing timer:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Check and process expiry for a specific requirement (Immediate response for UI)
exports.checkRequirementExpiry = async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findById(id);
    if (!requirement) return res.status(404).json({ success: false, message: "Requirement not found." });

    if (requirement.sharingStatus !== "in-progress") {
      return res.status(200).json({ success: true, message: "Requirement is not in timer mode." });
    }

    const { processLeadSharingExpiry } = require("../utils/leadSharingUtils");
    const io = req.app.get("socketio");

    await processLeadSharingExpiry(requirement, io);

    res.status(200).json({ success: true, message: "Expiry check processed." });
  } catch (error) {
    console.error("Error checking requirement expiry:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

