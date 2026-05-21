import VideoCard from "@/components/global/VideoCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getSearchVideos } from "@/lib/server/youtube";

export const revalidate = 3600;

function SearchError({ error }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-center">
            {error?.message && error.message.includes("quota") ? (
              <>
                <p>YouTube API quota exhausted.</p>
                <p>Kindly come back in the next 24 hours when it resets.</p>
              </>
            ) : (
              "Error loading search results. Please try again later"
            )}
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default async function SearchPage({ params }) {
  const { slug } = await params;
  const searchQuery = decodeURIComponent(slug);

  try {
    const videos = await getSearchVideos(searchQuery);

    return (
      <section className="space-y-4">
        <Card className="p-4 border-hidden">
          <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
            Search Results for:{" "}
            <span className="text-customDark dark:text-customWhite font-medium sm:font-bold text-lg sm:text-xl">
              {searchQuery}
            </span>
          </h1>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.length > 0 ? (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                channelTitle={video.snippet.channelTitle}
                title={video.snippet.title}
                thumbnail={video.snippet.thumbnails.high.url}
                createdAt={video.snippet.publishedAt}
                views={video.statistics?.viewCount}
                duration={video.contentDetails?.duration}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p>No videos found for &quot;{searchQuery}&quot;.</p>
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    return <SearchError error={error} />;
  }
}
