/**
 * Generates an HTML email template for subscription expiration
 * @param {Object} user - The user object
 * @param {Object} subscription - The subscription object
 */
const subscriptionExpiredTemplate = (user, subscription) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .header { background: #c0392b; color: #fff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 30px; }
        .alert-box { background: #fdf2f2; border: 1px solid #f8d7da; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .status { font-size: 24px; font-weight: bold; color: #c0392b; display: block; margin: 10px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 25px; background: #c0392b; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://theplotone.com/Logo/logo.webp" alt="The Plot One" style="height: 50px; width: auto; margin-bottom: 10px;">
          <h1>Subscription Expired</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || "Valued Member"},</p>
          <p>Your premium subscription has officially expired. Your account has been moved to the default free plan.</p>
          
          <div class="alert-box">
            <span>Status:</span>
            <span class="status">EXPIRED</span>
            <span>Plan: ${subscription.plan?.planName || "Active Plan"}</span>
          </div>

          <p>You may lose access to some premium features and property leads. To continue enjoying the benefits of your premium plan, please renew now.</p>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/pricing" class="btn">Renew Subscription</a>
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

module.exports = subscriptionExpiredTemplate;
