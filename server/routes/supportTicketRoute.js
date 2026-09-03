const express = require("express");
const router = express.Router();
const supportTicketController = require("../controllers/supportTicketController");
const { protect, admin } = require("../middleware/authMiddleware");

// All support routes require authentication
router.use(protect);

// Seller routes
router.post("/", supportTicketController.createTicket);
router.get("/my-tickets", supportTicketController.getSellerTickets);

// Admin routes
router.get("/all", admin, supportTicketController.getAllTickets);
router.patch("/status/:id", admin, supportTicketController.updateStatus);


// Shared routes
router.get("/:id", supportTicketController.getTicketById);
router.post("/message/:id", supportTicketController.addMessage);

module.exports = router;
