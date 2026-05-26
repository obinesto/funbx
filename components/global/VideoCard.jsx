"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import { formatDate, formatDuration } from "@/utils/dateFormat";
import { useEffect, useRef, useState } from "react";
import { ThumbsUp, Bookmark, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { PiShareFatBold } from "react-icons/pi";
import authStore from "@/store/authStore";
import { useVideoActions } from "@/hooks/useProtectedFeatures";
import { useVideoMutation } from "@/hooks/useQueries";
import usePlayerStore from "@/store/playerStore";
import DeleteVideoDialog from "@/components/global/DeleteVideoDialog";

const VideoCard = ({
  videoId,
  title,
  thumbnail,
  channelTitle,
  createdAt,
  views,
  duration,
  watchedAt,
  savedAt,
  likedAt,
  isOwner,
  isUserVideo,
  videoUrl,
  onLikeChange,
  onSavedChange,
  onDeleted,
}) => {
  const { isAuthenticated } = authStore();
  const videoMutation = useVideoMutation();
  const { activePlayerId, setActivePlayer, clearActivePlayer } =
    usePlayerStore();
  const videoRef = useRef(null);
  const cardElementRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [updateLike, setUpdateLike] = useState(Boolean(likedAt));
  const [updateSavedVideo, setUpdateSavedVideo] = useState(Boolean(savedAt));
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    handleLike,
    handleSavedVideo,
    isLoadingLike,
    isLoadingSavedVideo,
  } = useVideoActions(videoId);

  const formattedDate = formatDate(createdAt);
  const formattedDuration = formatDuration(duration);
  const formattedViews = views ? parseInt(views).toLocaleString() : null;

  useEffect(() => {
    // Determine if it's a small screeen on mount and on window resize
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Breakpoint for "small screen"
    };

    if (typeof window !== "undefined") {
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  // Effect to set isHovered on small screens based on scroll position
  useEffect(() => {
    const element = cardElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isWithinActivationZone =
        rect.top < viewportHeight * 0.5 &&
        rect.bottom > 0 &&
        rect.top < viewportHeight;

      if (isSmallScreen) {
        // Only update if the state needs to change
        setIsHovered((currentIsHovered) => {
          if (isWithinActivationZone && !currentIsHovered) return true;
          if (!isWithinActivationZone && currentIsHovered) return false;
          return currentIsHovered;
        });
      } else {
        setIsHovered(false);
      }
    };

    if (typeof window !== "undefined") {
      handleScroll();
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        // Ensure isHovered is false when cleaning up if it was set by this effect
        if (isSmallScreen) setIsHovered(false);
      };
    }
  }, [isSmallScreen, videoId]);

  // Effect to manage which video is the active player in the global store
  useEffect(() => {
    if (isHovered) {
      setActivePlayer(videoId);
    } else {
      if (usePlayerStore.getState().activePlayerId === videoId) {
        clearActivePlayer(videoId);
      }
    }
  }, [isHovered, videoId, setActivePlayer, clearActivePlayer]);

  // Effect to handle cleanup when the component unmounts or its videoId prop changes.
  useEffect(() => {
    const currentVideoId = videoId;
    return () => {
      if (usePlayerStore.getState().activePlayerId === currentVideoId) {
        clearActivePlayer(currentVideoId);
      }
    };
  }, [videoId, clearActivePlayer]);

  // Effect to handle actual video playback based on local hover state and global active player
  useEffect(() => {
    const playerElement = videoRef.current;
    if (!playerElement) return;

    // Play only if this card is locally hovered/intersected AND it's the globally active one
    const canPlay = isHovered && activePlayerId === videoId;

    if (isUserVideo) {
      if (canPlay) {
        playerElement.play().catch(() => {});
      } else {
        playerElement.pause();
        playerElement.currentTime = 0;
      }
    } else if (canPlay) {
      playerElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
    } else {
      playerElement.src = ""; // Stop playback
    }

    // Cleanup function to stop the video if conditions change or component unmounts
    return () => {
      if (playerElement && !isUserVideo) {
        playerElement.src = "";
      }
    };
  }, [isHovered, videoId, activePlayerId, isUserVideo]);

  const shouldShowVideo = isHovered && activePlayerId === videoId;

  const channelTittleFormatter = () => {
    const formattedChannelTittle = (channelTitle || "user").replaceAll(" ", "%20");
    return formattedChannelTittle;
  };

  const handleDelete = async () => {
    try {
      await videoMutation.mutateAsync({ type: "delete", videoId });
      toast("Video deleted");
      onDeleted?.();
      setIsDeleteOpen(false);
    } catch (error) {
      toast(error.message || "Failed to delete video");
    }
  };

  return (
    <>
    <Link
      href={`/video/${videoId}/${channelTittleFormatter()}`}
      ref={cardElementRef}
      id={`video-card-${videoId}`}
      className="block h-full transition-transform hover:scale-[1.02] duration-200"
      onMouseEnter={!isSmallScreen ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isSmallScreen ? () => setIsHovered(false) : undefined}
    >
      <Card className="relative grid h-full min-h-[340px] grid-rows-[auto_1fr] overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video shrink-0">
          {shouldShowVideo && isUserVideo ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute left-0 top-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              title={`Video preview: ${title || "Video"}`}
            />
          ) : shouldShowVideo ? (
            <iframe
              ref={videoRef}
              className="w-full h-full absolute top-0 left-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={`Video preview: ${title || "Video"}`}
              allowFullScreen
            />
          ) : (
            <Image
              src={thumbnail || "/placeholder.svg"}
              alt={title || "Video thumbnail"}
              className="object-cover"
              loading="lazy"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          {formattedDuration && !shouldShowVideo && (
            <div className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
              {formattedDuration}
            </div>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 h-auto w-auto rounded-full z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    /* handleEdit logic */
                    toast("Edit action triggered (implement me!)");
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardContent className="grid min-h-0 grid-rows-[1fr_auto] p-4">
          <div className="min-h-0">
            <h3 className="min-h-12 text-base font-semibold leading-6 line-clamp-2 hover:text-customRed">
              {title}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {channelTitle}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {formattedViews && <span>{formattedViews} views</span>}
              {formattedViews && formattedDate && <span>•</span>}
              {formattedDate && (
                <span className="line-clamp-1">{formattedDate}</span>
              )}
            </div>
            {watchedAt && (
              <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                Watched {formatDate(watchedAt)}
              </span>
            )}
            {savedAt && (
              <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                Saved {formatDate(savedAt)}
              </span>
            )}
            {likedAt && (
              <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                Liked {formatDate(likedAt)}
              </span>
            )}
          </div>

          {/* Video actions */}
          <div
            className={
              isAuthenticated
                ? "flex items-center justify-between pt-3"
                : "flex items-center justify-end pt-3"
            }
          >
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hover:text-customRed ${
                    updateLike ? "text-customRed" : ""
                  }`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nextLiked = !updateLike;
                    setUpdateLike(nextLiked);

                    try {
                      await handleLike(nextLiked);
                      onLikeChange?.(nextLiked);
                    } catch (error) {
                      toast(error.message);
                      setUpdateLike((prev) => !prev);
                    }
                  }}
                  disabled={isLoadingLike}
                >
                  {isLoadingLike ? null : (
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        updateLike ? "fill-customRed" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hover:text-customRed ${
                    updateSavedVideo ? "text-customRed" : ""
                  }`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nextSaved = !updateSavedVideo;
                    setUpdateSavedVideo(nextSaved);
                    try {
                      await handleSavedVideo(nextSaved);
                      onSavedChange?.(nextSaved);
                    } catch (error) {
                      console.error(
                        "Error updating saved video status:",
                        error
                      );
                      toast(
                        error.message || "Failed to update saved video status."
                      );
                      setUpdateSavedVideo((prev) => !prev);
                    }
                  }}
                  disabled={isLoadingSavedVideo}
                >
                  {isLoadingSavedVideo ? null : (
                    <Bookmark
                      className={`h-4 w-4 ${
                        updateSavedVideo ? "fill-customRed" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-customRed"
                  disabled={isLoadingSavedVideo || isLoadingLike}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `${window.location.origin}/video/${videoId}/${channelTittleFormatter()}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  {isLoadingSavedVideo || isLoadingLike ? null : (
                    <>
                      <PiShareFatBold className="h-4 w-4" />
                    </>
                  )}
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
                      `${window.location.origin}/video/${videoId}/${channelTittleFormatter()}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  <Card className="flex items-center gap-2 py-1 px-2 rounded-full">
                    <span>share</span>
                    <PiShareFatBold className="h-4 w-4" />
                  </Card>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
    <DeleteVideoDialog
      open={isDeleteOpen}
      onOpenChange={setIsDeleteOpen}
      onConfirm={handleDelete}
      isLoading={videoMutation.isPending}
    />
    </>
  );
};

export default VideoCard;
