// controllers/propertyController.js
const mongoose = require("mongoose");
const Property = require("../models/Property");
const Enquiry = require("../models/Enquiry");
const PropertyView = require("../models/PropertyView");
const fs = require("fs");
const path = require("path");
const PropertyType = require("../models/PropertyType");
const ApprovalType = require("../models/ApprovalType");
const User = require("../models/User");
const BusinessType = require("../models/BusinessType");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const WebsiteSetting = require("../models/WebsiteSetting");
const { sendPropertyNotification } = require("../utils/emailService");

const parseJSON = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
};

exports.createProperty = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.isSuperAdmin || req.user.role_id?.role_name?.toLowerCase() === "admin");

    // Check property limit for non-admin users
    if (!isAdmin) {
      const propertyCount = await Property.countDocuments({ 
        seller: req.user._id,
        status: { $in: ["Active", "Pending", "Edit Pending Approval"] }
      });

      // 🛡️ Restriction 1: Unverified profiles can only list ONE property
      if (propertyCount >= 1 && !req.user.badgeVerified) {
        return res.status(403).json({ 
          error: "First complete your profile, once verified your profile then only you listing other properties",
          reason: "unverified"
        });
      }

      // 🛡️ Restriction 2: Role-based limits for verified sellers
      const settings = await WebsiteSetting.findOne();
      let propertyLimit = settings?.sellerPropertyLimit || 3; // Default fallback
      let planName = settings?.defaultPlanName || "FREE";

      // A. If user has an active subscription, use its limit
      if (req.user.activeSubscription) {
        const subscription = await Subscription.findById(req.user.activeSubscription).populate("plan");
        if (subscription && subscription.status === "active" && subscription.plan) {
          propertyLimit = subscription.plan.propertyLimit;
          planName = subscription.plan.name;
        }
      } else {
        // B. Free Tier Limits (Based on Business Type)
        const businessTypeName = req.user.businessType?.name || "";
        
        if (businessTypeName.match(/Builder|Promoter/i)) {
          propertyLimit = 1; // Builders: Max 1 property for free
        } else if (businessTypeName.match(/Agent|Owner/i)) {
          propertyLimit = 3; // Agents/Owners: Max 3 properties for free
        }
      }

      // Check if limit is reached (propertyLimit of -1 means unlimited)
      if (propertyLimit !== -1 && propertyCount >= propertyLimit) {
        // Delete uploaded files to avoid garbage
        if (req.files) {
          const filesToDelete = [...(req.files.images || []), ...(req.files.floorPlan || [])];
          filesToDelete.forEach((file) => {
            try {
              fs.unlinkSync(path.join(__dirname, "../uploads/properties", file.filename));
            } catch (err) {
              console.error("Error deleting file:", err);
            }
          });
        }
        
        return res.status(403).json({ 
          error: `Your ${planName} plan allows only ${propertyLimit} properties. Please upgrade your plan for more uploads.`,
          limitReached: true,
          currentCount: propertyCount,
          limit: propertyLimit,
          reason: "limit_reached"
        });
      }
    }

    // Handle Files (images and floorPlan)
    let images = [];
    let floorPlans = [];

    if (req.files) {
      if (req.files.images) {
        images = req.files.images.map((file) => ({
          image_url: `/uploads/properties/${file.filename}`,
        }));
      }
      if (req.files.floorPlans && req.files.floorPlans.length > 0) {
        floorPlans = req.files.floorPlans.map((file) => `/uploads/properties/${file.filename}`);
      }
    }

    // Arrays might come as strings or arrays depending on frontend
    const amenities = typeof req.body.amenities === 'string' ? JSON.parse(req.body.amenities) : (req.body.amenities || []);

    const removeEmptyStrings = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      Object.keys(obj).forEach(key => {
        if (obj[key] === "") {
          delete obj[key];
        } else if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
          removeEmptyStrings(obj[key]);
        }
      });
      return obj;
    };

    const location = removeEmptyStrings(parseJSON(req.body.location) || {});
    const basicInfo = removeEmptyStrings(parseJSON(req.body.basicInfo) || {});
    const pricing = removeEmptyStrings(parseJSON(req.body.pricing) || {});
    const specifications = removeEmptyStrings(parseJSON(req.body.specifications) || {});
    const legal = removeEmptyStrings(parseJSON(req.body.legal) || {});
    const mediaMetadata = parseJSON(req.body.media) || {};

    let sellerId = req.user && req.user._id ? req.user._id : req.body.seller;

    // If an admin creates a property, attribute it to the Super Admin (to hide sub-admin identity)
    if (isAdmin) {
      // If no seller specified OR if the admin is assigning it to themselves
      if (!req.body.seller || req.body.seller === String(req.user._id)) {
        const superAdmin = await User.findOne({ isSuperAdmin: true }).sort({ createdAt: 1 });
        if (superAdmin) {
          sellerId = superAdmin._id;
        }
      }
    }

    const propertyData = {
      ...req.body,
      basicInfo,
      pricing,
      specifications,
      legal,
      amenities,
      location,
      seller: sellerId,
      businessType: isAdmin 
        ? (req.body.businessType || null) 
        : (req.user && req.user.businessType ? (req.user.businessType._id || req.user.businessType) : (req.body.businessType || null)),
      video: mediaMetadata.video || req.body.video || "",
      floorPlan: floorPlans.length > 0 ? floorPlans[0] : (mediaMetadata.floorPlan || req.body.floorPlan || ""),
      media: {
        images: images.map(img => img.image_url),
        featuredImage: images.length > 0 ? images[0].image_url : "",
        video: mediaMetadata.video || req.body.video || "",
        floorPlan: floorPlans.length > 0 ? floorPlans[0] : (mediaMetadata.floorPlan || req.body.floorPlan || ""),
        floorPlans: floorPlans
      },
      status: "Pending",
      isVerified: false,
      createdBy: isAdmin ? req.user._id : (req.body.createdBy || null),
    };

    const property = new Property(propertyData);
    await property.save();

    // Role and BusinessType Automation: Update user profile on first successful listing
    if (req.user && req.user.role_id) {
      const Role = require("../models/Role");
      const currentRole = await Role.findById(req.user.role_id);
      const isAdmin = currentRole && currentRole.role_name === "admin";

      if (!isAdmin) {
        const updateData = {};
        let needsUpdate = false;

        // 1. Upgrade 'user' to 'seller' if they are posting for the first time
        if (currentRole && currentRole.role_name === "user") {
          const sellerRole = await Role.findOne({ role_name: "seller" });
          if (sellerRole) {
            updateData.role_id = sellerRole._id;
            needsUpdate = true;
          }
        }

        // 2. Set BusinessType on user profile if it's missing but provided in the request
        // businessType should only be stored once verified/listed (as per user requirement)
        if (!req.user.businessType && req.body.businessType) {
          updateData.businessType = req.body.businessType;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await User.findByIdAndUpdate(req.user._id, updateData);
          console.log(`User profile updated for ${req.user._id}:`, updateData);
        }
      }
    }

    res.status(201).json(property);

    // Emit socket event for real-time notification in admin panel
    const io = req.app.get("socketio");
    if (io) {
      const isSellerProperty = req.user?.role_id?.role_name?.toLowerCase() === "seller" || 
                               req.user?.role?.name?.toLowerCase() === "seller";
      
      io.to("admin-room").emit("new-property-listed", {
        propertyId: property._id,
        title: property.basicInfo?.title,
        sellerName: req.user?.name || "A Seller",
        isSellerProperty: isSellerProperty,
        message: `New property listed: ${property.basicInfo?.title}`,
      });
    }

    // Send email notification for new listing
    try {
      const seller = await User.findById(property.seller);
      await sendPropertyNotification(property, seller, "new_listing");
    } catch (emailError) {
      console.error("Email notification error (create):", emailError);
    }
  } catch (error) {
    console.error("Create Property Error:", error); // Log full error
    res.status(500).json({ error: error.message }); // Send 500 with message to see it in frontend
  }
};

