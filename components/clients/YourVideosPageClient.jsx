"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Upload } from "lucide-react";
import LoadingProtected from "@/components/global/LoadingProtected";
import VideoCard from "@/components/global/VideoCard";
import authStore from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function YourVideosPage({
  initialUserVideos,
  serverLoadError,
}) {
  const router = useRouter();
  const { loading: authLoading } = authStore();
  const [userVideos, setUserVideos] = useState(initialUserVideos || []);
  const showLoading = authLoading;

  if (showLoading) return <LoadingProtected />;

  if (serverLoadError) {
    return (
      <div className="p-4">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed mb-6">
          Your Videos
        </h1>
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-center">
              Error loading your videos. Please try again later.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="min-h-full space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Your Videos
        </h1>
        <Button
          onClick={() => router.push("/studio/upload")}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Video
        </Button>
      </div>

      {!userVideos?.length ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No videos uploaded</h2>
          <p className="text-muted-foreground mb-4">
            Share your content with the world
          </p>
          <Button
            onClick={() => router.push("/studio/upload")}
            className="flex items-center gap-2 mx-auto"
          >
            <Upload className="h-4 w-4" />
            Upload Your First Video
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {userVideos.map((video) => (
            <VideoCard
              key={video.id}
              {...video}
              isOwner={true}
              onDeleted={() => {
                setUserVideos((currentVideos) =>
                  currentVideos.filter((item) => item.id !== video.id),
                );
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
