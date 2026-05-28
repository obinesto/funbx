import LikedVideosPageClient from "@/components/clients/LikedVideosPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerLikedVideos } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function LikedVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/liked-videos");
  }

  try {
    const videos = await getServerLikedVideos();
    return <LikedVideosPageClient initialVideos={videos} />;
  } catch (error) {
    console.error("Failed to preload liked videos:", error);
    return (
      <LikedVideosPageClient
        serverLoadError={
          error?.message || "Unable to preload liked videos from the server."
        }
      />
    );
  }
}
