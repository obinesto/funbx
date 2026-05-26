"use client";

import { useState, useEffect } from "react";
import VideoPlayer from "@/components/global/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import authStore from "@/store/authStore";

import {
  Bell,
  ThumbsUp,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Home,
  RefreshCcw,
} from "lucide-react";
import { PiShareFatBold } from "react-icons/pi";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";
import { formatViews, formatDate } from "@/utils/dateFormat";
import RelatedVideos from "@/components/global/RelatedVideos";
import { useVideoDetails } from "@/hooks/useQueries";

export default function VideoPageClient({ videoId, initialVideoData, error }) {
  const { isAuthenticated } = authStore();
  const initialIsUserVideo = Boolean(initialVideoData?.isUserVideo);

  const {
    data: video,
    isError: isVideoErrorHook,
    error: videoErrorHook,
  } = useVideoDetails(videoId, {
    enabled: !initialVideoData && !initialIsUserVideo,
  });

  const channelId = video?.snippet?.channelId;

  const displayVideo = initialVideoData && !error ? initialVideoData : video;
  const isUserVideo = Boolean(displayVideo?.isUserVideo);
  const displayError = error || (!isUserVideo && isVideoErrorHook ? videoErrorHook : null);

  const {
    isLiked,
    isSaved,
    isSubscribed,
    handleLike,
    handleSavedVideo,
    handleSubscribe,
    isLoadingLike,
    isLoadingSavedVideo,
    isLoadingSubscriptions,
  } = useProtectedFeatures(videoId, channelId, displayVideo?.snippet?.channelTitle);

  const [updateLike, setUpdateLike] = useState(false);
  const [updateSavedVideo, setUpdateSavedVideo] = useState(false);
  const [updateSubscription, setUpdateSubscription] = useState(false);
  const [viewDescription, setViewDescription] = useState(false);

  useEffect(() => {
    setUpdateLike(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setUpdateSavedVideo(isSaved);
  }, [isSaved]);

  useEffect(() => {
    setUpdateSubscription(isSubscribed);
  }, [isSubscribed]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  if (displayError) {
    return (
      <Alert
        variant="destructive"
        className="mx-auto max-w-2xl text-center"
      >
        <AlertTitle>Error Loading Video</AlertTitle>
        <AlertDescription>
          {displayError?.message ||
            "Failed to load video. Please try again later."}
        </AlertDescription>
        <div className="flex gap-16 mt-4 items-center justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Page
          </Button>
          <Button
            variant="default"
            className="gap-2"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </div>
      </Alert>
    );
  }

  if (!displayVideo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading video details...
      </div>
    );
  }

  return (
    <section className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <VideoPlayer
            videoId={videoId}
            isUserVideo={isUserVideo}
            videoUrl={displayVideo?.videoUrl}
          />
          <div className="py-4">
            <h1 className="text-2xl font-semibold mb-2">
              {displayVideo?.snippet?.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {displayVideo?.snippet?.channelTitle}
                </span>
              </div>
              <div
                className={`flex items-center ${
                  isAuthenticated ? "justify-between" : ""
                }`}
              >
                {isAuthenticated && (
                  <>
                    {!isUserVideo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={updateSubscription ? "text-customRed" : ""}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUpdateSubscription((prev) => !prev);
                        try {
                          await handleSubscribe();
                        } catch (err) {
                          toast(err.message);
                          setUpdateSubscription((prev) => !prev);
                        }
                      }}
                      disabled={isLoadingSubscriptions}
                    >
                      <Bell
                        className={`h-4 w-4 ${
                          updateSubscription ? "fill-customRed" : ""
                        }`}
                      />
                      <span className="ml-1">
                        {updateSubscription ? "Unsubscribe" : "Subscribe"}
                      </span>
                    </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={updateLike ? "text-customRed" : ""}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUpdateLike((prev) => !prev);
                        try {
                          await handleLike();
                        } catch (err) {
                          toast(err.message);
                          setUpdateLike((prev) => !prev);
                        }
                      }}
                      disabled={isLoadingLike}
                    >
                      <ThumbsUp
                        className={`h-4 w-4 ${
                          updateLike ? "fill-customRed" : ""
                        }`}
                      />
                      <span className="ml-1">
                        {updateLike ? "Liked" : "Like"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={updateSavedVideo ? "text-customRed" : ""}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUpdateSavedVideo((prev) => !prev);
                        try {
                          await handleSavedVideo();
                        } catch (err) {
                          toast(err.message);
                          setUpdateSavedVideo((prev) => !prev);
                        }
                      }}
                      disabled={isLoadingSavedVideo}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          updateSavedVideo ? "fill-customRed" : ""
                        }`}
                      />
                      <span className="ml-1">
                        {updateSavedVideo ? "Saved" : "Save Video"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-customRed"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/video/${videoId}/${channelId}`
                        );
                        toast("Link copied to clipboard");
                      }}
                    >
                      <Card className="flex items-center gap-2 py-1 px-2 rounded-full">
                        <PiShareFatBold className="h-4 w-4" />
                        <span>share</span>
                      </Card>
                    </Button>
                  </>
                )}
                {!isAuthenticated && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-customRed"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/video/${videoId}/${channelId}`
                        );
                        toast("Link copied to clipboard");
                      }}
                    >
                      <Card className="flex items-center gap-2 py-1 px-2 rounded-full">
                        <PiShareFatBold className="h-4 w-4" />
                        <span>share</span>
                      </Card>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {formatViews(displayVideo?.statistics?.viewCount)} views •{" "}
                {formatDate(displayVideo?.snippet?.publishedAt)}
              </p>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center mt-2"
                onClick={() => setViewDescription(!viewDescription)}
              >
                <div className="flex items-center gap-2">
                  {viewDescription ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>
                    {viewDescription ? "Hide Description" : "View Description"}
                  </span>
                </div>
              </Button>
              {viewDescription && (
                <div className="mt-2 p-4 bg-secondary rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {displayVideo?.snippet?.description ||
                      "No description available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {!isUserVideo && (
        <RelatedVideos
          currentVideoId={videoId}
          videoTitle={displayVideo?.snippet?.title}
        />
      )}
    </section>
  );
}
