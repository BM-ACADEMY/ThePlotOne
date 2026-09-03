// routes/socialMediaRoutes.js
const express = require('express');
const router = express.Router();
const socialMediaController = require('../controllers/socialMediaController');

// Create a new social media
router.post('/create-social-media', socialMediaController.createSocialMedia);
// Get all social media
router.get('/fetch-all-social-media', socialMediaController.getSocialMedias);
// Get a social media by ID
router.get('/fetch-social-media-by-id/:id', socialMediaController.getSocialMediaById);
// Update a social media
router.put('/update-social-media-by-id/:id', socialMediaController.updateSocialMedia);
// Delete a social media
router.delete('/delete-social-media-by-id/:id', socialMediaController.deleteSocialMedia);

module.exports = router;
