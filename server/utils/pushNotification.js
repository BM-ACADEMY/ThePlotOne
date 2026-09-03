const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");


// Configure VAPID keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    "mailto:help@nammapondyproperties.com",
    publicVapidKey,
    privateVapidKey
  );
}

/**
 * Send push notification to a specific user
 * @param {string} userId - ID of the user to notify
 * @param {Object} payload - Notification data (title, body, icon, url, etc.)
 */
exports.sendPushNotification = async (userId, payload) => {
  try {
    if (!publicVapidKey || !privateVapidKey) {
      console.warn("VAPID keys not configured. Skipping push notification.");
      return;
    }

    const subscriptions = await PushSubscription.find({ user: userId });
    
    // Also check for legacy subscriptions in User model
    const user = await User.findById(userId).select("pushSubscriptions");
    const legacySubscriptions = user?.pushSubscriptions || [];

    const allSubscriptions = [
      ...subscriptions.map(s => s.subscription),
      ...legacySubscriptions
    ];

    // Deduplicate by endpoint
    const uniqueSubscriptions = [];
    const seenEndpoints = new Set();

    for (const sub of allSubscriptions) {
      if (sub && sub.endpoint && !seenEndpoints.has(sub.endpoint)) {
        seenEndpoints.add(sub.endpoint);
        uniqueSubscriptions.push(sub);
      }
    }

    if (uniqueSubscriptions.length === 0) {
      console.log(`No unique subscriptions found for user ${userId}`);
      return;
    }

    const notifications = uniqueSubscriptions.map((sub) => {
      return webpush
        .sendNotification(sub, JSON.stringify(payload))

        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410 || err.statusCode === 403) {
            console.log(`Subscription invalid (${err.statusCode}). Removing for user ${userId}...`);
            
            // Remove from new model
            await PushSubscription.deleteOne({ user: userId, "subscription.endpoint": sub.endpoint });
            
            // Remove from legacy model in User document
            await User.findByIdAndUpdate(userId, {
              $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
            });
          } else {
            console.error("Error sending push notification:", err);
          }
        });

    });


    await Promise.all(notifications);
  } catch (error) {
    console.error("Failed to send push notifications:", error);
  }
};

/**
 * Send push notification to multiple users (e.g., all admins)
 * @param {Array} userIds - Array of user IDs
 * @param {Object} payload - Notification data
 */
exports.sendPushNotificationToMultiple = async (userIds, payload) => {
  try {
    const notifications = userIds.map((userId) => this.sendPushNotification(userId, payload));
    await Promise.all(notifications);
  } catch (error) {
    console.error("Failed to send bulk push notifications:", error);
  }
};
