const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    // =====================================================
    // 1️⃣ OWNER INFO
    // =====================================================
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // 2️⃣ BASIC INFO
    // =====================================================
    basicInfo: {
      title: { type: String, required: true },
      description: String,

      category: {
        type: String,
        enum: ["Rent", "Sell/Buy"],
        required: true
      },

      usageType: {
        type: String,
        enum: ["Residential", "Commercial"],
        required: true
      },

      propertyType: {
        type: String,
        required: true
      },

      approvalType: [String]
    },
    

    // =====================================================
    // 2.5️⃣ BUSINESS
    // =====================================================
    businessType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessType"
    },

    // =====================================================
    // 3️⃣ LOCATION
    // =====================================================
    location: {
      addressLine1: String,
      addressLine2: String,
      country: String,
      state: String,
      city: String,
      locality: String,
      subArea: String,
      pincode: {
        type: String,
        validate: {
          validator: function (v) {
            // Allow empty or null if not required
            if (!v || v.trim() === "") return true;
            return /^\d{6}$/.test(v);
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode!`,
        },
      },
      locationText: String,

      coordinates: {
        lat: Number,
        lng: Number
      },
      locationPoint: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
      }
    },

    // =====================================================
    // 4️⃣ PRICING
    // =====================================================
    pricing: {
      sell: {
        price: Number,
        minPrice: Number,
        maxPrice: Number,
        pricePerSqft: Number
      },

      rent: {
        monthlyRent: Number,
        minRent: Number,
        maxRent: Number,
        securityDeposit: Number,
        maintenance: Number,
        availableFrom: Date,

        tenantPreference: {
          bachelor: Boolean,
          family: Boolean,
          pets: Boolean
        }
      }
    },

    // =====================================================
    // 5️⃣ SPECIFICATIONS
    // =====================================================
    specifications: {
      facing: {
        type: String,
        enum: [
          "North",
          "East",
          "West",
          "South",
          "North-East",
          "North-West",
          "South-East",
          "South-West",
        ],
      },

      area: {
        totalArea: Number,
        minArea: Number,
        maxArea: Number,
        builtupArea: Number,
        superBuiltupArea: Number,
        carpetArea: Number
      },

      floor: {
        totalFloor: Number,
        propertyOnFloor: String
      },

      residential: {
        bedrooms: Number,
        bathrooms: Number,
        balconies: Number,
        hall: Number,
        kitchens: Number,

        furnishing: {
          type: String,
          enum: ["Fully Furnished", "Semi Furnished", "Unfurnished"]
        },
      },

      plot: {
        plotLength: Number,
        plotWidth: Number,
        cornerPlot: Boolean,
        gatedCommunity: Boolean,
        roadWidth: Number
      },

      commercial: {
        cabins: Number,
        meetingRooms: Number,
        washrooms: Number,
        pantry: Boolean,
        receptionArea: Boolean,
        workstations: Number,

        suitableFor: String
      },

      utilities: {
        waterSupply: {
          type: String,
          enum: ["Corporation", "Borewell", "Both"]
        },
        powerBackup: Boolean
      }
    },

    // =====================================================
    // 6️⃣ AMENITIES
    // =====================================================
    amenities: [String],
    floorPlan: { type: String, default: "" },

    // =====================================================
    // 7️⃣ MEDIA
    // =====================================================
    media: {
      featuredImage: String,
      images: [String],
      floorPlan: String,
      floorPlans: [String]
    },

    // =====================================================
    // 8️⃣ LEGAL
    // =====================================================
    legal: {
      propertyStatus: {
        type: String,
        enum: ["Ready to Move", "Under Construction"]
      },
      ageOfProperty: String, // e.g., "0-1 years", "1-5 years", etc.
      expectedCompletionYear: Number // e.g., 2026
    },

    // =====================================================
    // 9️⃣ SYSTEM / TRACKING
    // =====================================================
    status: {
      type: String,
      enum: ["Active", "Sold", "Rented", "Pending", "Edit Pending Approval"],
      default: "Pending"
    },

    pendingEdits: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    view_count: {
      type: Number,
      default: 0
    },

    slug: {
      type: String,
      unique: true,
      index: true
    },

    isSold: {
      type: Boolean,
      default: false
    },

    soldPrice: Number,
    approvedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Index for geo-spatial queries
propertySchema.index({ "location.locationPoint": "2dsphere" });

// Additional indexes for performance
propertySchema.index({ status: 1 });
propertySchema.index({ "basicInfo.category": 1 });
propertySchema.index({ "basicInfo.usageType": 1 });
propertySchema.index({ "basicInfo.propertyType": 1 });
propertySchema.index({ seller: 1 });
propertySchema.index({ createdAt: -1 }); // Index for latest properties

// Helper to generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Pre-save hook to keep locationPoint and slug in sync
propertySchema.pre("save", async function () {
  if (this.location && this.location.coordinates &&
    this.location.coordinates.lat && this.location.coordinates.lng) {
    this.location.locationPoint = {
      type: "Point",
      coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
    };
  }

  // Generate slug if it doesn't exist or title changed
  if (this.isModified("basicInfo.title") || !this.slug) {
    let baseSlug = generateSlug(this.basicInfo.title);
    let slug = baseSlug;
    let count = 1;

    // Check for uniqueness
    while (true) {
      const existing = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
});

module.exports = mongoose.model("Property", propertySchema);
