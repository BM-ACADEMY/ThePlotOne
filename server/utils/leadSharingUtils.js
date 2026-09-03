const Requirement = require("../models/Requirement");
const SharedLead = require("../models/SharedLead");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const processingRequirements = new Set();

/**
 * Processes lead sharing expiry for a specific requirement.
 * This can be called by a cron job or manually via an API endpoint.
 * @param {Object} req - The Requirement document
 * @param {Object} io - Socket.io instance
 */
exports.processLeadSharingExpiry = async (req, io) => {
  if (processingRequirements.has(req._id.toString())) return;
  processingRequirements.add(req._id.toString());

  try {
    const { internalShareLeadWithPlanName } = require("../controllers/requirementController");

    // 1. Check if lead has been accepted
    const acceptedLead = await SharedLead.findOne({ 
      requirement: req._id, 
      status: "accepted" 
    });

    if (acceptedLead) {
      req.sharingStatus = "completed";
      await req.save();
      console.log(`✅ Lead sharing completed for requirement ${req._id} (Accepted)`);
      return;
    }

    // 2. Check if timer has expired
    const now = new Date();
    const startTime = new Date(req.sharingConfig.startTime);
    const timerInMinutes = req.sharingConfig.timer;
    const diffInMinutes = (now - startTime) / (1000 * 60);

    // Use a small buffer (0.1 min) or just check >=
    if (diffInMinutes >= timerInMinutes) {
      const plans = req.sharingConfig.plans || [];
      const currentPlanName = plans[req.sharingConfig.currentPlanIndex];
      console.log(`⏭ Timer expired for ${currentPlanName}. Marking as "Deal Closed (Plan Level)" and moving to next...`);
      
      // Mark the current plan's share as "Deal Closed (Plan Level)"
      const matchingPlans = await SubscriptionPlan.find({ name: currentPlanName });
      const planIds = matchingPlans.map(p => p._id);
      
      await SharedLead.updateMany(
        { requirement: req._id, plan: { $in: planIds }, status: "pending" },
        { status: "Deal Closed (Plan Level)" }
      );

      let nextIndex = req.sharingConfig.currentPlanIndex + 1;
      let success = false;

      while (nextIndex < plans.length && !success) {
        const nextPlan = plans[nextIndex];
        console.log(`⏭ Attempting to move to next plan: ${nextPlan} for requirement ${req._id}`);
        
        const result = await internalShareLeadWithPlanName(req._id, nextPlan, io, 3);
        
        if (result.status === "success" || result.status === "already_shared") {
          success = true;
          req.sharingConfig.currentPlanIndex = nextIndex;
          
          // PRECISE TIMER: Set start time to exactly when the previous one should have ended
          // This prevents the timer from "shifting" due to cron delays
          const scheduledEndTime = new Date(startTime.getTime() + timerInMinutes * 60000);
          // If we are WAY behind (e.g. server was down), use now, otherwise use scheduled
          req.sharingConfig.startTime = (now - scheduledEndTime > 60000) ? now : scheduledEndTime;
          
          req.markModified("sharingConfig");
          await req.save();
          console.log(`✅ ${result.status === "already_shared" ? "Confirmed existing share with" : "Successfully moved to"} ${nextPlan} (Requirement: ${req._id})`);
          
          if (io) {
            io.emit("admin-lead-updated", { requirementId: req._id });
            io.emit("lead-expired-for-plan", { requirementId: req._id });
          }
        } else {
          console.log(`⚠️ No sellers in ${nextPlan} (Status: ${result.status}), skipping to next...`);
          nextIndex++;
        }
      }

      if (!success) {
        // No more plans with agents left
        req.sharingStatus = "expired";
        req.status = "Closed";
        req.markModified("sharingStatus");
        await req.save();

        await SharedLead.updateMany(
          { requirement: req._id, status: "pending" },
          { status: "Deal Closed (Plan Level)" }
        );

        if (io) {
          io.emit("admin-lead-updated", { requirementId: req._id });
          io.emit("lead-expired-for-plan", { requirementId: req._id });
        }

        console.log(`❌ All plans exhausted for requirement ${req._id}. Marked as unclaimed and closed for sellers.`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing expiry for ${req._id}:`, error);
  } finally {
    processingRequirements.delete(req._id.toString());
  }
};
