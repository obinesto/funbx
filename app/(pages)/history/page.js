import HistoryPageClient from "@/components/clients/HistoryPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerWatchHistory } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/history");
  }

  const watchHistory = await getServerWatchHistory();
  return <HistoryPageClient initialWatchHistory={watchHistory} />;
}
