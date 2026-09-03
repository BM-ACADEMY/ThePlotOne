// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    name: { type: String, required: false },
    phone: { type: String, unique: true, sparse: true }, // unique for phone-base users
    status: { type: String, default: "active" },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    pendingPhone: { type: String },
    badgeVerified: { type: Boolean, default: false },
    badgeRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    profile_image: { type: String }, // URL or path to image
    rating: { type: Number, default: 4.5 },
    testimonialCount: { type: Number, default: 0 },
    availabilityStatus: { type: String, default: "Available" },
    nextAvailableSlot: { type: Date },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    customId: { type: String, unique: true, sparse: true },
    userId: { type: String, unique: true, sparse: true },
    referralCode: { type: String, unique: true, sparse: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    activeSubscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    businessType: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessType" },
    builderProfile: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProfile" },
    permissions: [{ type: String }], // Sidebar keys/section names
    isSuperAdmin: { type: Boolean, default: false },
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, unique: true, sparse: true },
    pushSubscriptions: [
      {
        endpoint: { type: String },
        expirationTime: { type: Number },
        keys: {
          p256dh: { type: String },
          auth: { type: String },
        },
      },
    ],
    carriedLeads: {
      type: Number,
      default: 0
    },
  },

  { timestamps: true },
);

// Pre-save middleware for generating IDs
userSchema.pre("save", async function () {
  // Generate userId if not exists
  if (!this.userId) {
    this.userId = "USR" + Math.floor(100000 + Math.random() * 900000);
  }

  // Generate referralCode if not exists
  if (!this.referralCode) {
    this.referralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  }

  // Generate slug if not exists or name changed
  if (this.name && (this.isModified("name") || !this.slug)) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = baseSlug;
    let count = 1;

    // Check for uniqueness
    while (true) {
      const existing = await this.constructor.findOne({
        slug,
        _id: { $ne: this._id },
      });
      if (!existing) break;
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
});

module.exports = mongoose.model("User", userSchema);
