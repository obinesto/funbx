"use client";
import { useState } from "react";
import VideoCard from "@/components/global/VideoCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { getVideoCardProps } from "@/utils/videoCard";

export default function LikedVideosPage({
  initialVideos = [],
  serverLoadError,
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [sortBy, setSortBy] = useState("recent"); // recent, oldest, popular

  const validVideos = (videos || [])
    .map(getVideoCardProps)
    .filter(Boolean);

  const sortedVideos = [...validVideos].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.likedAt) - new Date(a.likedAt);
      case "oldest":
        return new Date(a.likedAt) - new Date(b.likedAt);
      case "popular":
        return (parseInt(b.views || 0) || 0) - (parseInt(a.views || 0) || 0);
      default:
        return 0;
    }
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Liked Videos
        </h1>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {serverLoadError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-center">
              Error loading liked videos. Please try again later.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      {serverLoadError ? null : !validVideos.length ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">No liked videos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              {...video}
              onLikeChange={(nextLiked) => {
                if (!nextLiked) {
                  setVideos((currentVideos) =>
                    currentVideos.filter(
                      (item) => getVideoCardProps(item)?.videoId !== video.videoId,
                    ),
                  );
                }
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
