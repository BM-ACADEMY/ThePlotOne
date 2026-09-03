// models/WebsiteSetting.js
const mongoose = require('mongoose');

const websiteSettingSchema = new mongoose.Schema({
  site_name: { type: String, required: true },
  contact_email: { type: String },
  contact_phone: { type: String },
  address: { type: String },
  footer_text: { type: String },
  sellerPropertyLimit: { type: Number, default: 5 },
  defaultPlanName: { type: String, default: "BASIC" },
  leadSharingTimerEnabled: { type: Boolean, default: false },
  leadSharingPlans: { type: [String], default: ["Pro", "Premium", "Standard"] },
  leadSharingInterval: { type: Number, default: 10 }, // numeric value
  leadSharingIntervalUnit: { type: String, enum: ["minutes", "hours"], default: "minutes" }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteSetting', websiteSettingSchema);
