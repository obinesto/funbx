"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import authStore from "@/store/authStore";
import { WifiOff } from "lucide-react";

// Routes that require authentication
const protectedRoutes = [
  "/studio",
  "/playlist",
  "/liked-videos",
  "/saved-videos",
  "/subscriptions",
  "/settings",
  "/history",
  "/your-videos",
];

export function AuthProvider({ children }) {
  const { isAuthenticated, loading, token } = authStore();
  const [isOnline, setIsOnline] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const currentPath = `${pathname}${window.location.search}`;

      // Handle protected routes
      if (isOnline && isProtectedRoute && !isAuthenticated) {
        router.replace(`/auth?next=${encodeURIComponent(currentPath)}`);
      }

    }
  }, [isAuthenticated, isOnline, isProtectedRoute, loading, pathname, router]);

  if (!isOnline && isProtectedRoute && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-customRed/10 text-customRed">
            <WifiOff className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Offline access unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reconnect to the internet, sign in once, then revisit this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading && isOnline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-customRed" />
          <div>
            <p className="text-base font-semibold">Checking your session</p>
            <p className="text-sm text-muted-foreground">
              Getting the app ready for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
