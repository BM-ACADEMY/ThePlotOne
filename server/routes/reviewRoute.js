// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// Create a new review
router.post("/create-review", reviewController.createReview);
// Get all reviews
router.get("/fetch-all-review", reviewController.getReviews);
// Get a review by ID
router.get("/fetch-review-by-id/:id", reviewController.getReviewById);
// Update a review
router.put("/update-review-by-id/:id", reviewController.updateReview);
// Delete a review
router.delete("/delete-review-by-id/:id", reviewController.deleteReview);

// Get reviews by user
router.get("/user/:userId", reviewController.getReviewsByUser);
// Get approved reviews only
router.get("/approved", reviewController.getApprovedReviews);
// Update review status (admin)
router.put("/status/:id", reviewController.updateReviewStatus);

module.exports = router;
