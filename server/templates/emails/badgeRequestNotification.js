/**
 * Generates an HTML email template for badge verification requests (Admin Notification)
 * @param {Object} user - The seller data
 */
const badgeRequestNotificationTemplate = (user) => {
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
        .info-item { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .label { font-size: 12px; color: #777; display: block; }
        .value { font-size: 15px; font-weight: 500; color: #222; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #166aa8; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One" style="height: 50px; width: auto; margin-bottom: 10px;">
          <h1>New Badge Request</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A seller has submitted a new request for badge verification.</p>
          
          <div class="info-item">
            <span class="label">Seller Name</span>
            <span class="value">${user.name || "N/A"}</span>
          </div>
          <div class="info-item">
            <span class="label">Phone</span>
            <span class="value">${user.phone || "N/A"}</span>
          </div>
          <div class="info-item">
            <span class="label">User ID</span>
            <span class="value">${user.userId || "N/A"}</span>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/admin/sellers" class="btn">Review in Admin Panel</a>
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

module.exports = badgeRequestNotificationTemplate;
