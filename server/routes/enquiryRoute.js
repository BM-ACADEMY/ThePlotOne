const express = require("express");
const router = express.Router();
const enquiryController = require("../controllers/enquiryController");
const { protect, optionalProtect } = require("../middleware/authMiddleware"); // auth optional for create?

// Create enquiry (public or protected - if public, we don't have req.user)
// The user said "that user information... move the that create perosn"
// If user selects property, we want to capture their info.
// Ideally, we should allow unauthenticated enquiries but track IP,
// OR try to get user info if logged in.
// Middleware `protect` forces login. We might need a `optionalProtect` or just check token manually in controller.
// For now, let's make it public but use middleware to attach user if token exists.
// I'll use a lenient middleware if available, or just standard route handling.
// Actually, `protect` throws error if no token.
// Let's make a wrapper or just use `protect` for now if we assume they might be logged in,
// BUT for a public site, usually visitors aren't logged in.
// I will NOT use `protect` for create, but I will try to decode token if present in controller or custom middleware.
// For MVP/simplicity: Public route. Backend controller checks `req.header('Authorization')` manually?
// Or just let frontend send user_id if known. Frontend is trusted enough for "leads" in this context?
// No, better to decode token.
// lets add a simple "extractUser" middleware inline or just skip user_id if not protected.

router.post("/create", optionalProtect, enquiryController.createEnquiry); // Public but aware of user

// Get enquiries (Protected)
router.get("/fetch-all", protect, enquiryController.getEnquiries);

// Seller specific - get their own enquiries
router.get("/seller-enquiries", protect, enquiryController.getEnquiries);

// Admin specific
router.get("/admin/fetch-all", protect, enquiryController.getAllEnquiriesAdmin);

// Delete Enquiries/Leads (Admin)
router.delete("/delete/:id", protect, enquiryController.deleteEnquiry);
router.delete(
  "/whatsapp/delete/:id",
  protect,
  enquiryController.deleteWhatsappLead,
);

// Update Enquiry Status (Seller or Admin)
router.patch("/update-status/:id", protect, enquiryController.updateStatus);

module.exports = router;
