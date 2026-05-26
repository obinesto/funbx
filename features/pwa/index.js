"use client";

import { useState, useEffect, useRef } from "react";
import { useInstallPrompt } from "@/providers/PromptProvider";
import {
  subscribeUser,
  unsubscribeUser,
  sendTestNotificationToUser,
} from "./actions";
import authStore from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  BellOff,
  Plus,
  Share,
  Smartphone,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function NetworkStatusNotice() {
  const [notice, setNotice] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const showNotice = (nextNotice) => {
      window.clearTimeout(hideTimerRef.current);
      setNotice(nextNotice);
      setIsVisible(false);

      window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      hideTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    const handleOffline = () => {
      showNotice({
        type: "offline",
        title: "You are offline",
        message: "Cached pages and media remain available where possible.",
      });
    };

    const handleOnline = () => {
      showNotice({
        type: "online",
        title: "Back online",
        message: "Fresh content and account actions are available again.",
      });
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!notice) {
    return null;
  }

  const isOnline = notice.type === "online";

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-3 z-[80] flex justify-center px-4">
      <div
        className={`flex w-full max-w-md items-start gap-3 rounded-lg border bg-background px-4 py-3 text-foreground shadow-lg transition-all duration-300 ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`mt-0.5 rounded-full p-2 ${
            isOnline
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-customRed/10 text-customRed"
          }`}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="text-sm text-muted-foreground">{notice.message}</p>
        </div>
      </div>
    </div>
  );
}

function InstallPrompt() {
  const {
    showInstallPrompt,
    dismissInstallPrompt,
    triggerInstallPrompt,
    isIOS,
  } = useInstallPrompt();

  if (!showInstallPrompt) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="h-5 w-5" />
        <h3 className="text-lg font-semibold w-full justify-between">
          Install FunBx App
        </h3>
        <Button onClick={dismissInstallPrompt}>
          <X />
        </Button>
      </div>
      {isIOS ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To install this app on your iOS device:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Tap the <Share className="h-4 w-4 inline mx-1" /> share button
            </li>
            <li>
              Scroll down and tap &quot;Add to Home Screen&quot;{" "}
              <Plus className="h-4 w-4 inline mx-1" />
            </li>
            <li>Tap &quot;Add&quot; to confirm</li>
          </ol>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Install our app for a better experience with offline access and
            faster loading times.
          </p>
          <Button onClick={triggerInstallPrompt}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Home Screen
          </Button>
        </div>
      )}
    </Card>
  );
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionVisibility, setSubscriptionVisibility] = useState(true);
  const [permission, setPermission] = useState("default");
  const [message, setMessage] = useState("");
  const [loadingStates, setLoadingStates] = useState({
    subscribe: false,
    unsubscribe: false,
    test: false,
  });
  const { user, token } = authStore();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      }).catch(error => {
        console.error("Error getting service worker ready:", error);
      });
    }
  }, []);

  async function subscribeToPush() {
    setLoadingStates(prev => ({ ...prev, subscribe: true }));
    try {
      if (!token) {
        throw new Error("Sign in again before enabling notifications.");
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error("Push notifications are not configured.");
      }
      if (Notification.permission === "denied") {
        throw new Error("Notifications are blocked in this browser.");
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
      setSubscription(sub);

      const result = await subscribeUser(sub.toJSON(), token);
      if (!result.success) {
        await sub.unsubscribe();
        setSubscription(null);
        throw new Error(result.error || "Subscription could not be saved.");
      }
      toast("Notifications enabled");
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast(error.message || "Failed to enable notifications");
    } finally {
      setLoadingStates(prev => ({ ...prev, subscribe: false }));
    }
  }

  async function unsubscribeFromPush() {
    setLoadingStates(prev => ({ ...prev, unsubscribe: true }));
    try {
      if (!token) {
        throw new Error("Sign in again before disabling notifications.");
      }
      await subscription?.unsubscribe();
      await unsubscribeUser(subscription.toJSON(), token);
      setSubscription(null);
      setSubscriptionVisibility(false);
      toast("Notifications disabled");
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast(error.message || "Failed to disable notifications");
    } finally {
      setLoadingStates(prev => ({ ...prev, unsubscribe: false }));
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return;
    setLoadingStates(prev => ({ ...prev, test: true }));
    try {
      if (!token) {
        throw new Error("Sign in again before sending a test notification.");
      }
      const result = await sendTestNotificationToUser(
        subscription.toJSON(),
        message,
        token,
      );
      if (!result.success) {
        throw new Error(result.error || "Failed to send notification.");
      }
      setMessage("");
      toast("Test notification sent");
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast(error.message || "Failed to send notification");
    } finally {
      setLoadingStates(prev => ({ ...prev, test: false }));
    }
  }

  // Hide the component if the user has dismissed it or if user device does not support push notifications or if there is no user
  if (!subscriptionVisibility || !isSupported || !user) {
    return null;
  }

  return (
    <Card className="flex flex-col p-2 mb-6">
      {subscription ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            You&apos;ll receive notifications about videos you&apos;ve
            interacted with.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter a test notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={sendTestNotification}
                disabled={loadingStates.test || !message.trim()}
              >
                {loadingStates.test ? "Testing..." : "Test"}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={unsubscribeFromPush}
                disabled={loadingStates.unsubscribe}
              >
                <BellOff className="h-4 w-4 mr-2" />
                {loadingStates.unsubscribe ? "Disabling..." : "Disable Notifications"}
              </Button>
              <Button
                onClick={() => setSubscriptionVisibility(false)}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                <X />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {permission === "denied"
              ? "Notifications are blocked in your browser settings."
              : "Enable notifications to stay updated with activities here."}
          </p>
          <div className="w-full md:w-1/4 flex justify-between md:justify-start gap-4 items-center">
            <Button
              onClick={subscribeToPush}
              disabled={
                loadingStates.subscribe ||
                !user?.uid ||
                permission === "denied"
              }
            >
              <Bell />
              {loadingStates.subscribe ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              onClick={() => setSubscriptionVisibility(false)}
              disabled={Object.values(loadingStates).some(Boolean)}
            >
              <X />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PwaSetup() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);

    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }
  }, []);
  if (!isClient) return null;

  return (
    <>
      <NetworkStatusNotice />
      <div className="pointer-events-none fixed left-0 right-0 top-20 z-50 mx-auto flex max-w-2xl flex-col px-4 py-8 md:left-32">
        <div className="pointer-events-auto">
          <PushNotificationManager />
          <InstallPrompt />
        </div>
      </div>
    </>
  );
}
