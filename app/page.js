import HomeFeedClient from "@/components/clients/HomeFeedClient";
import { getPopularVideos } from "@/lib/server/youtube";

export const revalidate = 300;

export default async function Home() {
  let initialVideos = [];

  try {
    initialVideos = await getPopularVideos({
      maxResults: "50",
      regionCode: "US",
      revalidate,
      tags: ["youtube-feed"],
    });
  } catch (error) {
    console.error("Failed to fetch initial feed videos:", error);
  }

  return <HomeFeedClient initialVideos={initialVideos} />;
}
