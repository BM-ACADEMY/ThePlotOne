/**
 * Generates a sectioned HTML email template for property notifications
 * @param {Object} property - The property data
 * @param {Object} seller - The seller data
 * @param {String} type - "new_listing" or "edit_pending"
 */
const propertyNotificationTemplate = (property, seller, type) => {
  const isNew = type === "new_listing";
  const title = isNew ? "New Property Listing Alert" : "Property Edit Pending Approval";
  const subtitle = isNew 
    ? "A new property has been listed and is awaiting your review." 
    : "An existing property has been edited and requires approval for the changes.";

  const basicInfo = property.basicInfo || {};
  const location = property.location || {};
  const pricing = property.pricing || {};
  
  let priceDisplay = "N/A";
  if (basicInfo.category === "Rent") {
    const rent = pricing.rent || {};
    if (rent.monthlyRent) {
      priceDisplay = `₹${rent.monthlyRent.toLocaleString()} / Month`;
    } else if (rent.minRent && rent.maxRent) {
      priceDisplay = `₹${rent.minRent.toLocaleString()} - ₹${rent.maxRent.toLocaleString()} / Month`;
    }
  } else {
    // Sell/Buy category
    const sell = pricing.sell || {};
    if (sell.price) {
      priceDisplay = `₹${sell.price.toLocaleString()}`;
    } else if (sell.minPrice && sell.maxPrice) {
      priceDisplay = `₹${sell.minPrice.toLocaleString()} - ₹${sell.maxPrice.toLocaleString()}`;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .header { background: #166aa8; color: #fff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .section-title { color: #166aa8; font-weight: bold; font-size: 16px; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; }
        .section-title::before { content: ""; display: inline-block; width: 4px; height: 16px; background: #166aa8; margin-right: 10px; border-radius: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { margin-bottom: 8px; }
        .label { font-size: 12px; color: #777; display: block; margin-bottom: 2px; }
        .value { font-size: 14px; font-weight: 500; color: #222; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-pending { background: #fff3e0; color: #ef6c00; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #166aa8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 6px rgba(22, 106, 168, 0.2); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One" style="height: 60px; width: auto; margin-bottom: 10px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">${title}</p>
        </div>
        <div class="content">
          <p style="margin-top: 0;">Hello Admin,</p>
          <p>${subtitle}</p>

          <!-- Section 1: Property Overview -->
          <div class="section">
            <div class="section-title">Property Overview</div>
            <div style="margin-bottom: 15px;">
              <span class="label">Title</span>
              <span class="value" style="font-size: 18px; color: #166aa8;">${basicInfo.title || "N/A"}</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" class="info-item">
                  <span class="label">Category</span>
                  <span class="value">${basicInfo.category || "N/A"}</span>
                </td>
                <td width="50%" class="info-item">
                  <span class="label">Type</span>
                  <span class="value">${basicInfo.propertyType || "N/A"}</span>
                </td>
              </tr>
              <tr>
                <td class="info-item">
                  <span class="label">Usage</span>
                  <span class="value">${basicInfo.usageType || "N/A"}</span>
                </td>
                <td class="info-item">
                  <span class="label">Price</span>
                  <span class="value">${priceDisplay}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Section 2: Seller Information -->
          <div class="section">
            <div class="section-title">Seller Information</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" class="info-item">
                  <span class="label">Name</span>
                  <span class="value">${seller?.name || "N/A"}</span>
                </td>
                <td width="50%" class="info-item">
                  <span class="label">Phone</span>
                  <span class="value">${seller?.phone || "N/A"}</span>
                </td>
              </tr>
              <tr>
                <td class="info-item">
                  <span class="label">User ID</span>
                  <span class="value">${seller?.userId || "N/A"}</span>
                </td>
                <td class="info-item">
                  <span class="label">Status</span>
                  <span class="badge badge-pending">PENDING APPROVAL</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Section 3: Location Details -->
          <div class="section">
            <div class="section-title">Location</div>
            <div class="info-item">
              <span class="label">Locality</span>
              <span class="value">${location.locality || "N/A"}, ${location.city || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="label">Address</span>
              <span class="value">${location.addressLine1 || ""} ${location.addressLine2 || ""}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/admin/seller-listings" class="btn">View in Admin Panel</a>
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

module.exports = propertyNotificationTemplate;
