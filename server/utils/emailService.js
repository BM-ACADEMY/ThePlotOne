const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const propertyNotificationTemplate = require("../templates/emails/propertyNotification");
const marketingLeadTemplate = require("../templates/emails/marketingLead");
const enquiryLeadTemplate = require("../templates/emails/enquiryLead");
const badgeVerificationTemplate = require("../templates/emails/badgeVerification");
const badgeRequestNotificationTemplate = require("../templates/emails/badgeRequestNotification");
const contactMessageNotificationTemplate = require("../templates/emails/contactMessageNotification");
const callRequestNotificationTemplate = require("../templates/emails/callRequestNotification");
const subscriptionExpiryWarningTemplate = require("../templates/emails/subscriptionExpiryWarning");
const subscriptionExpiredTemplate = require("../templates/emails/subscriptionExpired");
const requirementNotificationTemplate = require("../templates/emails/requirementNotification");
const supportTicketNotificationTemplate = require("../templates/emails/supportTicketNotification");
const thankYouTemplate = require("../templates/emails/thankYouTemplate");
dotenv.config();


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // false for 587
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email notification
 */
exports.sendPropertyNotification = async (property, seller, type) => {
  try {
    const htmlContent = propertyNotificationTemplate(property, seller, type);
    const subject = type === "new_listing" 
      ? `New Listing: ${property.basicInfo?.title}` 
      : `Edit Pending: ${property.basicInfo?.title}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Property notification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending property notification email:", error);
    // Don't throw error to prevent breaking the main flow
    return null;
  }
};

/**
 * Sends an email notification for a new marketing lead
 */
exports.sendMarketingLeadNotification = async (request, seller, property, plan) => {
  try {
    const htmlContent = marketingLeadTemplate(request, seller, property, plan);
    const subject = `New Marketing Lead: ${plan?.serviceName || "Marketing Request"}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Marketing lead email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending marketing lead email:", error);
    return null;
  }
};

/**
 * Sends an email notification for a new or updated property enquiry
 */
exports.sendEnquiryNotification = async (enquiry, seller, property, updater = null, isUpdate = false) => {
  try {
    const htmlContent = enquiryLeadTemplate(enquiry, seller, property, updater, isUpdate);
    const subject = isUpdate 
      ? `Enquiry Updated: ${enquiry.status.toUpperCase()} - ${property.basicInfo?.title || "Property"}`
      : `New Property Enquiry: ${enquiry.enquirer_name || "Buyer"}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Enquiry email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending enquiry email:", error);
    return null;
  }
};

/**
 * Sends an email notification for badge verification status update
 */
exports.sendBadgeVerificationNotification = async (user, status, customMessage = "") => {
  try {
    const htmlContent = badgeVerificationTemplate(user, status, customMessage);
    const subject = `Badge Verification Update - The Plot One`;

    // Priority: user.email (if exists) > user.builderProfile.email
    const recipientEmail = user.email || user.builderProfile?.email;

    if (!recipientEmail) {
      console.warn(`Cannot send badge verification email: No email found for user ${user._id}`);
      return null;
    }

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Badge verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending badge verification email:", error);
  }
};

/**
 * Sends an email notification to admin when a seller requests badge verification
 */
exports.sendBadgeRequestNotificationToAdmin = async (user) => {
  try {
    const htmlContent = badgeRequestNotificationTemplate(user);
    const subject = `New Badge Verification Request: ${user.name || "Seller"}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Badge request notification email sent to admin:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending badge request notification email:", error);
    return null;
  }
};

/**
 * Sends an email notification to admin when a new contact message is received
 */
exports.sendContactNotificationToAdmin = async (contact) => {
  try {
    const htmlContent = contactMessageNotificationTemplate(contact);
    const subject = `New Contact Message from ${contact.name}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Contact notification email sent to admin:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending contact notification email:", error);
    return null;
  }
};

/**
 * Sends an email notification to admin when a new callback request is received
 */
exports.sendCallRequestNotificationToAdmin = async (request) => {
  try {
    const htmlContent = callRequestNotificationTemplate(request);
    const subject = `New Callback Request: ${request.fullName}`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Callback request notification email sent to admin:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending callback request notification email:", error);
    return null;
  }
};

/**
 * Sends a subscription expiry warning email to the user
 */
exports.sendSubscriptionExpiryWarning = async (user, subscription, daysLeft) => {
  try {
    // Determine the recipient's email
    let recipientEmail = null;
    if (user.builderProfile && user.builderProfile.email) {
      recipientEmail = user.builderProfile.email;
    }

    if (!recipientEmail) {
      console.warn(`No email found for user ${user._id}, cannot send subscription expiry warning.`);
      return null;
    }

    const htmlContent = subscriptionExpiryWarningTemplate(user, subscription, daysLeft);
    const subject = daysLeft === 1 
      ? "Final Warning: Your subscription expires tomorrow"
      : `Urgent: Your subscription is expiring in ${daysLeft} days`;

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Subscription expiry warning sent to user ${user._id}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending subscription expiry warning email:", error);
    return null;
  }
};

/**
 * Sends a subscription expired notification email to the user
 */
exports.sendSubscriptionExpiredNotification = async (user, subscription) => {
  try {
    // Determine the recipient's email
    let recipientEmail = null;
    if (user.builderProfile && user.builderProfile.email) {
      recipientEmail = user.builderProfile.email;
    }

    if (!recipientEmail) {
      console.warn(`No email found for user ${user._id}, cannot send subscription expired notification.`);
      return null;
    }

    const htmlContent = subscriptionExpiredTemplate(user, subscription);
    const subject = "Your subscription has expired - The Plot One";

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Subscription expired notification sent to user ${user._id}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending subscription expired notification email:", error);
    return null;
  }
};

/**
 * Sends a notification email to the admin for a new property requirement
 */
exports.sendRequirementNotificationToAdmin = async (requirement) => {
  try {
    const htmlContent = requirementNotificationTemplate(requirement);

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL, // Admin's email
      subject: `New Property Requirement: ${requirement.fullName}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Property requirement notification email sent to admin:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending property requirement notification email:", error);
    return null;
  }
};

/**
 * Sends a notification email to the admin for a new support ticket
 */
exports.sendSupportTicketNotificationToAdmin = async (ticket, seller, firstMessage) => {
  try {
    const htmlContent = supportTicketNotificationTemplate(ticket, seller, firstMessage);

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL, // Admin's email
      subject: `New Support Ticket: ${ticket.subject}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Support ticket notification email sent to admin:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending support ticket notification email:", error);
    return null;
  }
};

/**
 * Sends a "Thank You" email to the user after form submission
 */
exports.sendThankYouEmail = async (data, type = "contact") => {
  try {
    const recipientEmail = data.email;
    if (!recipientEmail) {
      console.warn(`No email found in ${type} submission, cannot send thank you email.`);
      return null;
    }

    const htmlContent = thankYouTemplate(data, type);
    const subject = type === "callback" 
      ? "We've received your callback request - The Plot One"
      : "Thank you for contacting The Plot One";

    const mailOptions = {
      from: `"The Plot One" <${process.env.USER_EMAIL}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Thank you email (${type}) sent to ${recipientEmail}:`, info.messageId);
    return info;
  } catch (error) {
    console.error(`Error sending thank you email (${type}):`, error);
    return null;
  }
};




