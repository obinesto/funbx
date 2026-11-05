import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import HistoryPageClient from "@/components/clients/HistoryPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerWatchHistory } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/history");
  }

  try {
    const queryClient = new QueryClient();
    const watchHistory = await getServerWatchHistory(queryClient);
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HistoryPageClient initialWatchHistory={watchHistory} />
      </HydrationBoundary>
    );
  } catch (error) {
    console.error("Failed to preload watch history:", error);
    return (
      <HistoryPageClient
        serverLoadError={
          error?.message || "Unable to preload watch history from the server."
        }
      />
    );
  }
}
