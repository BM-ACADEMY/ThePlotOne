// routes/whatsappLeadRoutes.js
const express = require('express');
const router = express.Router();
const whatsappLeadController = require('../controllers/whatsappLeadController');

// Create a new whatsapp lead
router.post('/create-whatsapp-lead', whatsappLeadController.createWhatsappLead);
// Get all whatsapp leads
router.get('/fetch-all-whatsapp-lead', whatsappLeadController.getWhatsappLeads);
// Get a whatsapp lead by ID
router.get('/fetch-whatsapp-lead-by-id/:id', whatsappLeadController.getWhatsappLeadById);
// Update a whatsapp lead
router.put('/update-whatsapp-lead-by-id/:id', whatsappLeadController.updateWhatsappLead);
// Delete a whatsapp lead
router.delete('/delete-whatsapp-lead-by-id/:id', whatsappLeadController.deleteWhatsappLead);

module.exports = router;
