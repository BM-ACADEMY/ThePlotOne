const Contact = require("../models/Contact");
const RequestCall = require("../models/RequestCall");
const { sendContactNotificationToAdmin, sendCallRequestNotificationToAdmin, sendThankYouEmail } = require("../utils/emailService");

// --- Contact Form ---

// Create a new contact message
exports.createContact = async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    const savedContact = await newContact.save();

    // Emit socket event for real-time notification
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("new-contact-message", {
        contactId: savedContact._id,
        name: savedContact.name,
        message: `New contact message from ${savedContact.name}`,
      });
    }

    // Send Email Notification to Admin
    try {
      await sendContactNotificationToAdmin(savedContact);
      // Send Thank You Email to User
      await sendThankYouEmail(savedContact, "contact");
    } catch (emailError) {
      console.error("Failed to send email notifications:", emailError);
    }

    res.status(201).json({
      success: true,
      data: savedContact,
      message: "Contact message submitted successfully",
    });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit contact message",
      error: error.message,
    });
  }
};

// Get all contact messages (Admin)
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
      error: error.message,
    });
  }
};

// Delete a contact message
exports.deleteContact = async (req, res) => {
  try {
    const result = await Contact.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Contact not found" });
    res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
      error: error.message,
    });
  }
};

// --- Request Call Form ---

// Create a new request call
exports.createRequestCall = async (req, res) => {
  try {
    const newRequest = new RequestCall(req.body);
    const savedRequest = await newRequest.save();

    // Emit socket event for real-time notification
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("new-call-request", {
        requestId: savedRequest._id,
        fullName: savedRequest.fullName,
        message: `New callback request from ${savedRequest.fullName}`,
      });
    }

    // Send Email Notification to Admin
    try {
      await sendCallRequestNotificationToAdmin(savedRequest);
      // Send Thank You Email to User
      await sendThankYouEmail(savedRequest, "callback");
    } catch (emailError) {
      console.error("Failed to send email notifications:", emailError);
    }

    res.status(201).json({
      success: true,
      data: savedRequest,
      message: "Callback request submitted successfully",
    });
  } catch (error) {
    console.error("Error saving callback request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit callback request",
      error: error.message,
    });
  }
};

// Get all callback requests (Admin)
exports.getRequestCalls = async (req, res) => {
  try {
    const requests = await RequestCall.find()
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch callback requests",
      error: error.message,
    });
  }
};

// Delete a callback request
exports.deleteRequestCall = async (req, res) => {
  try {
    const result = await RequestCall.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Callback request not found" });
    res.status(200).json({
      success: true,
      message: "Callback request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete callback request",
      error: error.message,
    });
  }
};

// Update callback request status
exports.updateRequestCallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRequest = await RequestCall.findByIdAndUpdate(
      id,
      { 
        status,
        updatedBy: req.user._id 
      },
      { new: true }
    ).populate("updatedBy", "name");

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedRequest,
      message: "Status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};
// Update contact message status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { 
        status,
        updatedBy: req.user._id 
      },
      { new: true }
    ).populate("updatedBy", "name");

    if (!updatedContact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedContact,
      message: "Status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};
