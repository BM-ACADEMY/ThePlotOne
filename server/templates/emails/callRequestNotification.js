/**
 * Generates an HTML email template for a new call request notification
 * @param {Object} callRequest - The call request data
 */
const callRequestNotificationTemplate = (callRequest) => {
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
        .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .section-title { color: #166aa8; font-weight: bold; font-size: 16px; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; }
        .section-title::before { content: ""; display: inline-block; width: 4px; height: 16px; background: #166aa8; margin-right: 10px; border-radius: 2px; }
        .info-item { margin-bottom: 12px; }
        .label { font-size: 12px; color: #777; display: block; margin-bottom: 2px; }
        .value { font-size: 14px; font-weight: 500; color: #222; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #166aa8; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One" style="height: 50px; width: auto; margin-bottom: 10px;">
          <h1>New Callback Request</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A user has requested a callback. Here are the details:</p>
          
          <div class="section">
            <div class="section-title">User Details</div>
            <div class="info-item">
              <span class="label">Full Name</span>
              <span class="value">${callRequest.fullName || callRequest.name || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone Number</span>
              <span class="value">${callRequest.phone}</span>
            </div>
            <div class="info-item">
              <span class="label">Preferred Date</span>
              <span class="value">${callRequest.preferred_date ? new Date(callRequest.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="label">Preferred Time</span>
              <span class="value">${callRequest.preferredTime || "N/A"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Property Interested In</div>
            <div class="info-item">
              <span class="value">${callRequest.propertyId?.basicInfo?.title || "Direct Interest (No Property Linked)"}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.ADMIN_URL || 'https://admin.theplotone.com'}/forms/callback-requests" class="btn">View in Admin Panel</a>
          </div>
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

module.exports = callRequestNotificationTemplate;
