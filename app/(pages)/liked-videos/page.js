import LikedVideosPageClient from "@/components/clients/LikedVideosPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerLikedVideos } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function LikedVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/liked-videos");
  }

  const videos = await getServerLikedVideos();
  return <LikedVideosPageClient initialVideos={videos} />;
}
