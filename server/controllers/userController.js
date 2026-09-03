// controllers/userController.js
const User = require("../models/User");
const Role = require("../models/Role");
const BusinessType = require("../models/BusinessType");
const BuilderProfile = require("../models/BuilderProfile");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Property = require("../models/Property");
const Subscription = require("../models/Subscription");
const { sendBadgeVerificationNotification, sendBadgeRequestNotificationToAdmin, sendSubscriptionExpiredNotification } = require("../utils/emailService");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: "Please enter a valid 10-digit phone number" });
  }

  // Hardcoded test account for app store review
  const isTestAccount = phone === "9999999999";

  // Generate 6-digit OTP
  const otp = isTestAccount ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes duration

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      // Create new user automatically for first-time OTP request
      const userRole = await Role.findOne({ role_name: "user" });
      const customId = `USER-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      user = new User({
        phone,
        role_id: userRole?._id,
        isVerified: false,
        customId,
        name: "User" // Default name
      });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    if (!isTestAccount) {
      // Send OTP via BulkSMSPlans API
      const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
      const smsMessage = `Your OTP for ABM GROUPS verification is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`;
      const smsUrl = process.env.BULKSMS_API_URL
        .replace("{{phone}}", formattedPhone)
        .replace("{{message}}", encodeURIComponent(smsMessage));

      try {
        await axios.get(smsUrl);
        console.log(`SMS sent successfully to ${phone}`);
      } catch (smsError) {
        console.error("SMS Gateway Error:", smsError.message);
      }
    }

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Send Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    let user;

    if (phone === "9999999999" && otp === "123456") {
      user = await User.findOne({ phone }).populate(["role_id", "businessType", "builderProfile"]);
    } else {
      user = await User.findOne({
        phone,
        otp,
        otpExpires: { $gt: Date.now() },
      }).populate(["role_id", "businessType", "builderProfile"]);
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
};

exports.requestPhoneUpdate = async (req, res) => {
  const { newPhone } = req.body;
  const userId = req.user.id;

  if (!newPhone || newPhone.length !== 10) {
    return res.status(400).json({ error: "Please enter a valid 10-digit phone number" });
  }

  try {
    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already in use by another account" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findById(userId);
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.pendingPhone = newPhone;
    await user.save();

    // Send OTP via BulkSMSPlans API
    const formattedPhone = `91${newPhone}`;
    const smsMessage = `Your OTP for ABM GROUPS verification is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`;
    const smsUrl = process.env.BULKSMS_API_URL
      .replace("{{phone}}", formattedPhone)
      .replace("{{message}}", encodeURIComponent(smsMessage));

    try {
      await axios.get(smsUrl);
    } catch (smsError) {
      console.error("SMS Gateway Error:", smsError.message);
    }

    res.json({ success: true, message: "OTP sent to new phone number" });
  } catch (error) {
    console.error("Phone Update Request Error:", error);
    res.status(500).json({ error: "Failed to request phone update" });
  }
};

exports.verifyPhoneUpdate = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findOne({
      _id: userId,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user || !user.pendingPhone) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.phone = user.pendingPhone;
    user.pendingPhone = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Phone number updated successfully", phone: user.phone });
  } catch (error) {
    console.error("Phone Update Verify Error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate([
      "role_id", 
      "businessType", 
      "builderProfile",
      {
        path: "activeSubscription",
        populate: { path: "plan" }
      }
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    // --- Immediate Subscription Expiry Check ---
    if (user.activeSubscription && user.activeSubscription.status === 'active') {
      const now = new Date();
      if (user.activeSubscription.endDate < now) {
        console.log(`User ${user._id} subscription expired during panel access. Processing...`);
        
        // 1. Mark subscription as expired
        const subscription = await Subscription.findById(user.activeSubscription._id).populate('plan');
        subscription.status = "expired";
        await subscription.save();
        
        // 2. Update user object and save
        user.activeSubscription = null;
        await user.save();
        
        // 3. Send Email Notification
        try {
          await sendSubscriptionExpiredNotification(user, subscription);
        } catch (emailErr) {
          console.error("Failed to send expiry email during panel access:", emailErr);
        }
      }
    }
    // -------------------------------------------

    // [BOOTSTRAP LOGIC] 
    // If no Super Admin exists in the system yet, promote the current admin to Super Admin
    if (user.role_id.role_name === "admin" && !user.isSuperAdmin) {
      const superAdminExists = await User.exists({ isSuperAdmin: true });
      if (!superAdminExists) {
        user.isSuperAdmin = true;
        await user.save();
        console.log(`Bootstrapped Super Admin: ${user.phone}`);
      }
    }

    // Include property count for frontend verification checks (Active + Pending)
    const propertyCount = await Property.countDocuments({ 
      seller: user._id,
      status: { $in: ["Active", "Pending", "Edit Pending Approval"] }
    });
    
    // Add propertyCount to the user object (as a plain object property)
    const userData = user.toObject();
    userData.propertyCount = propertyCount;

    res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, verified } = req.query;
    let query = {};

    // Filter by role if provided
    if (role) {
      const roleDoc = await Role.findOne({ role_name: role.toLowerCase() });
      if (roleDoc) query.role_id = roleDoc._id;
      else return res.json([]);
    }

    // Filter by verification status if provided
    if (verified !== undefined) {
      query.isVerified = verified === "true";
    }

    // [ALLOCATION FILTERING]
    // If not a Super Admin, only show users assigned to this admin
    const requester = await User.findById(req.user.id);
    if (requester && !requester.isSuperAdmin) {
      query.assignedAdmin = requester._id;
    }

    const users = await User.find(query)
      .populate(["role_id", "businessType", "builderProfile"])
      .populate("createdBy", "name")
      .populate("assignedAdmin", "name phone");

    // Fetch pending property count for each user
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const pendingPropertyCount = await Property.countDocuments({
        seller: user._id,
        status: "Pending"
      });
      const editPendingCount = await Property.countDocuments({
        seller: user._id,
        status: "Edit Pending Approval"
      });
      
      const userData = user.toObject();
      userData.pendingPropertyCount = pendingPropertyCount;
      userData.editPendingCount = editPendingCount;
      return userData;
    }));

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicUsers = async (req, res) => {
  try {
    const { businessType, limit } = req.query;
    let query = { isVerified: true };

    if (businessType) query.businessType = businessType;

    const sellerRole = await Role.findOne({ role_name: "seller" });
    if (sellerRole) query.role_id = sellerRole._id;

    const users = await User.find(query)
      .select("name phone profile_image role_id isVerified badgeVerified builderProfile businessType slug")
      .populate(["role_id", "builderProfile", "businessType"])
      .limit(parseInt(limit) || 20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicAdmins = async (req, res) => {
  try {
    const adminRole = await Role.findOne({ role_name: "admin" });
    if (!adminRole) return res.status(404).json({ error: "Admin role not found" });

    const admins = await User.find({ role_id: adminRole._id })
      .select("name profile_image role_id slug")
      .populate("role_id");

    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name phone profile_image role_id isVerified badgeVerified builderProfile businessType slug")
      .populate(["role_id", "builderProfile", "businessType"]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("+slug")
      .populate(["role_id", "businessType", "builderProfile"]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let updateData = { ...req.body };

    // Restriction: Badge-verified sellers cannot change their businessType
    const existingUser = await User.findById(userId).populate("builderProfile");
    if (!existingUser) return res.status(404).json({ error: "User not found" });

    if (existingUser.badgeVerified && updateData.businessType && String(updateData.businessType) !== String(existingUser.businessType)) {
      return res.status(403).json({ error: "Badge-verified sellers cannot change their Business Type" });
    }

    // Handle File Uploads (profile_image and company_logo)
    if (req.files) {
      if (req.files.profile_image) {
        updateData.profile_image = `/uploads/profiles/${req.files.profile_image[0].filename}`;
        if (existingUser.profile_image) {
          const oldImagePath = path.join(__dirname, "..", existingUser.profile_image);
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
      }
      if (req.files.company_logo) {
        updateData.company_logo = `/uploads/profiles/${req.files.company_logo[0].filename}`;
        if (existingUser.builderProfile && existingUser.builderProfile.companyLogo) {
          const oldLogoPath = path.join(__dirname, "..", existingUser.builderProfile.companyLogo);
          if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
        }
      }
    }

    // Handle Image Deletions
    if (req.body.remove_image === "true" && existingUser.profile_image) {
      const oldImagePath = path.join(__dirname, "..", existingUser.profile_image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      updateData.profile_image = null;
    }
    if (req.body.remove_company_logo === "true" && existingUser.builderProfile && existingUser.builderProfile.companyLogo) {
      const oldLogoPath = path.join(__dirname, "..", existingUser.builderProfile.companyLogo);
      if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
      updateData.company_logo = null;
    }

    // BuilderProfile Upsert Logic
    const isBuilderOrPromoter = existingUser.businessType && 
      (req.user.businessType || existingUser.businessType).name?.match(/Builder|Promoter/i);

    // If we have builder-specific fields or the user is identified as such
    if (req.body.builderDetail) {
      const builderData = typeof req.body.builderDetail === 'string' 
        ? JSON.parse(req.body.builderDetail) 
        : req.body.builderDetail;
      
      if (updateData.company_logo !== undefined) {
        builderData.companyLogo = updateData.company_logo;
      }
      if (updateData.profile_image !== undefined) {
          builderData.profileImage = updateData.profile_image;
      }

      const bp = await BuilderProfile.findOneAndUpdate(
        { user: userId },
        { ...builderData, user: userId },
        { upsert: true, new: true, runValidators: true }
      );
      updateData.builderProfile = bp._id;
    }

    // Restriction: Only Super Admins can update permissions, isSuperAdmin status, or assignedAdmin
    if (updateData.permissions !== undefined || updateData.isSuperAdmin !== undefined || updateData.assignedAdmin !== undefined) {
      const requester = await User.findById(req.user.id);
      if (!requester || !requester.isSuperAdmin) {
        delete updateData.permissions;
        delete updateData.isSuperAdmin;
        delete updateData.assignedAdmin;
      }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { 
      new: true,
      runValidators: true 
    }).populate(["role_id", "businessType", "builderProfile"]);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Emit event if admin updated badgeRequestStatus or badgeVerified
    if (req.body.badgeRequestStatus !== undefined || req.body.badgeVerified !== undefined) {
      const io = req.app.get("socketio");
      if (io) {
        io.to(`seller-${user._id}`).emit("badge-status-changed", {
          badgeRequestStatus: user.badgeRequestStatus,
          badgeVerified: user.badgeVerified,
          message: `Your badge verification request has been ${user.badgeRequestStatus === "none" ? "updated" : user.badgeRequestStatus}.`,
        });
        
        io.to("admin-room").emit("badge-verification-requested", {
          sellerId: user._id,
        }); // Notify other admins
      }

      // Send Email Notification
      try {
        let status = "none";
        if (user.badgeVerified) status = "verified";
        else if (user.badgeRequestStatus === "approved") status = "approved";
        else if (user.badgeRequestStatus === "rejected") status = "rejected";

        if (status !== "none") {
          await sendBadgeVerificationNotification(user, status, req.body.badgeUpdateMessage || "");
        }
      } catch (emailError) {
        console.error("Failed to send badge verification email:", emailError);
      }
    }

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Phone number already in use" });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.profile_image) {
      const imagePath = path.join(__dirname, "..", user.profile_image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Wishlist methods
exports.addToWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.wishlist.some(id => id.toString() === propertyId)) {
      return res.status(400).json({ message: "Property already in wishlist" });
    }
    user.wishlist.push(propertyId);
    await user.save();
    res.status(200).json({ message: "Added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.wishlist = user.wishlist.filter(id => id.toString() !== propertyId);
    await user.save();
    res.status(200).json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.upgradeToSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessType, name, phone } = req.body;

    const sellerRole = await Role.findOne({ role_name: "seller" });
    if (!sellerRole) return res.status(500).json({ error: "Seller role missing" });

    if (businessType) {
      const btExists = await BusinessType.findById(businessType);
      if (!btExists) return res.status(400).json({ error: "Invalid Business Type" });
    }

    const user = await User.findByIdAndUpdate(userId, {
      role_id: sellerRole._id,
      name,
      phone,
      businessType
    }, { new: true }).populate(["role_id", "businessType"]);

    res.json({ success: true, message: "Upgraded successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate([
      "role_id", 
      "businessType",
      {
        path: "activeSubscription",
        populate: { path: "plan" }
      }
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const propertyCount = await Property.countDocuments({ 
      seller: user._id,
      status: { $in: ["Active", "Pending", "Edit Pending Approval"] }
    });
    const userData = user.toObject();
    userData.propertyCount = propertyCount;

    res.json({ success: true, token: generateToken(user._id), user: userData });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.getSellersByPropertyBusinessType = async (req, res) => {
  try {
    const { businessTypeId } = req.params;
    const Property = require("../models/Property");
    const sellersIds = await Property.find({ businessType: businessTypeId }).distinct("seller");
    const sellers = await User.find({ _id: { $in: sellersIds } })
      .select("name phone profile_image role_id isVerified badgeVerified builderProfile businessType slug")
      .populate(["role_id", "builderProfile", "businessType"]);
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestBadgeVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.badgeRequestStatus === "pending") return res.status(400).json({ error: "Request already pending" });
    user.badgeRequestStatus = "pending";
    await user.save();

    // Emit event to admin room using app instance
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("badge-verification-requested", {
        sellerId: user._id,
        sellerName: user.name,
        sellerPhone: user.phone,
        message: `New badge verification request from ${user.name || 'Seller'}`,
      });
    }

    // Send Email Notification to Admin
    try {
      await sendBadgeRequestNotificationToAdmin(user);
    } catch (emailError) {
      console.error("Failed to send badge request email to admin:", emailError);
    }

    res.json({ message: "Verification request sent", status: "pending" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingBadgeRequestsCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ badgeRequestStatus: "pending" });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUserByAdmin = async (req, res) => {
  try {
    const { name, phone, role_id, permissions, isSuperAdmin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ error: "User already exists with this phone number" });

    // Only Super Admins can assign permissions or set Super Admin status
    const requester = await User.findById(req.user.id);
    const finalPermissions = requester?.isSuperAdmin ? (permissions || []) : [];
    const finalIsSuperAdmin = requester?.isSuperAdmin ? (isSuperAdmin || false) : false;

    const user = new User({
      name,
      phone,
      role_id,
      isVerified: true, // Admin-created users are pre-verified
      createdBy: req.user.id,
      permissions: finalPermissions,
      isSuperAdmin: finalIsSuperAdmin,
      // Auto-assign to sub-admin creator
      assignedAdmin: !requester?.isSuperAdmin ? requester?._id : (req.body.assignedAdmin || undefined)
    });

    await user.save();
    res.status(201).json({ success: true, message: "User created by admin", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkAssignAdmin = async (req, res) => {
  try {
    const { userIds, assignedAdminId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No users selected" });
    }

    // Only Super Admins can perform bulk assignment
    const requester = await User.findById(req.user.id);
    if (!requester || !requester.isSuperAdmin) {
      return res.status(403).json({ error: "Access denied. Super Admin only." });
    }

    // Update all users in one go
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { assignedAdmin: assignedAdminId || null } }
    );

    res.json({ 
      success: true, 
      message: `${userIds.length} users updated successfully` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAdminNotificationCounts = async (req, res) => {
  try {
    const Enquiry = require("../models/Enquiry");
    const Requirement = require("../models/Requirement");
    const RequestCall = require("../models/RequestCall");
    const Contact = require("../models/Contact");
    const Property = require("../models/Property");
    const Role = require("../models/Role");
    const MarketingRequest = require("../models/MarketingRequest");
    const SupportTicket = require("../models/SupportTicket");
    const WhatsappLead = require("../models/WhatsappLead");



    const requester = await User.findById(req.user.id);
    const isSuperAdmin = requester?.isSuperAdmin;

    // 1. Pending Badge Requests
    const badgeQuery = { badgeRequestStatus: "pending" };
    if (!isSuperAdmin) {
      badgeQuery.assignedAdmin = req.user.id;
    }
    const badgeRequests = await User.countDocuments(badgeQuery);

    // 2. Pending Seller Properties
    const sellerRole = await Role.findOne({ role_name: "seller" });
    let sellerProperties = 0;
    if (sellerRole) {
      const sellerQuery = { role_id: sellerRole._id };
      if (!isSuperAdmin) {
        sellerQuery.assignedAdmin = req.user.id;
      }
      
      const assignedSellerIds = await User.find(sellerQuery).distinct("_id");
      
      sellerProperties = await Property.countDocuments({ 
        status: "Pending",
        seller: { $in: assignedSellerIds }
      });
    }

    // 3. New Enquiries (Admin-owned properties only)
    const adminRole = await Role.findOne({ role_name: { $regex: /admin/i } });
    const adminUserIds = await User.find({ role_id: adminRole?._id }).distinct("_id");
    
    let enquiryQuery = { status: "new", seller_id: { $in: adminUserIds } };
    
    const enquiryCount = await Enquiry.countDocuments(enquiryQuery);
    const whatsappCount = await WhatsappLead.countDocuments(enquiryQuery); // Uses same filter
    const enquiries = enquiryCount + whatsappCount;


    // 4. Pending Requirements
    let requirementQuery = { status: "Pending" };
    if (!isSuperAdmin) {
      const assignedUserIds = await User.find({ assignedAdmin: req.user.id }).distinct("_id");
      requirementQuery.user = { $in: assignedUserIds };
    }
    const requirements = await Requirement.countDocuments(requirementQuery);

    // 5. New Call Requests
    // Note: If RequestCall doesn't have assigned user tracking, it remains global for now or Super Admin only
    const callRequests = await RequestCall.countDocuments({ status: "new" });

    // 6. New Contact Messages
    const contactMessages = await Contact.countDocuments({ status: "new" });

    // 7. Pending Marketing Requests
    let marketingQuery = { status: "pending" };
    if (!isSuperAdmin) {
      const assignedSellerIds = await User.find({ assignedAdmin: req.user.id }).distinct("_id");
      marketingQuery.seller_id = { $in: assignedSellerIds };
    }
    const marketingRequests = await MarketingRequest.countDocuments(marketingQuery);

    // 8. New Support Tickets (Unread by Admin)
    let supportQuery = { isAdminRead: false };
    if (!isSuperAdmin) {
      const assignedSellerIds = await User.find({ assignedAdmin: req.user.id }).distinct("_id");
      supportQuery.seller = { $in: assignedSellerIds };
    }
    const supportTickets = await SupportTicket.countDocuments(supportQuery);


    res.json({
      success: true,
      counts: {
        badgeRequests,
        sellerProperties,
        enquiries,
        requirements,
        callRequests,
        contactMessages,
        marketingRequests,
        supportTickets
      }
    });
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    res.status(500).json({ error: error.message });
  }
};
