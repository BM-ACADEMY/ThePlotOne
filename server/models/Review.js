// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  rating: { type: Number, required: true },
  review_text: { type: String },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
