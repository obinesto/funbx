import { useCallback } from "react";
import { useRouter } from "next/navigation";
import authStore from "@/store/authStore";

import {
  useVideoLikeMutation,
  useSavedVideoMutation,
  useSubscribeMutation,
  useIsVideoLiked,
  useIsInSavedVideos,
  useIsSubscribed,
} from "./useQueries";

export function useProtectedFeatures(videoId, channelId, channelTitle) {
  const router = useRouter();
  const { isAuthenticated, user, token } = authStore();
  const userEmail = user?.email;

  const likeMutation = useVideoLikeMutation();
  const savedVideoMutation = useSavedVideoMutation();
  const subscribeMutation = useSubscribeMutation();

  const { data: isLikedData, isLoading: isLoadingLikeStatus } =
    useIsVideoLiked(videoId);
  const { data: isInSavedVideosData, isLoading: isLoadingSavedVideoStatus } =
    useIsInSavedVideos(videoId);
  const { data: isSubscribedData, isLoading: isLoadingSubscriptionStatus } =
    useIsSubscribed(channelId);

  // Action Handlers
  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for like operation");
      return;
    }

    try {
      await likeMutation.mutateAsync({
        videoId,
        action: isLikedData ? "unlike" : "like",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error liking/unliking video:", error);
      throw new Error("Failed to update like status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    isLikedData,
    likeMutation,
    router,
    userEmail,
    token,
  ]);

  const handleSavedVideo = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for saved video operation");
      return;
    }

    try {
      await savedVideoMutation.mutateAsync({
        videoId,
        action: isInSavedVideosData ? "remove" : "add",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error adding/removing to saved videos:", error);
      throw new Error("Failed to update saved video status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    isInSavedVideosData,
    savedVideoMutation,
    router,
    userEmail,
    token,
  ]);

  const handleSubscribe = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !channelId || !channelTitle) {
      console.error("Missing required data for subscribe operation");
      return;
    }

    try {
      await subscribeMutation.mutateAsync({
        channelId,
        channelTitle,
        action: isSubscribedData ? "remove" : "add",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error subscribing/unsubscribing:", error);
      throw new Error("Failed to update subscription status. Try again later.");
    }
  }, [
    isAuthenticated,
    channelId,
    channelTitle,
    isSubscribedData,
    subscribeMutation,
    router,
    userEmail,
    token,
  ]);

  return {
    handleLike,
    handleSavedVideo,
    handleSubscribe,

    isLiked: isLikedData ?? false,
    isSaved: isInSavedVideosData ?? false,
    isSubscribed: isSubscribedData ?? false,
    isLoadingLike: likeMutation.isLoading || isLoadingLikeStatus,
    isLoadingSavedVideo:
      savedVideoMutation.isLoading || isLoadingSavedVideoStatus,
    isLoadingSubscriptions:
      subscribeMutation.isLoading || isLoadingSubscriptionStatus,
  };
}

export function useVideoActions(videoId) {
  const router = useRouter();
  const { isAuthenticated, user, token } = authStore();
  const userEmail = user?.email;

  const likeMutation = useVideoLikeMutation();
  const savedVideoMutation = useSavedVideoMutation();

  const handleLike = useCallback(async (nextLiked) => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for like operation");
      return;
    }

    try {
      await likeMutation.mutateAsync({
        videoId,
        action: nextLiked ? "like" : "unlike",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error liking/unliking video:", error);
      throw new Error("Failed to update like status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    likeMutation,
    router,
    userEmail,
    token,
  ]);

  const handleSavedVideo = useCallback(async (nextSaved) => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for saved video operation");
      return;
    }

    try {
      await savedVideoMutation.mutateAsync({
        videoId,
        action: nextSaved ? "add" : "remove",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error adding/removing to saved videos:", error);
      throw new Error("Failed to update saved video status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    savedVideoMutation,
    router,
    userEmail,
    token,
  ]);

  return {
    handleLike,
    handleSavedVideo,
    isLoadingLike: likeMutation.isLoading,
    isLoadingSavedVideo: savedVideoMutation.isLoading,
  };
}
