import "server-only";

import webpush from "web-push";
import { supabase } from "@/lib/supabaseConfig";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) {
    return;
  }

  const contactEmail = process.env.AUTHOR_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!contactEmail || !publicKey || !privateKey) {
    throw new Error("Missing VAPID push notification environment variables");
  }

  webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
  vapidConfigured = true;
}

export async function sendPushNotification(subscription, payload) {
  try {
    configureVapid();
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    // If a subscription is expired or invalid, it should be removed.
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log("Subscription expired or invalid. Removing...");
      await supabase
        .from("pwa_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
    }
    return { success: false, error: "Failed to send notification" };
  }
}

export async function getSubscriptionsForUser(userId) {
  const { data, error } = await supabase
    .from("pwa_subscriptions")
    .select("subscription_data")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching subscriptions for user:", error);
    return [];
  }

  // Subscription data is stored in a JSONB column.
  return data.map(item => item.subscription_data);
}
