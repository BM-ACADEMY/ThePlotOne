const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

const { protect } = require("../middleware/authMiddleware");

// Public routes for submitting forms
router.post("/contact", formController.createContact);
router.post("/request-call", formController.createRequestCall);

// Admin routes for fetching data
router.get("/contact", protect, formController.getContacts);
router.get("/request-call", protect, formController.getRequestCalls);
router.delete("/contact/:id", protect, formController.deleteContact);
router.delete("/request-call/:id", protect, formController.deleteRequestCall);
router.patch("/contact/:id/status", protect, formController.updateContactStatus);
router.patch("/request-call/:id/status", protect, formController.updateRequestCallStatus);

module.exports = router;
