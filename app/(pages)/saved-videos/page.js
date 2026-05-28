import SavedVideosPageClient from "@/components/clients/SavedVideosPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerSavedVideos } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function SavedVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/saved-videos");
  }

  try {
    const videos = await getServerSavedVideos();
    return <SavedVideosPageClient initialVideos={videos} />;
  } catch (error) {
    console.error("Failed to preload saved videos:", error);
    return (
      <SavedVideosPageClient
        serverLoadError={
          error?.message || "Unable to preload saved videos from the server."
        }
      />
    );
  }
}
