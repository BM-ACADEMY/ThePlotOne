/**
 * Generates an HTML email template for badge verification notifications
 * @param {Object} user - The user data
 * @param {String} status - "approved", "rejected", or "verified"
 * @param {String} customMessage - Optional custom message from admin
 */
const badgeVerificationTemplate = (user, status, customMessage = "") => {
  let title = "Badge Verification Update";
  let statusColor = "#166aa8";
  let statusText = "Updated";
  let message = "";

  switch (status) {
    case "approved":
      title = "Badge Verification Approved!";
      statusColor = "#2e7d32";
      statusText = "APPROVED";
      message = "Congratulations! Your badge verification request has been approved. Your profile will now display the verified badge.";
      break;
    case "rejected":
      title = "Badge Verification Update";
      statusColor = "#d32f2f";
      statusText = "REJECTED";
      message = "Your badge verification request has been reviewed and was not approved at this time.";
      break;
    case "verified":
      title = "Profile Verified!";
      statusColor = "#2e7d32";
      statusText = "VERIFIED";
      message = "Your profile has been marked as verified by our team.";
      break;
    default:
      message = "There has been an update to your badge verification status.";
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .header { background: #166aa8; color: #fff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 30px; }
        .status-badge { display: inline-block; padding: 6px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; color: #fff; background-color: ${statusColor}; margin-bottom: 20px; }
        .info-box { background: #f9f9f9; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #166aa8; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One" style="height: 50px; width: auto; margin-bottom: 10px;">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || "Seller"},</p>
          
          <div class="status-badge">${statusText}</div>
          
          <p>${message}</p>
          
          ${customMessage ? `
            <div class="info-box">
              <strong>Admin Note:</strong><br>
              ${customMessage}
            </div>
          ` : ""}

          <p>You can view your updated profile status by logging into your dashboard.</p>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/login" class="btn">Login to Dashboard</a>
          </div>

          <p style="margin-top: 30px; font-size: 13px; color: #666;">
            If you have any questions regarding this update, please contact our support team.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} The Plot One. All rights reserved.<br>
          This is an automated notification, please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = badgeVerificationTemplate;
