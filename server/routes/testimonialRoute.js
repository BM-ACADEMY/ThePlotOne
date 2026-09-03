const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/testimonialController");

router.post("/", testimonialController.createTestimonial);
router.get("/", testimonialController.getAllTestimonials);
router.get("/approved", testimonialController.getApprovedTestimonials);
router.get("/user/:userId", testimonialController.getUserTestimonials);
router.put("/:id", testimonialController.updateTestimonial);
router.put("/:id/status", testimonialController.updateTestimonialStatus);
router.delete("/:id", testimonialController.deleteTestimonial);

module.exports = router;
