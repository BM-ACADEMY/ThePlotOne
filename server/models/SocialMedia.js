// models/SocialMedia.js
const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  icon: { type: String },
  url: { type: String, required: true },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
