// controllers/propertyAttributeController.js
const PropertyAttribute = require('../models/PropertyAttribute');

exports.createPropertyAttribute = async (req, res) => {
  try {
    const propertyAttribute = new PropertyAttribute(req.body);
    await propertyAttribute.save();
    res.status(201).json(propertyAttribute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPropertyAttributes = async (req, res) => {
  try {
    const propertyAttributes = await PropertyAttribute.find().populate('property_id');
    res.json(propertyAttributes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyAttributeById = async (req, res) => {
  try {
    const propertyAttribute = await PropertyAttribute.findById(req.params.id).populate('property_id');
    if (!propertyAttribute) return res.status(404).json({ error: 'PropertyAttribute not found' });
    res.json(propertyAttribute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePropertyAttribute = async (req, res) => {
  try {
    const propertyAttribute = await PropertyAttribute.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!propertyAttribute) return res.status(404).json({ error: 'PropertyAttribute not found' });
    res.json(propertyAttribute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePropertyAttribute = async (req, res) => {
  try {
    const propertyAttribute = await PropertyAttribute.findByIdAndDelete(req.params.id);
    if (!propertyAttribute) return res.status(404).json({ error: 'PropertyAttribute not found' });
    res.json({ message: 'PropertyAttribute deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
