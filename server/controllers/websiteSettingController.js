// controllers/websiteSettingController.js
const WebsiteSetting = require('../models/WebsiteSetting');

exports.createWebsiteSetting = async (req, res) => {
  try {
    const websiteSetting = new WebsiteSetting(req.body);
    await websiteSetting.save();
    res.status(201).json(websiteSetting);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWebsiteSettings = async (req, res) => {
  try {
    const websiteSettings = await WebsiteSetting.find();
    res.json(websiteSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWebsiteSettingById = async (req, res) => {
  try {
    const websiteSetting = await WebsiteSetting.findById(req.params.id);
    if (!websiteSetting) return res.status(404).json({ error: 'WebsiteSetting not found' });
    res.json(websiteSetting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWebsiteSetting = async (req, res) => {
  try {
    const websiteSetting = await WebsiteSetting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!websiteSetting) return res.status(404).json({ error: 'WebsiteSetting not found' });
    res.json(websiteSetting);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteWebsiteSetting = async (req, res) => {
  try {
    const websiteSetting = await WebsiteSetting.findByIdAndDelete(req.params.id);
    if (!websiteSetting) return res.status(404).json({ error: 'WebsiteSetting not found' });
    res.json({ message: 'WebsiteSetting deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
