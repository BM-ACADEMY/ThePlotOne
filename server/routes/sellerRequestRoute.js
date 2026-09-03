const express = require("express");
const router = express.Router();
const sellerRequestController = require("../controllers/sellerRequestController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create-request", protect, sellerRequestController.createRequest);
router.get("/all-requests", protect, sellerRequestController.getAllRequests); // Should add admin middleware here later if needed
router.put(
  "/update-status/:id",
  protect,
  sellerRequestController.updateRequestStatus,
);

module.exports = router;
