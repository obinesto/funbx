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
    const watchHistory = await getServerWatchHistory();
    return <HistoryPageClient initialWatchHistory={watchHistory} />;
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