exports.getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      location,
      minPrice,
      maxPrice,
      approval,
      random, // New: Randomize results
      businessType, // New: Filter by seller's business type
      isVerified, // Renamed from is_verified
      seller_id,
      excludeId,
      isSold,
      usageType,
      category,
    } = req.query;
    const queryConditions = [];

    // 1. Role / Ownership
    if (req.query.role) {
      const Role = require("../models/Role");
      const targetRole = req.query.role.toLowerCase();
      const roleDoc = await Role.findOne({ role_name: { $regex: new RegExp(`^${targetRole}$`, "i") } });
      if (roleDoc) {
        const usersWithRole = await User.find({ role_id: roleDoc._id }).distinct("_id");
        queryConditions.push({ seller: { $in: usersWithRole } });
      }
    }

    if (seller_id) {
      if (seller_id === "me" && req.user) {
        queryConditions.push({ seller: req.user._id });
      } else if (seller_id !== "me") {
        queryConditions.push({ seller: seller_id });
      }
    }

    // 2. Business Type
    if (businessType) {
      const bTypeArray = businessType.split(',').map(id => id.trim());
      queryConditions.push({ businessType: { $in: bTypeArray } });
    }

    // 3. Status / Verification
    if (excludeId) {
      queryConditions.push({
        _id: mongoose.isValidObjectId(excludeId) ? { $ne: new mongoose.Types.ObjectId(excludeId) } : { $ne: excludeId }
      });
    }

    if (isSold !== undefined) {
      if (isSold === "false") {
        queryConditions.push({ isSold: { $in: [false, undefined, null] } });
      } else if (isSold === "true") {
        queryConditions.push({ isSold: true });
      }
    }

    if (isVerified) {
      queryConditions.push({ isVerified: isVerified === "true" });
    }

    // 3.1 Status filter for public listings & Admin filtering
    const requesterId = req.user?._id ? String(req.user._id) : (req.user?.id ? String(req.user.id) : null);
    
    // Check if requester is an admin and if they are a Super Admin
    const userDoc = req.user?._id ? await User.findById(req.user._id).populate("role_id") : null;
    const isAdmin = userDoc?.role_id?.role_name?.toLowerCase() === "admin";
    const isSuperAdmin = userDoc?.isSuperAdmin;
    
    // Sub-admin boundary logic
    if (isAdmin && !isSuperAdmin) {
      // Find all users/sellers assigned to this sub-admin
      const assignedUserIds = await User.find({ assignedAdmin: req.user._id }).distinct("_id");
      
      // Sub-admin should see properties from their assigned sellers OR properties they created themselves
      queryConditions.push({ 
        $or: [
          { seller: { $in: assignedUserIds } },
          { seller: req.user._id },
          { createdBy: req.user._id }
        ]
      });
    }
    
    // Check if the requester is the owner of the properties being queried
    let isMe = false;
    if (requesterId && seller_id) {
      const sid = String(seller_id);
      if (sid === "me" || sid === requesterId) {
        isMe = true;
      }
    }
    
    // Public vs Admin Visibility
    if (!isAdmin && !isMe) {
      queryConditions.push({ status: { $in: ["Active", "Edit Pending Approval"] } });
    }


    // 4. Property Specifications
    if (type) {
      const typeArray = type.split(',').map(t => t.trim());
      queryConditions.push({ "basicInfo.propertyType": { $in: typeArray } });
    }
    if (approval) {
      const approvalArray = approval.split(',').map(a => a.trim());
      queryConditions.push({ "basicInfo.approvalType": { $in: approvalArray } });
    }
    if (category) {
      const categoryArray = category.split(',').map(c => c.trim());
      queryConditions.push({ "basicInfo.category": { $in: categoryArray } });
    }

    if (usageType) {
      const usageTypeArray = usageType.split(',').map(u => u.trim());
      queryConditions.push({ "basicInfo.usageType": { $in: usageTypeArray } });
    }

    if (location) {
      const locationTokens = location.split(',').map(tok => tok.trim()).filter(tok => tok.length > 0);
      if (locationTokens.length > 0) {
        const locationOrConditions = locationTokens.flatMap(token => {
          const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const tokenRegex = { $regex: escapedToken, $options: "i" };
          return [
            { "location.city": tokenRegex },
            { "location.locality": tokenRegex }
          ];
        });
        queryConditions.push({ $or: locationOrConditions });
      }
    }

    // 5. Advanced Search
    if (search) {
      const tokens = search.split(/[\s,]+/).filter(t => t.length > 0);

      if (tokens.length > 0) {
        // 1. Create conditions for each individual token (AND logic)
        const tokenConditions = await Promise.all(tokens.map(async (token) => {
          const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const tokenRegex = { $regex: escapedToken, $options: "i" };

          // Find sellers matching this specific token
          const matchingSellers = await User.find({
            $or: [
              { name: tokenRegex },
              { phone: tokenRegex }
            ]
          }).distinct("_id");

          // Find business types matching this specific token
          const matchingBusinessTypes = await BusinessType.find({
            name: tokenRegex
          }).distinct("_id");

          const searchOr = [
            { "basicInfo.title": tokenRegex },
            { "basicInfo.description": tokenRegex },
            { "location.addressLine1": tokenRegex },
            { "location.addressLine2": tokenRegex },
            { "location.city": tokenRegex },
            { "location.locality": tokenRegex },
            { "location.subArea": tokenRegex },
            { "location.state": tokenRegex },
            { "location.pincode": tokenRegex },
            { "basicInfo.propertyType": tokenRegex },
            { "basicInfo.approvalType": tokenRegex },
            { "basicInfo.usageType": tokenRegex },
            { "basicInfo.category": tokenRegex },
            { "legal.propertyStatus": tokenRegex },
            { "specifications.facing": tokenRegex },
            { "specifications.residential.furnishing": tokenRegex },
            { "specifications.commercial.suitableFor": tokenRegex },
            { "specifications.utilities.waterSupply": tokenRegex },
            { "amenities": tokenRegex }
          ];

          if (matchingBusinessTypes.length > 0) {
            searchOr.push({ businessType: { $in: matchingBusinessTypes } });
          }

          // Smart Numeric Search
          const numericValue = parseInt(token.replace(/\D/g, ''));
          if (!isNaN(numericValue) && token.match(/^\d+$/)) {
            searchOr.push({ "specifications.builtupArea": numericValue });
            searchOr.push({ "specifications.residential.bedrooms": numericValue });
            searchOr.push({ "specifications.residential.bathrooms": numericValue });
          }

          return { $or: searchOr };
        }));

        // 2. Create a condition for the FULL search string (as-is)
        const escapedFullSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const fullSearchRegex = { $regex: escapedFullSearch, $options: "i" };

        const matchingBusinessTypesFull = await BusinessType.find({
          name: fullSearchRegex
        }).distinct("_id");

        const fullSearchOr = [
          { "basicInfo.title": fullSearchRegex },
          { "basicInfo.description": fullSearchRegex },
          { "location.city": fullSearchRegex },
          { "location.locality": fullSearchRegex },
          { "location.subArea": fullSearchRegex },
          { "amenities": fullSearchRegex }
        ];

        if (matchingBusinessTypesFull.length > 0) {
          fullSearchOr.push({ businessType: { $in: matchingBusinessTypesFull } });
        }

        // Combine: Match the full phrase OR match all tokens
        queryConditions.push({
          $or: [
            { $or: fullSearchOr },
            { $and: tokenConditions }
          ]
        });
      }
    }

    // 6. Price Range
    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = maxPrice ? Number(maxPrice) : 999999999999; // Very high value if not provided

      queryConditions.push({
        $or: [
          // Sell logic (Price overlaps with user range)
          {
            $or: [
              { "pricing.sell.price": { $gte: min, $lte: max } },
              {
                $and: [
                  { "pricing.sell.minPrice": { $lte: max } },
                  { "pricing.sell.maxPrice": { $gte: min } }
                ]
              }
            ]
          },
          // Rent logic
          {
            $or: [
              { "pricing.rent.monthlyRent": { $gte: min, $lte: max } },
              {
                $and: [
                  { "pricing.rent.minRent": { $lte: max } },
                  { "pricing.rent.maxRent": { $gte: min } }
                ]
              }
            ]
          }
        ]
      });
    }

    // Build Final Query
    const query = queryConditions.length > 0 ? { $and: queryConditions } : {};

    let properties;
    let count;

    if (random === "true") {
      // Use aggregation for random sampling
      const pipeline = [
        { $match: query },
        { $sample: { size: Number(limit) } },
      ];

      // Since we need to populate seller_id, we can look it up or use a separate populate step
      // Aggregate returns plain objects, not Mongoose documents, but Property.populate works on them.
      const randomDocs = await Property.aggregate(pipeline);
      properties = await Property.populate(randomDocs, [
        {
          path: "seller",
          populate: { path: "role_id" },
        },
        { path: "businessType" },
        { path: "createdBy", select: "name role_id", populate: { path: "role_id" } },
      ]);

      // For random, total pages/count might be less relevant or just use total count matches
      count = await Property.countDocuments(query);
    } else {
      properties = await Property.find(query)
        .populate([
          {
            path: "seller",
            populate: { path: "role_id" },
          },
          { path: "businessType" },
          { 
            path: "createdBy", 
            select: "name role_id",
            populate: { path: "role_id" } 
          },
        ])
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      count = await Property.countDocuments(query);
    }

    res.json({
      properties,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProperties: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyProperty = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.isSuperAdmin || req.user.role_id?.role_name?.toLowerCase() === "admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can verify properties" });
    }

    const property = await Property.findById(req.params.id)
      .populate({
        path: "seller",
        populate: { path: "role_id" }
      })
      .populate({
        path: "createdBy",
        populate: { path: "role_id" }
      });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const newIsVerified = !property.isVerified;

    const creatorIsAdmin = property.createdBy && 
      (property.createdBy.isSuperAdmin || property.createdBy.role_id?.role_name?.toLowerCase() === "admin");
    const sellerIsAdmin = property.seller && 
      (property.seller.isSuperAdmin || property.seller.role_id?.role_name?.toLowerCase() === "admin");
    const isPostedByAdmin = creatorIsAdmin || sellerIsAdmin;

    // 🛡️ Restriction: Seller must be badge-verified before their properties can be approved/verified
    if (newIsVerified && !isPostedByAdmin && property.seller && !property.seller.badgeVerified) {
      return res.status(400).json({ 
        error: "First verify the seller's badge (Badge Verification) before approving their properties.",
        sellerId: property.seller._id
      });
    }

    let updateFields = { isVerified: newIsVerified };

    if (newIsVerified) {
      // Approve and switch to Active if verified
      if (property.status === "Pending") {
        updateFields.status = "Active";
        updateFields.approvedAt = property.approvedAt || new Date();
      } else if (property.status === "Edit Pending Approval") {
        if (property.pendingEdits) {
          // If applying edits, we MUST use save() to ensure all content is updated correctly and validated
          const category = property.pendingEdits.basicInfo?.category || property.basicInfo?.category;
          if (category === "Sell/Buy") {
            if (property.pricing) property.pricing.rent = undefined;
          } else if (category === "Rent") {
            if (property.pricing) property.pricing.sell = undefined;
          }
          Object.assign(property, property.pendingEdits);
          property.pendingEdits = null;
          property.status = "Active";
          property.approvedAt = property.approvedAt || new Date();
          property.isVerified = true;
          await property.save();
          return res.json({ message: "Property verified and edits applied", property });
        }
        updateFields.status = "Active";
        updateFields.approvedAt = property.approvedAt || new Date();
      }
    } else {
      // If unverified, take it down back to Pending
      if (property.status === "Active" || property.status === "Edit Pending Approval") {
        updateFields.status = "Pending";
      }
    }

    // Use findByIdAndUpdate for simple toggles to avoid unrelated validation errors on existing data
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    res.json({
      message: `Property ${updatedProperty.isVerified ? "verified" : "unverified"}`,
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Verify Property Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.rejectPropertyEdit = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.status === "Edit Pending Approval") {
      property.pendingEdits = null;
      property.status = "Active";
      await property.save();
      return res.json({ message: "Property edit rejected and reverted to live data", property });
    }

    res.status(400).json({ error: "Property is not pending an edit approval" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approvePropertyEdit = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate({
        path: "seller",
        populate: { path: "role_id" }
      })
      .populate({
        path: "createdBy",
        populate: { path: "role_id" }
      });
    if (!property) return res.status(404).json({ error: "Property not found" });

    const creatorIsAdmin = property.createdBy && 
      (property.createdBy.isSuperAdmin || property.createdBy.role_id?.role_name?.toLowerCase() === "admin");
    const sellerIsAdmin = property.seller && 
      (property.seller.isSuperAdmin || property.seller.role_id?.role_name?.toLowerCase() === "admin");
    const isPostedByAdmin = creatorIsAdmin || sellerIsAdmin;

    // 🛡️ Restriction: Seller must be badge-verified before their property edits can be approved
    if (!isPostedByAdmin && property.seller && !property.seller.badgeVerified) {
      return res.status(400).json({ 
        error: "First verify the seller's badge (Badge Verification) before approving their property edits.",
        sellerId: property.seller._id
      });
    }

    if (property.status === "Edit Pending Approval") {
      if (property.pendingEdits) {
        const category = property.pendingEdits.basicInfo?.category || property.basicInfo?.category;
        if (category === "Sell/Buy") {
          if (property.pricing) property.pricing.rent = undefined;
        } else if (category === "Rent") {
          if (property.pricing) property.pricing.sell = undefined;
        }
        Object.assign(property, property.pendingEdits);
        property.pendingEdits = null;
      }
      property.status = "Active";
      property.approvedAt = property.approvedAt || new Date();
      await property.save();
      return res.json({ message: "Property edit approved successfully", property });
    }

    res.status(400).json({ error: "Property is not pending an edit approval" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFilters = async (req, res) => {
  try {
    const types = await PropertyType.find({ status: "active" }).select(
      "name hasRooms hasFloor hasPlot hasCommercial",
    );
    const approvals = await ApprovalType.distinct("name", { status: "active" });
    // Fetch distinct cities, localities, and sub-areas
    const cities = await Property.distinct("location.city");
    const localities = await Property.distinct("location.locality");
    // const subAreas = await Property.distinct("location.subArea");

    // Combine cities and localities into locations
    const stateBlacklist = ["Puducherry", "Tamil Nadu", "Pondicherry", "Tamilnadu"];
    const locations = [...new Set([
      ...cities.filter(c => c && !stateBlacklist.includes(c)), 
      ...localities.filter(l => l && !stateBlacklist.includes(l))
    ])];

    const priceStats = await Property.aggregate([
      {
        $project: {
          effectiveMaxPrice: {
            $max: [
              { $ifNull: ["$pricing.sell.price", 0] },
              { $ifNull: ["$pricing.sell.maxPrice", 0] },
              { $ifNull: ["$pricing.rent.monthlyRent", 0] },
              { $ifNull: ["$pricing.rent.maxRent", 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          maxPrice: { $max: "$effectiveMaxPrice" }
        }
      }
    ]);

    const maxPrice = priceStats[0]?.maxPrice || 10000000;

    // Use a capped max for generating specific ranges to avoid huge arrays.
    // Absolute max is returned as maxPrice, but ranges are defined up to a reasonable cap.
    const rangeCap = 200000000; // 20 Cr
    const displayMax = Math.min(maxPrice, rangeCap);

    // Better: Helper to format Indian currency
    const formatPrice = (price) => {
      if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
      if (price >= 100000) return `${(price / 100000).toFixed(0)}L`;
      if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
      return `${price.toLocaleString()}`;
    };

    // Custom Logic for Smart Ranges
    const priceRanges = [];

    const generateRanges = (start, end, step) => {
      for (let current = start; current < end && current < rangeCap; current += step) {
        const next = Math.min(current + step, rangeCap);
        priceRanges.push({
          label: `${formatPrice(current)} - ${formatPrice(next)}`,
          min: current,
          max: next,
        });
        if (next >= rangeCap) break;
      }
    };

    if (displayMax <= 2000000) {
      // Max is below 20L, use 2L steps
      generateRanges(0, displayMax + 200000, 200000);
    } else if (displayMax <= 5000000) {
      // Max is below 50L.
      generateRanges(0, 2000000, 200000); // 0-20L in 2L steps
      generateRanges(2000000, displayMax + 500000, 500000); // 20L+ in 5L steps
    } else {
      // Max is high.
      generateRanges(0, 2000000, 500000); // 0-20L in 5L steps
      generateRanges(2000000, 5000000, 500000); // 20-50L in 5L steps
      generateRanges(5000000, Math.min(displayMax, 20000000), 2500000); // 50L-2Cr in 25L steps

      if (displayMax > 20000000) {
        generateRanges(20000000, displayMax, 5000000); // 2Cr - 20Cr in 50L steps
      }
    }

    // Add "Any" range if there are properties beyond rangeCap
    if (maxPrice > rangeCap) {
        priceRanges.push({
            label: `${formatPrice(rangeCap)}+`,
            min: rangeCap,
            max: 999999999999,
        });
    }

    // Filter out null/undefined/empty values
    const cleanLocations = locations.filter((l) => l);

    const categories = Property.schema.path("basicInfo.category").enumValues;
    res.json({
      types: types,
      categories: categories,
      approvals: approvals,
      locations: cleanLocations,
      cities: cities.filter((c) => c),
      localities: localities.filter((l) => l),
      subAreas: [], // Removed as requested
      priceRanges,
      maxPrice,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate([
      {
        path: "seller",
        populate: { path: "role_id" },
      },
      { path: "businessType" },
    ]);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let query = { slug: slug };

    // Support old links by allowing fallback to ID if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = { $or: [{ slug: slug }, { _id: slug }] };
    }

    const property = await Property.findOne(query).populate([
      {
        path: "seller",
        populate: { path: "role_id" },
      },
      { path: "businessType" },
    ]);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecommendedProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ error: "Property not found" });

    const limit = 6;
    let recommended = [];

    // 1. Try Nearby Search (10km) if coordinates exist
    if (property.location?.coordinates?.lat && property.location?.coordinates?.lng) {
      const lng = parseFloat(property.location.coordinates.lng);
      const lat = parseFloat(property.location.coordinates.lat);

      if (!isNaN(lng) && !isNaN(lat)) {
        recommended = await Property.find({
          _id: { $ne: id },
          status: "Active",
          isSold: { $ne: true },
          "location.locationPoint": {
            $near: {
              $geometry: { type: "Point", coordinates: [lng, lat] },
              $maxDistance: 10000 // 10km in meters
            }
          }
        }).limit(limit).populate([
          {
            path: "seller",
            populate: { path: "role_id" },
          },
          { path: "businessType" },
        ]);
      }
    }

    // 2. Fallback if not enough properties found or no coordinates
    if (recommended.length < 3) {
      const existingIds = recommended.map(p => p._id);
      existingIds.push(new mongoose.Types.ObjectId(id));

      const queryConditions = [
        { _id: { $nin: existingIds } },
        { status: "Active" },
        { isSold: { $ne: true } },
        { "basicInfo.category": property.basicInfo?.category }
      ];

      // Match by locality or city
      const locationOr = [];
      if (property.location?.locality) locationOr.push({ "location.locality": { $regex: property.location.locality, $options: "i" } });
      if (property.location?.city) locationOr.push({ "location.city": { $regex: property.location.city, $options: "i" } });

      if (locationOr.length > 0) {
        queryConditions.push({ $or: locationOr });
      }

      // Match by price range (+/- 30% for wider fallback)
      const price = property.pricing?.sell?.price || property.pricing?.rent?.monthlyRent;
      if (price) {
        const minPrice = price * 0.7;
        const maxPrice = price * 1.3;
        queryConditions.push({
          $or: [
            { "pricing.sell.price": { $gte: minPrice, $lte: maxPrice } },
            { "pricing.rent.monthlyRent": { $gte: minPrice, $lte: maxPrice } }
          ]
        });
      }

      const fallbackProperties = await Property.find({ $and: queryConditions })
        .limit(limit - recommended.length)
        .populate([
          {
            path: "seller",
            populate: { path: "role_id" },
          },
          { path: "businessType" },
        ]);

      recommended = [...recommended, ...fallbackProperties];
    }

    // 3. Last resort fallback: just similar properties in same category
    if (recommended.length < 3) {
      const existingIds = recommended.map(p => p._id);
      existingIds.push(new mongoose.Types.ObjectId(id));

      const lastResort = await Property.find({
        _id: { $nin: existingIds },
        status: "Active",
        isSold: { $ne: true },
        "basicInfo.category": property.basicInfo?.category
      })
        .limit(limit - recommended.length)
        .populate([
          {
            path: "seller",
            populate: { path: "role_id" },
          },
          { path: "businessType" },
        ]);

      recommended = [...recommended, ...lastResort];
    }

    res.json(recommended);
  } catch (error) {
    console.error("Recommended Properties Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get other properties by the same builder/promoter (for builder detail page recommendations)
exports.getBuilderOtherProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate("seller");
    if (!property) return res.status(404).json({ error: "Property not found" });

    const sellerId = property.seller?._id || property.seller;
    if (!sellerId) return res.json([]);

    // Find other properties by the same seller, excluding the current property
    const otherProperties = await Property.find({
      _id: { $ne: id },
      seller: sellerId,
      status: "Active",
      isSold: { $ne: true },
    })
      .limit(12)
      .populate([
        {
          path: "seller",
          populate: { path: "role_id" },
        },
        { path: "businessType" },
      ])
      .sort({ createdAt: -1 });

    res.json(otherProperties);
  } catch (error) {
    console.error("Builder Other Properties Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    console.log("Update Property Body:", req.body);

    const { id } = req.params;
    let property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Security Check: If user is seller, ensure they own the property
    if (req.user.role && req.user.role.name === "seller") {
      if (property.seller.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "You are not authorized to update this property" });
      }
    }

    // Helper to parse JSON fields
    const parseJSON = (data) => {
      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    };

    // Fast-path for "Mark as Sold" partial updates
    const isOnlyStatusUpdate = Object.keys(req.body).every(key => 
      ["isSold", "soldPrice"].includes(key)
    );
    
    if (isOnlyStatusUpdate && req.body.isSold !== undefined) {
      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        { 
          $set: { 
            isSold: req.body.isSold,
            soldPrice: req.body.soldPrice
          } 
        },
        { new: true, runValidators: false }
      ).populate([
        { path: "seller", populate: { path: "role_id" } },
        { path: "businessType" }
      ]);
      return res.json(updatedProperty);
    }

    // Handle Image Deletion
    const imagesToDelete = parseJSON(req.body.images_to_delete) || [];
    if (imagesToDelete.length > 0) {
      const invalidImages = (property.media?.images || []).filter((img) =>
        imagesToDelete.includes(img)
      );

      invalidImages.forEach((img) => {
        try {
          const filePath = path.join(__dirname, "..", img);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Failed to delete image file: ${img}`, err);
        }
      });
    }

    // Handle Floor Plan Deletion
    const floorPlansToDelete = parseJSON(req.body.floor_plans_to_delete) || [];
    if (floorPlansToDelete.length > 0) {
      const invalidFloorPlans = (property.media?.floorPlans || []).filter((fp) =>
        floorPlansToDelete.includes(fp)
      );

      invalidFloorPlans.forEach((fp) => {
        try {
          const filePath = path.join(__dirname, "..", fp);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Failed to delete floor plan file: ${fp}`, err);
        }
      });
    }

    const currentImages = property.media?.images || [];
    const remainingImages = currentImages.filter(img => !imagesToDelete.includes(img));
    
    const currentFloorPlans = property.media?.floorPlans || [];
    const remainingFloorPlans = currentFloorPlans.filter(fp => !floorPlansToDelete.includes(fp));

    // Handle New Files
    if (req.files) {
      if (req.files.images) {
        const newImages = req.files.images.map((file) => `/uploads/properties/${file.filename}`);
        remainingImages.push(...newImages);
      }
      if (req.files.floorPlans && req.files.floorPlans.length > 0) {
        const newFloorPlans = req.files.floorPlans.map((file) => `/uploads/properties/${file.filename}`);
        remainingFloorPlans.push(...newFloorPlans);
      }
    }

    // Parse nested structures
    const removeEmptyStrings = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      Object.keys(obj).forEach(key => {
        if (obj[key] === "") {
          delete obj[key];
        } else if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
          removeEmptyStrings(obj[key]);
        }
      });
      return obj;
    };

    const parsedBasicInfo = removeEmptyStrings(parseJSON(req.body.basicInfo));
    const parsedPricing = removeEmptyStrings(parseJSON(req.body.pricing));
    const parsedSpecs = removeEmptyStrings(parseJSON(req.body.specifications));
    const parsedLegal = removeEmptyStrings(parseJSON(req.body.legal));
    const parsedAmenities = typeof req.body.amenities === 'string' ? parseJSON(req.body.amenities) : req.body.amenities;
    const mediaMetadata = parseJSON(req.body.media) || {};

    const updates = { ...req.body };
    delete updates.images;
    delete updates.images_to_delete;
    delete updates.media; // We will construct this manually

    // Apply nested parsing
    if (updates.location) updates.location = removeEmptyStrings(parseJSON(updates.location));
    if (parsedBasicInfo) updates.basicInfo = { ...property.basicInfo, ...parsedBasicInfo };
    if (parsedPricing) {
      const category = parsedBasicInfo?.category || property.basicInfo?.category;
      if (category === "Sell/Buy") {
        updates.pricing = {
          sell: parsedPricing.sell || {}
        };
        updates.pricing.rent = undefined;
        if (property.pricing) {
          property.pricing.rent = undefined;
        }
      } else if (category === "Rent") {
        updates.pricing = {
          rent: parsedPricing.rent || {}
        };
        updates.pricing.sell = undefined;
        if (property.pricing) {
          property.pricing.sell = undefined;
        }
      } else {
        updates.pricing = { ...property.pricing, ...parsedPricing };
      }
    } else {
      const updatedCategory = parsedBasicInfo?.category;
      if (updatedCategory) {
        if (updatedCategory === "Sell/Buy") {
          if (property.pricing) property.pricing.rent = undefined;
          if (updates.pricing) updates.pricing.rent = undefined;
        } else if (updatedCategory === "Rent") {
          if (property.pricing) property.pricing.sell = undefined;
          if (updates.pricing) updates.pricing.sell = undefined;
        }
      }
    }
    if (parsedSpecs) updates.specifications = { ...property.specifications, ...parsedSpecs };
    if (parsedLegal) updates.legal = { ...property.legal, ...parsedLegal };
    if (parsedAmenities) updates.amenities = parsedAmenities;

    // Save Media
    updates.media = {
      ...(property.media || {}),
      images: remainingImages,
      featuredImage: remainingImages.length > 0 ? remainingImages[0] : (property.media?.featuredImage || ""),
      video: mediaMetadata.video || property.media?.video || "",
      floorPlans: remainingFloorPlans,
      floorPlan: remainingFloorPlans.length > 0 ? remainingFloorPlans[0] : (property.media?.floorPlan || "")
    };

    // Set top-level fields
    updates.video = updates.media.video;
    updates.floorPlan = updates.media.floorPlan;

    const isAdmin = req.user?.role_id?.role_name?.toLowerCase() === "admin" || req.user?.role?.name?.toLowerCase() === "admin";
    const isApproved = property.status === "Active" || property.status === "Edit Pending Approval";
    
    if (!isAdmin && isApproved) {
      property.pendingEdits = updates;
      property.status = "Edit Pending Approval";
      
      const io = req.app.get("socketio");
      if (io) {
        io.to("admin-room").emit("new-property-listed", {
          propertyId: property._id,
          title: property.basicInfo?.title || updates.basicInfo?.title,
          isSellerProperty: true,
          message: `Property edit pending approval: ${property.basicInfo?.title || updates.basicInfo?.title}`
        });
      }

      // Send email notification for edit pending approval
      try {
        const seller = await User.findById(property.seller);
        await sendPropertyNotification(property, seller, "edit_pending");
      } catch (emailError) {
        console.error("Email notification error (update):", emailError);
      }
    } else {
      Object.assign(property, updates);
    }

    await property.save();
    res.json(property);
  } catch (error) {
    console.error("Update Property Error:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });

    // Delete associated image files from filesystem
    if (property.images && property.images.length > 0) {
      property.images.forEach((img) => {
        try {
          const filePath = path.join(__dirname, "..", img.image_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Failed to delete image file: ${img.image_url}`, err);
        }
      });
    }

    res.json({ message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.incrementViewCount = async (req, res) => {
  try {
    const propertyId = req.params.id;
    // Get IP address (handle proxies)
    const ip =
      (req.headers["x-forwarded-for"] || req.connection.remoteAddress)
        ?.split(",")[0]
        .trim() || "unknown";

    // Check for recent view (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingView = await PropertyView.findOne({
      property_id: propertyId,
      ip_address: ip,
      viewed_at: { $gte: last24Hours },
    });

    if (existingView) {
      // Already viewed recently, don't increment
      const property = await Property.findById(propertyId).select("view_count");
      return res.json({ view_count: property?.view_count || 0 });
    }

    // Record new view record
    await PropertyView.create({
      property_id: propertyId,
      ip_address: ip,
    });

    // Increment view count by 50
    const property = await Property.findByIdAndUpdate(
      propertyId,
      { $inc: { view_count: 50 } },
      { new: true },
    );
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json({ view_count: property.view_count });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAmenities = async (req, res) => {
  try {
    const amenities = [
      "Lift",
      "Car Parking",
      "Bike Parking",
      "Visitor Parking",
      "Power Backup",
      "24x7 Water Supply",
      "CCTV Surveillance",
      "24x7 Security",
      "Intercom",
      "Fire Safety System",
      "Gated Community",
      "Gym",
      "Swimming Pool",
      "Club House",
      "Party Hall",
      "Jogging Track",
      "Garden",
      "Children Play Area",
      "WiFi",
      "Laundry Service",
      "Housekeeping",
      "Rainwater Harvesting",
      "Solar Power",
      "Balcony",
      "Modular Kitchen",
      "Food Included",
      "AC Room",
      "Conference Room",
      "Pantry",
      "Corner Plot",
      "Street Light",
    ];
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// getPropertyTypes removed

exports.getPropertyApprovals = async (req, res) => {
  try {
    const { role } = req.query;

    const query = { status: "active" };
    if (role === "seller") {
      query.visible_to_seller = true;
    }

    const approvals = await ApprovalType.find(query).select("name -_id");
    res.json(approvals.map((a) => a.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { range = "30d" } = req.query; // Default to last 30 days

    // Calculate Date Range
    let dateFrom = new Date();
    if (range === "7d") dateFrom.setDate(dateFrom.getDate() - 7);
    else if (range === "30d") dateFrom.setDate(dateFrom.getDate() - 30);
    else if (range === "90d") dateFrom.setDate(dateFrom.getDate() - 90);
    else if (range === "all") dateFrom = new Date(0); // All time

    // 1. Property Status Breakdown
    const properties = await Property.find({ seller: sellerId }).select(
      "status isVerified isSold soldPrice view_count basicInfo.title start_date",
    );

    const totalProperties = properties.length;
    const activeProperties = properties.filter(
      (p) => p.status === "available" && !p.isSold,
    ).length;
    const soldProperties = properties.filter((p) => p.isSold).length;
    const pendingProperties = properties.filter((p) => !p.isVerified).length;
    
    // Total Sold Amount
    const totalSoldAmount = properties
      .filter(p => p.isSold)
      .reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    // 2. Views Over Time (Aggegration from PropertyView)
    // We need to match views for properties owned by this seller
    const sellerPropertyIds = properties.map((p) => p._id);

    const viewsOverTime = await PropertyView.aggregate([
      {
        $match: {
          property_id: { $in: sellerPropertyIds },
          viewed_at: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewed_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Enquiries Over Time (Aggregation from Enquiry)
    const enquiriesOverTime = await Enquiry.aggregate([
      {
        $match: {
          seller_id: new mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Merge Data for Chart
    // Create a map of all dates in range to ensure continuous line
    const chartData = [];
    const today = new Date();
    let currentDate = new Date(dateFrom);

    // If "all" time, we might need a dynamic start, but for now let's use the actual data start or just fallback to 30d if no data
    if (range === "all") {
      // Find earliest date from data or default to 30 days ago
      // For chart cleanliness, let's limit "all" to last 6 months if no specific requirement
      dateFrom = new Date();
      dateFrom.setMonth(dateFrom.getMonth() - 6);
      currentDate = new Date(dateFrom);
    }

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const viewData = viewsOverTime.find((v) => v._id === dateStr);
      const enquiryData = enquiriesOverTime.find((e) => e._id === dateStr);

      chartData.push({
        date: dateStr,
        views: viewData ? viewData.count : 0,
        enquiries: enquiryData ? enquiryData.count : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 5. Recent Activity (Enquiries)
    const recentEnquiries = await Enquiry.find({
      seller_id: sellerId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("property_id", "basicInfo.title")
      .populate("user_id", "name phoneNumber");

    // 6. Top Properties
    const topProperties = properties
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5);

    // Total Views (Sum of all time or range? Usually dashboard header shows all time, chart shows range)
    // Let's keep total stats as ALL TIME for the cards, and chart as RANGE
    const totalViewsAllTime = properties.reduce(
      (sum, p) => sum + (p.view_count || 0),
      0,
    );
    const totalLeadsAllTime =
      (await Enquiry.countDocuments({
        seller_id: sellerId,
      })) +
      (await require("../models/WhatsappLead").countDocuments({
        seller: sellerId,
      }));

    // 7. Subscription & Balance Info
    const userBalance = await User.findById(sellerId)
      .select("carriedLeads activeSubscription")
      .populate({
        path: "activeSubscription",
        populate: { path: "plan", select: "name leadsLimit" }
      });

    res.json({
      summary: {
        totalProperties,
        activeProperties,
        soldProperties,
        pendingProperties,
        totalSoldAmount,
        totalViews: totalViewsAllTime,
        totalLeads: totalLeadsAllTime,
        carriedLeads: userBalance?.carriedLeads || 0,
        activeSubscription: userBalance?.activeSubscription || null,
      },
      chartData,
      recentEnquiries,
      topProperties,
      allPropertyStats: properties.map(p => ({
        _id: p._id,
        title: p.basicInfo?.title,
        status: p.status,
        isVerified: p.isVerified,
        isSold: p.isSold,
        viewCount: p.view_count || 0,
        createdAt: p.start_date
      }))
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const Enquiry = require("../models/Enquiry");
    const Role = require("../models/Role"); // Ensure Role model is required
    const { range = "30d" } = req.query;

    // Calculate Date Range
    let dateFrom = new Date();
    if (range === "7d") dateFrom.setDate(dateFrom.getDate() - 7);
    else if (range === "30d") dateFrom.setDate(dateFrom.getDate() - 30);
    else if (range === "90d") dateFrom.setDate(dateFrom.getDate() - 90);
    else if (range === "all") dateFrom = new Date(0);

    // 1. User Stats (Total, Sellers, Buyers)
    const totalUsers = await User.countDocuments();

    // Find Role IDs
    const sellerRole = await Role.findOne({ role_name: { $regex: /seller/i } });
    const userRole = await Role.findOne({ role_name: { $regex: /user/i } }); // Or buyer
    const adminRole = await Role.findOne({ role_name: { $regex: /admin/i } });

    const totalSellers = sellerRole
      ? await User.countDocuments({ role_id: sellerRole._id })
      : 0;
    const totalBuyers = userRole
      ? await User.countDocuments({ role_id: userRole._id })
      : 0; // Assuming 'user' role is buyer

    // 2. Property Stats
    const totalProperties = await Property.countDocuments();
    
    // Admin Specific Properties (those posted by currently logged in admin)
    const adminPropertiesCount = await Property.countDocuments({
      seller: req.user._id
    });
    
    const soldAdminPropertiesCount = await Property.countDocuments({ 
      isSold: true,
      seller: req.user._id
    });

    // Seller Specific Properties (those NOT posted by currently logged in admin)
    const sellerPropertiesCount = await Property.countDocuments({
      seller: { $ne: req.user._id }
    });
    
    // Total Sold Amount (Admin's properties)
    const soldStats = await Property.aggregate([
      { 
        $match: { 
          isSold: true,
          seller: new mongoose.Types.ObjectId(req.user._id)
        } 
      },
      { $group: { _id: null, totalAmount: { $sum: "$soldPrice" } } }
    ]);
    const totalSoldAmount = soldStats[0]?.totalAmount || 0;

    const pendingApprovals = await Property.countDocuments({
      isVerified: false,
      seller: { $ne: req.user._id }
    });

    // 3. Views Aggregation (Filter by Admin Properties Only)
    const adminPropertyIds = await Property.find({ seller: req.user._id }).distinct("_id");

    const viewsOverTime = await PropertyView.aggregate([
      {
        $match: {
          property_id: { $in: adminPropertyIds },
          viewed_at: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewed_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalViewsAllTime = await PropertyView.countDocuments({
      property_id: { $in: adminPropertyIds }
    });

    // 4. Marketing Leads & Enquiries
    const marketingLeadsCount = await require("../models/MarketingRequest").countDocuments();
    
    const marketingRequestsOverTime = await require("../models/MarketingRequest").aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const enquiriesOverTime = await Enquiry.aggregate([
      {
        $match: {
          seller_id: req.user._id,
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalEnquiries =
      (await Enquiry.countDocuments({ seller_id: req.user._id })) +
      (await require("../models/WhatsappLead").countDocuments({
        seller: req.user._id,
      }));

    // 5. Merge Chart Data
    const chartData = [];
    const today = new Date();
    let currentDate = new Date(dateFrom);

    if (range === "all") {
      dateFrom = new Date();
      dateFrom.setMonth(dateFrom.getMonth() - 6);
      currentDate = new Date(dateFrom);
    }

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const viewData = viewsOverTime.find((v) => v._id === dateStr);
      const enquiryData = enquiriesOverTime.find((e) => e._id === dateStr);
      const mktData = marketingRequestsOverTime.find((m) => m._id === dateStr);

      chartData.push({
        date: dateStr,
        views: viewData ? viewData.count : 0,
        enquiries: enquiryData ? enquiryData.count : 0,
        marketingLeads: mktData ? mktData.count : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 6. Recent Activity
    // New Users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name role_id createdAt")
      .populate("role_id", "role_name");

    // Recent Properties (Increased limit for dashboard selector)
    const recentProperties = await Property.find()
      .populate("seller", "name")
      .limit(50)
      .select("basicInfo.title seller isVerified createdAt status")
      .sort({ createdAt: -1 });

    // Recent Enquiries
    const recentEnquiries = await Enquiry.find({ seller_id: req.user._id })
      .populate("property_id", "basicInfo.title")
      .populate("user_id", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    // Pending Seller Properties (Awaiting Approval)
    const pendingProperties = await Property.find({
      status: "Pending",
      seller: { $ne: req.user._id }
    })
      .populate("seller", "name phone profile_image")
      .populate("businessType", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      summary: {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalProperties,
        adminPropertiesCount,
        soldAdminPropertiesCount,
        sellerPropertiesCount,
        marketingLeadsCount,
        pendingApprovals,
        totalSoldAmount,
        totalViews: totalViewsAllTime,
        totalEnquiries,
      },
      chartData,
      pendingProperties,
      recentUsers: recentUsers.map((u) => ({
        _id: u._id,
        name: u.name,
        role: u.role_id?.role_name || "Unknown",
        joinedAt: u.createdAt,
      })),
      recentProperties: recentProperties.map((p) => ({
        _id: p._id,
        title: p.basicInfo?.title,
        seller: p.seller?.name || "Unknown",
        status: p.isVerified ? p.status : "Pending Approval",
        createdAt: p.createdAt,
      })),
      recentEnquiries: recentEnquiries.map((e) => ({
        _id: e._id,
        user: e.user_id?.name || "Guest",
        property: e.property_id?.title || "Unknown Property",
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSellerOverviewStats = async (req, res) => {
  try {
    const Role = require("../models/Role");
    const sellerRole = await Role.findOne({ role_name: { $regex: /seller/i } });
    
    if (!sellerRole) {
      return res.status(404).json({ error: "Seller role not found" });
    }

    // 1. First, find all users with the "Seller" role to ensure we only count them
    const User = require("../models/User");
    const sellers = await User.find({ role_id: sellerRole._id }).distinct("_id");

    // Aggregate property counts per seller (strictly only for those with Seller role)
    const sellerStats = await Property.aggregate([
      {
        $match: {
          seller: { $in: sellers }
        }
      },
      {
        $group: {
          _id: "$seller",
          propertyCount: { $sum: 1 },
          totalViews: { $sum: "$view_count" },
          soldCount: { $sum: { $cond: [{ $eq: ["$isSold", true] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerDetails"
        }
      },
      { $unwind: "$sellerDetails" },
      {
        $project: {
          _id: 1,
          propertyCount: 1,
          totalViews: 1,
          soldCount: 1,
          name: "$sellerDetails.name",
        phone: "$sellerDetails.phone",
        isVerified: "$sellerDetails.is_verified"
      }
    },
      { $sort: { propertyCount: -1 } }
    ]);

    // Overall property trends for sellers (Views)
    const topPerformer = sellerStats.length > 0 ? sellerStats[0] : null;

    res.json({
      sellerStats,
      topPerformer,
      totalSellerProperties: sellerStats.reduce((sum, s) => sum + s.propertyCount, 0),
      totalSellerViews: sellerStats.reduce((sum, s) => sum + s.totalViews, 0)
    });
  } catch (error) {
    console.error("Error fetching seller overview stats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { view_count } = req.body;

    if (view_count === undefined || view_count < 0) {
      return res.status(400).json({ error: "Invalid view count" });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { view_count },
      { new: true },
    );

    if (!property) return res.status(404).json({ error: "Property not found" });

    res.json({
      message: "View count updated successfully",
      view_count: property.view_count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 1) {
      const suggestions = new Set();
      const formattedSuggestions = [];

      // 1. Get unique localities from properties (limit to 10)
      const localities = await Property.distinct("location.locality", { "location.locality": { $ne: null } });
      localities.slice(0, 10).forEach(loc => {
        const key = `locality:${loc}`;
        if (!suggestions.has(key)) {
          suggestions.add(key);
          formattedSuggestions.push({
            mainText: loc,
            subText: "Area in Pondy",
            type: "Locality",
            value: loc
          });
        }
      });

      return res.json(formattedSuggestions);
    }

    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // Create a regex that matches if ALL words are present somewhere in the target string
    const regex = new RegExp(escapedWords.map(w => `(?=.*${w})`).join(''), "i");

    const suggestions = new Set();
    const formattedSuggestions = [];

    // 1. Search for Property Titles (High Priority)
    const propertyResults = await Property.find({
      "basicInfo.title": regex
    })
      .select("basicInfo.title location.city location.locality slug")
      .limit(5);

    propertyResults.forEach(item => {
      const key = `property:${item.basicInfo.title}`;
      if (!suggestions.has(key)) {
        suggestions.add(key);
        formattedSuggestions.push({
          mainText: item.basicInfo.title,
          subText: `${item.location.locality}, ${item.location.city}`,
          type: "Property",
          value: item.slug || item._id
        });
      }
    });

    // 2. Search for Localities/Cities/States in Properties
    // We match if the combined location fields contain all keywords
    const locationResults = await Property.aggregate([
      {
        $addFields: {
          combinedLocation: {
            $concat: [
              { $ifNull: ["$location.locality", ""] }, " ",
              { $ifNull: ["$location.city", ""] }, " ",
              { $ifNull: ["$location.state", ""] }, " ",
              { $ifNull: ["$location.subArea", ""] }
            ]
          }
        }
      },
      {
        $match: {
          combinedLocation: regex
        }
      },
      {
        $project: {
          locality: "$location.locality",
          city: "$location.city",
          state: "$location.state",
          subArea: "$location.subArea"
        }
      },
      { $limit: 100 }
    ]);

    const stateBlacklist = ["Puducherry", "Tamil Nadu", "Pondicherry", "Tamilnadu"];

    locationResults.forEach(item => {
      // Check Locality
      if (item.locality && item.locality.match(regex) && !stateBlacklist.includes(item.locality)) {
        const key = `locality:${item.locality}:${item.city}`;
        if (!suggestions.has(key)) {
          suggestions.add(key);
          formattedSuggestions.push({
            mainText: item.locality,
            subText: item.city,
            type: "Locality",
            value: item.locality
          });
        }
      }
      // Check City
      if (item.city && item.city.match(regex) && !stateBlacklist.includes(item.city)) {
        const key = `city:${item.city}`;
        if (!suggestions.has(key)) {
          suggestions.add(key);
          formattedSuggestions.push({
            mainText: item.city,
            type: "City",
            value: item.city
          });
        }
      }
      // SubArea is removed as requested
    });

    res.json(formattedSuggestions.slice(0, 10));
  } catch (error) {
    console.error("Suggestion API Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyViewStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { range = "30d" } = req.query;

    let dateFrom = new Date();
    if (range === "7d") dateFrom.setDate(dateFrom.getDate() - 7);
    else if (range === "30d") dateFrom.setDate(dateFrom.getDate() - 30);
    else if (range === "90d") dateFrom.setDate(dateFrom.getDate() - 90);
    else if (range === "all") dateFrom = new Date(0);

    const viewsOverTime = await PropertyView.aggregate([
      {
        $match: {
          property_id: new mongoose.Types.ObjectId(id),
          viewed_at: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewed_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const property = await Property.findById(id).select("basicInfo.title view_count");

    // Merge with date range to ensure continuous line
    const chartData = [];
    const today = new Date();
    let currentDate = new Date(dateFrom.getTime() < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() ? dateFrom : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const viewData = viewsOverTime.find((v) => v._id === dateStr);
      chartData.push({
        date: dateStr,
        views: viewData ? viewData.count : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      property,
      chartData
    });
  } catch (error) {
    console.error("Error fetching property view stats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingSellerPropertiesCount = async (req, res) => {
  try {
    // Count properties with "Pending" status that belong to users with "seller" role
    const Role = require("../models/Role");
    const sellerRole = await Role.findOne({ role_name: "seller" });
    
    if (!sellerRole) {
      return res.json({ success: true, count: 0 });
    }

    const count = await Property.countDocuments({ 
      status: "Pending",
      seller: { $in: await User.find({ role_id: sellerRole._id }).distinct("_id") }
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
