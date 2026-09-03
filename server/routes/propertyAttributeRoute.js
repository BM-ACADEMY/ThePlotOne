// routes/propertyAttributeRoutes.js
const express = require('express');
const router = express.Router();
const propertyAttributeController = require('../controllers/propertyAttributeController');

// Create a new property attribute
router.post('/create-property-attribute', propertyAttributeController.createPropertyAttribute);
// Get all property attributes
router.get('/fetch-all-property-attribute', propertyAttributeController.getPropertyAttributes);
// Get a property attribute by ID
router.get('/fetch-property-attribute-by-id/:id', propertyAttributeController.getPropertyAttributeById);
// Update a property attribute
router.put('/update-property-attribute-by-id/:id', propertyAttributeController.updatePropertyAttribute);
// Delete a property attribute
router.delete('/delete-property-attribute-by-id/:id', propertyAttributeController.deletePropertyAttribute);

module.exports = router;
