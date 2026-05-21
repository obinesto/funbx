import YourVideosPageClient from "@/components/clients/YourVideosPageClient";
import { getCurrentUser } from "@/lib/auth";
import { getServerUserVideos } from "@/lib/server/protected-data";
import { redirect } from "next/navigation";

export default async function YourVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/your-videos");
  }

  const userVideos = await getServerUserVideos();
  return <YourVideosPageClient initialUserVideos={userVideos} />;
}
