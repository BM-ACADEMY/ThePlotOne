/**
 * Generates an HTML email template for a "Thank You" message to the user
 * @param {Object} data - The submission data (contact or callback request)
 * @param {String} type - The type of submission ('contact' or 'callback')
 */
const thankYouTemplate = (data, type = 'contact') => {
  const name = data.name || data.fullName || 'Valued Customer';
  const title = type === 'callback' ? 'Callback Request Received' : 'Message Received';
  const message = type === 'callback' 
    ? 'Thank you for requesting a callback. Our team has received your request and will get back to you during your preferred time.' 
    : 'Thank you for contacting us. We have received your message and will get back to you as soon as possible.';

  // Prepare detailed summary based on type
  let detailsHtml = '';
  if (type === 'callback') {
    detailsHtml = `
      <strong>Name:</strong> ${data.fullName || 'N/A'}<br>
      <strong>Phone:</strong> ${data.phone || 'N/A'}<br>
      <strong>Email:</strong> ${data.email || 'N/A'}<br>
      <strong>Category:</strong> ${data.category || 'N/A'}<br>
      <strong>Preferred Date:</strong> ${data.preferred_date ? new Date(data.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}<br>
      <strong>Preferred Time:</strong> ${data.preferredTime || 'N/A'}
    `;
  } else {
    detailsHtml = `
      <strong>Name:</strong> ${data.name || 'N/A'}<br>
      <strong>Phone:</strong> ${data.phone || 'N/A'}<br>
      <strong>Email:</strong> ${data.email || 'N/A'}<br>
      <strong>Message:</strong> ${data.message || 'No message provided'}${data.sellProperty ? '<br><strong>Note:</strong> Interested in selling property' : ''}
    `;
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
        .content { padding: 30px; text-align: center; }
        .thank-you-icon { font-size: 48px; color: #166aa8; margin-bottom: 20px; }
        .message-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: left; border-left: 4px solid #166aa8; }
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
          <div class="thank-you-icon">✉️</div>
          <p>Dear <strong>${name}</strong>,</p>
          <p>${message}</p>
          
          <div class="message-box">
            <p style="margin: 0; font-weight: bold; color: #166aa8; font-size: 14px;">Summary of your submission:</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.8;">
              ${detailsHtml}<br>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>

          <p>If you have any urgent queries, feel free to visit our website or call us directly.</p>
          
          <div style="text-align: center;">
            <a href="https://theplotone.com" class="btn">Visit Website</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} The Plot One. All rights reserved.<br>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = thankYouTemplate;
