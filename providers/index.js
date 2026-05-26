"use client";
import { useEffect, useState } from "react";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { PromptProvider } from "@/providers/PromptProvider";

if (typeof window !== "undefined") {
  onlineManager.setOnline(window.navigator.onLine);
}

function NetworkQueryBridge() {
  useEffect(() => {
    const updateOnlineState = () => {
      onlineManager.setOnline(navigator.onLine);
    };

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  return null;
}

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NetworkQueryBridge />
      <PromptProvider>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </PromptProvider>
    </QueryClientProvider>
  );
}
