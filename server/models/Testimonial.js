
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true }, // Capture name at time of review or fetch from user
    role: { type: String, default: 'User' }, // e.g., "Home Buyer", "Seller"
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
