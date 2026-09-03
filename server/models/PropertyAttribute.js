// models/PropertyAttribute.js
const mongoose = require('mongoose');

const propertyAttributeSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  attribute_key: { type: String, required: true },
  attribute_value: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PropertyAttribute', propertyAttributeSchema);
