/**
 * Generates an HTML email template for a new property requirement notification
 * @param {Object} requirement - The requirement data
 */
const requirementNotificationTemplate = (requirement) => {
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
          <h1>New Property Requirement</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A new property requirement has been submitted. Here are the details:</p>
          
          <div class="section">
            <div class="section-title">User Details</div>
            <div class="info-item">
              <span class="label">Full Name</span>
              <span class="value">${requirement.fullName}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone Number</span>
              <span class="value">${requirement.phoneNumber}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Property Requirement</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" class="info-item">
                  <span class="label">Category</span>
                  <span class="value">${requirement.category}</span>
                </td>
                <td width="50%" class="info-item">
                  <span class="label">Property Type</span>
                  <span class="value">${requirement.usageType} - ${requirement.propertyType}</span>
                </td>
              </tr>
              <tr>
                <td class="info-item">
                  <span class="label">Budget Range</span>
                  <span class="value">₹${requirement.minBudget?.toLocaleString('en-IN') || 0} - ₹${requirement.maxBudget?.toLocaleString('en-IN') || 'Flexible'}</span>
                </td>
                <td class="info-item">
                  <span class="label">Preferred Location</span>
                  <span class="value">${requirement.locationText || requirement.preferredLocation || 'Not Specified'}</span>
                </td>
              </tr>
            </table>
            <div class="info-item">
              <span class="label">Preferences</span>
              <span class="value">${requirement.propertyPreferences || 'None'}</span>
            </div>
            <div class="info-item">
              <span class="label">Message</span>
              <span class="value">${requirement.message || "No message provided."}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/admin/requirements" class="btn">View in Admin Panel</a>
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

module.exports = requirementNotificationTemplate;
