/**
 * Generates a sectioned HTML email template for marketing lead notifications
 * @param {Object} request - The marketing request data
 * @param {Object} seller - The seller data
 * @param {Object} property - The property data
 * @param {Object} plan - The marketing plan data
 */
const marketingLeadTemplate = (request, seller, property, plan) => {
  const title = "New Marketing Lead Alert";
  const subtitle = "A seller has requested a marketing service for their property.";

  const basicInfo = property.basicInfo || {};
  const location = property.location || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .header { background: #166aa8; color: #fff; padding: 30px 20px; text-align: center; }
        .header img { height: 60px; width: auto; margin-bottom: 10px; }
        .header p { margin: 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .section-title { color: #166aa8; font-weight: bold; font-size: 16px; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; }
        .section-title::before { content: ""; display: inline-block; width: 4px; height: 16px; background: #166aa8; margin-right: 10px; border-radius: 2px; }
        .info-item { margin-bottom: 12px; }
        .label { font-size: 12px; color: #777; display: block; margin-bottom: 2px; }
        .value { font-size: 14px; font-weight: 500; color: #222; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e3f2fd; color: #166aa8; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #166aa8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One">
          <p>${title}</p>
        </div>
        <div class="content">
          <p style="margin-top: 0;">Hello Admin,</p>
          <p>${subtitle}</p>

          <!-- Section 1: Service Requested -->
          <div class="section">
            <div class="section-title">Marketing Service Details</div>
            <table>
              <tr>
                <td width="33%">
                  <span class="label">Service Plan</span>
                  <span class="value" style="font-size: 18px; color: #166aa8;">${plan?.serviceName || "N/A"}</span>
                </td>
                <td width="33%">
                  <span class="label">Price Range</span>
                  <span class="value">${plan?.priceRange || "N/A"}</span>
                </td>
                <td width="33%">
                  <span class="label">Request Status</span>
                  <span class="badge">PENDING</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Section 2: Seller Information -->
          <div class="section">
            <div class="section-title">Seller Information</div>
            <table>
              <tr>
                <td width="50%">
                  <span class="label">Name</span>
                  <span class="value">${seller?.name || "N/A"}</span>
                </td>
                <td width="50%">
                  <span class="label">Phone</span>
                  <span class="value">${seller?.phone || "N/A"}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span class="label">User ID</span>
                  <span class="value">${seller?.customId || seller?._id || "N/A"}</span>
                </td>
                <td></td>
              </tr>
            </table>
          </div>

          <!-- Section 3: Property Information -->
          <div class="section">
            <div class="section-title">Associated Property</div>
            <table>
              <tr>
                <td width="50%">
                  <span class="label">Property Title</span>
                  <span class="value">${basicInfo.title || "N/A"}</span>
                </td>
                <td width="50%">
                  <span class="label">Category / Type</span>
                  <span class="value">${basicInfo.category || ""} - ${basicInfo.propertyType || ""}</span>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <span class="label">Location</span>
                  <span class="value">${location.locality || "N/A"}, ${location.city || "N/A"}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/admin/marketing-requests" class="btn">Manage Marketing Requests</a>
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

module.exports = marketingLeadTemplate;
