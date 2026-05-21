import SavedVideosPageClient from "@/components/clients/SavedVideosPageClient";
import { getCurrentUser } from "@/lib/auth";
import { getServerSavedVideos } from "@/lib/server/protected-data";
import { redirect } from "next/navigation";

export default async function SavedVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/saved-videos");
  }

  const videos = await getServerSavedVideos();
  return <SavedVideosPageClient initialVideos={videos} />;
}
