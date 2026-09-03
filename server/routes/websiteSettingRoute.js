// routes/websiteSettingRoutes.js
const express = require('express');
const router = express.Router();
const websiteSettingController = require('../controllers/websiteSettingController');

// Create a new website setting
router.post('/', websiteSettingController.createWebsiteSetting);
// Get all website settings
router.get('/', websiteSettingController.getWebsiteSettings);
// Get a website setting by ID
router.get('/:id', websiteSettingController.getWebsiteSettingById);
// Update a website setting
router.patch('/:id', websiteSettingController.updateWebsiteSetting);
router.put('/:id', websiteSettingController.updateWebsiteSetting);
// Delete a website setting
router.delete('/:id', websiteSettingController.deleteWebsiteSetting);

module.exports = router;
