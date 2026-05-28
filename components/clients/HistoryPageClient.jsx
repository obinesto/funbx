"use client";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import VideoCard from "@/components/global/VideoCard";
import { AlertTriangle } from "lucide-react";
import { getVideoCardProps } from "@/utils/videoCard";
import { clearWatchHistoryAction } from "@/lib/server/protectedActions";

export default function HistoryPage({
  initialWatchHistory = [],
  serverLoadError,
}) {
  const [watchHistory, setWatchHistory] = useState(initialWatchHistory);
  const [error, setError] = useState(
    serverLoadError ? new Error(serverLoadError) : null,
  );
  const [isPending, startTransition] = useTransition();

  const handleClearHistory = () => {
    startTransition(async () => {
      try {
        await clearWatchHistoryAction();
        setWatchHistory([]);
      } catch (error) {
        console.error("Failed to clear history:", error);
        setError(error);
      }
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Watch History</h1>
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-center">
              {error?.message && error?.message.includes("quota") ? (
                <>
                  <p>⛔ YouTube API quota exhausted.</p>
                  <p>
                    Kindly come back in the next 24 hours when it will be reset.
                    Thanks for your patience!🙏
                  </p>
                </>
              ) : (
                "Error loading watch history. Please try again later"
              )}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const videos = (watchHistory || [])
    .map(getVideoCardProps)
    .filter(Boolean);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Watch History
        </h1>
        {videos.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleClearHistory}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear History
          </Button>
        )}
      </div>

      {!videos.length ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No watch history</h2>
          <p className="text-muted-foreground">
            Videos you watch will appear here
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.videoId} {...video} />
          ))}
        </div>
      )}
    </section>
  );
}
