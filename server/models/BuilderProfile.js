// models/BuilderProfile.js
const mongoose = require("mongoose");

const builderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    phonePrimary: { type: String },
    email: { type: String },
    companyName: { type: String },
    companyLogo: { type: String },
    gstNumber: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional — skip if empty
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: "Invalid GSTIN format. Expected: 22AAAAA0000A1Z5",
      },
    },
    officeAddress: { type: String },
    experienceYears: { type: Number },
    aboutCompany: { type: String },
    reraNumber: { type: String },
    nationality: { type: String },
    languagesKnown: [{ type: String }],
    socialLinks: {
      website: { type: String },
      instagram: { type: String },
      facebook: { type: String },
      linkedin: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuilderProfile", builderProfileSchema);
