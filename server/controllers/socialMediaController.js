// controllers/socialMediaController.js
const SocialMedia = require('../models/SocialMedia');

exports.createSocialMedia = async (req, res) => {
  try {
    const socialMedia = new SocialMedia(req.body);
    await socialMedia.save();
    res.status(201).json(socialMedia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSocialMedias = async (req, res) => {
  try {
    const socialMedias = await SocialMedia.find();
    res.json(socialMedias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSocialMediaById = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.findById(req.params.id);
    if (!socialMedia) return res.status(404).json({ error: 'SocialMedia not found' });
    res.json(socialMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSocialMedia = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!socialMedia) return res.status(404).json({ error: 'SocialMedia not found' });
    res.json(socialMedia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSocialMedia = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.findByIdAndDelete(req.params.id);
    if (!socialMedia) return res.status(404).json({ error: 'SocialMedia not found' });
    res.json({ message: 'SocialMedia deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
