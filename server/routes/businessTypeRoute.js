const express = require("express");
const router = express.Router();
const businessTypeController = require("../controllers/businessTypeController");

router.post("/", businessTypeController.createBusinessType);
router.get("/", businessTypeController.getBusinessTypes);
router.get("/:id", businessTypeController.getBusinessTypeById);
router.put("/:id", businessTypeController.updateBusinessType);
router.delete("/:id", businessTypeController.deleteBusinessType);

module.exports = router;
