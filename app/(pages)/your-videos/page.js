import YourVideosPageClient from "@/components/clients/YourVideosPageClient";
import { getCurrentUser } from "@/lib/authConfig";
import { getServerUserVideos } from "@/lib/server/protectedData";
import { redirect } from "next/navigation";

export default async function YourVideosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/your-videos");
  }

  try {
    const userVideos = await getServerUserVideos();
    return <YourVideosPageClient initialUserVideos={userVideos} />;
  } catch (error) {
    console.error("Failed to preload user videos:", error);
    return (
      <YourVideosPageClient
        serverLoadError={
          error?.message || "Unable to preload your videos from the server."
        }
      />
    );
  }
}
