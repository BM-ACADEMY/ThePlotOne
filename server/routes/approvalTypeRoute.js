const express = require("express");
const router = express.Router();
const approvalTypeController = require("../controllers/approvalTypeController");
const { protect, admin } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(approvalTypeController.getApprovalTypes)
  .post(protect, admin, approvalTypeController.createApprovalType);

router
  .route("/:id")
  .get(approvalTypeController.getApprovalTypeById)
  .put(protect, admin, approvalTypeController.updateApprovalType)
  .delete(protect, admin, approvalTypeController.deleteApprovalType);

module.exports = router;
