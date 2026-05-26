"use server";

import { sendPushNotification } from "@/utils/pushNotification";
import { auth } from "@/lib/firebase/firebaseAdmin";
import { supabase } from "@/lib/supabaseConfig";

async function getVerifiedUser(token) {
  if (!token) {
    return { user: null, error: "User not authenticated" };
  }

  const decodedToken = await auth.verifyIdToken(token);
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("firebase_uid", decodedToken.uid)
    .single();

  if (userError) {
    throw userError;
  }

  return { user, error: null };
}

export async function subscribeUser(subscription, token) {
  const { user, error: authError } = await getVerifiedUser(token);
  if (authError) return { success: false, error: authError };

  const { error } = await supabase.from("pwa_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint, // Endpoint is used as a unique key
      subscription_data: subscription,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Error storing subscription:", error);
    return {
      success: false,
      error: `Supabase error: ${error.code} - ${error.message}`,
    };
  }
  console.log({ success: true, message: "user subscription successful" });
  return { success: true };
}

export async function unsubscribeUser(subscription, token) {
  const { user, error: authError } = await getVerifiedUser(token);
  if (authError) return { success: false, error: authError };

  const { error } = await supabase
    .from("pwa_subscriptions")
    .delete()
    .eq("endpoint", subscription.endpoint)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendTestNotificationToUser(subscription, message, token) {
  if (!subscription) return { success: false, error: "No subscription found." };
  const { user, error: authError } = await getVerifiedUser(token);
  if (authError) return { success: false, error: authError };

  const { data: savedSubscription, error } = await supabase
    .from("pwa_subscriptions")
    .select("subscription_data")
    .eq("endpoint", subscription.endpoint)
    .eq("user_id", user.id)
    .single();

  if (error || !savedSubscription) {
    return { success: false, error: "Subscription not found for this user." };
  }

  const payload = {
    title: "Test Notification",
    body: message,
    icon: "/web-app-manifest-192x192.png",
    url: "/",
  };
  return await sendPushNotification(savedSubscription.subscription_data, payload);
}
