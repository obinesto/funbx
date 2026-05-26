import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import authStore from "@/store/authStore";
import * as Sentry from "@sentry/react";
import { handleApiError, shuffleArray } from "@/utils/queryHelpers";
import {
  fetchGuestFeed,
  fetchYouTubeVideosByIds,
} from "@/lib/client/videoRequests";
import {
  deleteVideoAction,
  setSavedVideoAction,
  setSubscriptionAction,
  setVideoLikeAction,
} from "@/lib/server/protectedActions";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 1 week

export const useFeed = (options = {}) => {
  const { isAuthenticated, token, user } = authStore();

  return useQuery({
    queryKey: ["feed", { isAuthenticated }],
    queryFn: async () => {
      try {
        if (isAuthenticated && user?.email && token) {
          // Fetch user's watch history and likes
          const [historyResponse, likesResponse] = await Promise.all([
            fetch(`/api/history?email=${encodeURIComponent(user.email)}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }).catch(() => null), // Prevent Promise.all from rejecting if one fails
            fetch(`/api/likes?email=${encodeURIComponent(user.email)}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }).catch(() => null),
          ]);

          const historyData = historyResponse?.ok
            ? await historyResponse.json()
            : null;
          const likesData = likesResponse?.ok
            ? await likesResponse.json()
            : null;

          // Combine, sort and get seed videoIds whose titles are going to be passed as query to search endpoint
          const combinedInteractions = [
            ...(historyData?.watchHistory || []),
            ...(likesData?.likes || []),
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          // remove any duplicate videoIds, truncate and then join them
          if (combinedInteractions.length) {
            const seedVideoIds = [...new Set(combinedInteractions)];
            let newSeedVideoIds = seedVideoIds.slice(0, 10);
            newSeedVideoIds = newSeedVideoIds
              .map((item) => item.video_id)
              .join(",");
            const { data: videos } = await axios.get("/api/youtube/videos", {
              params: {
                part: "snippet",
                id: newSeedVideoIds,
              },
            });

            // Get video titles to use as search seeds
            const seedVideos = videos.items;

            if (seedVideos.length) {
              Sentry.addBreadcrumb({
                category: "feed",
                message:
                  "Fetching personalized feed based on recent interactions",
                level: "info",
              });

              // Search for each seed video's related content
              const searchPromises = seedVideos.map(
                (video) =>
                  axios
                    .get("/api/youtube/search", {
                      params: {
                        part: "snippet",
                        type: "video",
                        q: video.snippet.title,
                        maxResults: 50,
                        order: "date",
                        videoCategoryId: video.snippet.categoryId,
                        relevanceLanguage: "en",
                        safeSearch: "moderate",
                        videoEmbeddable: true,
                      },
                    })
                    .catch(() => ({ data: { items: [] } })), // Handle individual search failures gracefully
              );

              const searchResults = await Promise.all(searchPromises);

              // Combine all results and remove duplicates
              const allSearchItems = searchResults.flatMap(
                (result) => result.data.items || [],
              );
              const uniqueVideoIds = [
                ...new Set(allSearchItems.map((item) => item.id.videoId)),
              ];

              if (uniqueVideoIds.length > 0) {
                Sentry.addBreadcrumb({
                  category: "videos",
                  message: "Fetching detailed video information",
                  level: "info",
                });

                const detailsItems = await fetchYouTubeVideosByIds(uniqueVideoIds);
                // combine feed source for a more unique feed page
                let combinedFeed = [
                  ...(await fetchGuestFeed()),
                  ...detailsItems,
                ];

                // remove duplicate videos
                const uniqueFeed = [
                  ...new Map(
                    combinedFeed.map((video) => [video.id, video]),
                  ).values(),
                ];

                const randomizedFeed = shuffleArray(uniqueFeed);
                return randomizedFeed.splice(0, 50);
              }
            }
          }
        }
        // Guest user logic (or fallback for authenticated users)
        return await fetchGuestFeed();
      } catch (error) {
        handleApiError(error);
      }
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
    ...options,
  });
};

export const useSearchVideos = (query) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query) return [];
      try {
        Sentry.addBreadcrumb({
          category: "search",
          message: `Searching for: "${query}"`,
          level: "info",
        });
        const { data } = await axios.get("/api/search", {
          params: {
            q: query,
          },
        });
        return data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },
    enabled: Boolean(query),
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("quota exceeded"),
  });
};

export const useVideoDetails = (videoId, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      if (!videoId) throw new Error("Video ID is required");

      try {
        Sentry.addBreadcrumb({
          category: "video",
          message: "Fetching video details",
          level: "info",
        });
        const response = await axios.get("/api/youtube/videos", {
          params: {
            part: "snippet,statistics,contentDetails",
            id: videoId,
          },
        });

        if (!response.data?.items?.length) {
          throw new Error("Video not found");
        }

        const items = response.data.items;
        // Cache individual video data for future use
        if (videoId.includes(",")) {
          items.forEach((item) => {
            queryClient.setQueryData(["video", item.id], item);
          });
          return items;
        }

        return items[0];
      } catch (error) {
        handleApiError(error);
      }
    },
    enabled: Boolean(videoId && options.enabled !== false),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

export const useRelatedVideos = (videoId, videoTitle) => {
  return useQuery({
    queryKey: ["relatedVideos", videoId],
    queryFn: async () => {
      if (!videoTitle) {
        throw new Error("Video title is required to fetch related videos");
      }

      try {
        Sentry.addBreadcrumb({
          category: "related-videos",
          message: "Fetching related videos",
          level: "info",
        });
        const response = await axios.get("/api/youtube/search", {
          params: {
            part: "snippet",
            type: "video",
            safeSearch: "moderate",
            videoEmbeddable: true,
            videoSyndicated: true,
            maxResults: 10,
            q: videoTitle,
          },
        });

        if (!response.data?.items?.length) {
          throw new Error("No related videos found");
        }

        return response.data.items.filter(
          (item) => item.id.videoId !== videoId,
        );
      } catch (error) {
        handleApiError(error);
      }
    },
    enabled: Boolean(videoId && videoTitle),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

export const useAddToHistory = () => {
  const queryClient = useQueryClient();
  const { token, user } = authStore();

  return useMutation({
    mutationFn: async ({ videoId }) => {
      try {
        Sentry.addBreadcrumb({
          category: "history",
          message: "Adding to watch history",
          level: "info",
        });
        const response = await fetch(`/api/history`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId,
            email: user.email,
            action: "add",
          }),
        });
        if (!response.ok) throw new Error("Failed to add to history");
        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchHistory"]);
    },
  });
};

export const useVideoLikeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      try {
        Sentry.addBreadcrumb({
          category: "likes",
          message: `${action} video like`,
          level: "info",
        });

        return setVideoLikeAction(videoId, action);
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["likedVideos"] });
      queryClient.invalidateQueries({
        queryKey: ["videoLikeStatus", variables.videoId],
      });
    },
    onError: handleApiError,
  });
};

export const useIsVideoLiked = (videoId) => {
  const { isAuthenticated, token, user } = authStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["videoLikeStatus", videoId],
    queryFn: async () => {
      try {
        // First check if we have the data in the likedVideos query cache
        const likedVideosCache = queryClient.getQueryData(["likedVideos"]);
        if (likedVideosCache) {
          const isLiked = likedVideosCache.some(
            (video) => video.id === videoId,
          );
          return isLiked;
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "likedVideo",
          message: "Fetching liked video",
          level: "info",
        });

        const response = await fetch(
          `/api/likes?videoId=${videoId}&email=${encodeURIComponent(
            user.email,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!response.ok) {
          console.error(
            `Failed to fetch like status for video ${videoId}: ${response.statusText}`,
          );
          throw new Error(
            `Failed to fetch like status: ${response.statusText}`,
          );
        }
        const data = await response.json();
        return data.isLiked ?? false;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch like status", error);
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && videoId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSavedVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      try {
        Sentry.addBreadcrumb({
          category: "saved-videos",
          message: `${action} saved video`,
          level: "info",
        });

        return setSavedVideoAction(videoId, action);
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
      queryClient.invalidateQueries({
        queryKey: ["savedVideoStatus", variables.videoId],
      });
    },
    onError: handleApiError,
  });
};

export const useIsInSavedVideos = (videoId) => {
  const { isAuthenticated, token, user } = authStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["savedVideoStatus", videoId],
    queryFn: async () => {
      try {
        // First check if we have the data in the saved videos query cache
        const savedVideosCache = queryClient.getQueryData(["savedVideos"]);

        if (savedVideosCache) {
          const isInSavedVideos = savedVideosCache.some(
            (video) => video.id === videoId,
          );
          return isInSavedVideos;
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "saved-video",
          message: "Fetching saved video status",
          level: "info",
        });

        const response = await fetch(
          `/api/saved-videos?videoId=${videoId}&email=${encodeURIComponent(
            user.email,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!response.ok) throw new Error("Failed to fetch saved video status");
        const data = await response.json();
        return data.isInSavedVideos ?? false;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch saved video status", error);
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && videoId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useVideoMutation = () => {
  const queryClient = useQueryClient();
  const { token, user } = authStore();

  return useMutation({
    mutationFn: async ({ type, videoId, data }) => {
      try {
        if (!token || !user?.email) {
          throw new Error("You must be signed in to manage videos");
        }

        Sentry.addBreadcrumb({
          category: "user-videos",
          message: `${type} video operation`,
          level: "info",
        });

        if (type === "create") {
          const response = await fetch("/api/videos", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data,
          });

          if (!response.ok) throw new Error(`Failed to ${type} video`);
          return response.json();
        } else if (type === "delete") {
          return deleteVideoAction(videoId);
        } else {
          throw new Error("Unsupported video operation");
        }
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userVideos"] });
    },
  });
};

export const useSubscribeMutation = () => {
  const queryClient = useQueryClient();
  const { user } = authStore();

  return useMutation({
    mutationFn: async ({ channelId, action, channelTitle }) => {
      try {
        if (!user?.email) {
          throw new Error("User email required");
        }

        Sentry.addBreadcrumb({
          category: "subscriptions",
          message: `${action} subscription`,
          level: "info",
        });

        return setSubscriptionAction(channelId, channelTitle, action);
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: handleApiError,
  });
};

export const useIsSubscribed = (channelId) => {
  const { isAuthenticated, token, user } = authStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["isSubscribed", channelId],
    queryFn: async () => {
      try {
        // First check if we have the data in the subscriptions query cache
        const subscriptionsCache = queryClient.getQueryData(["subscriptions"]);
        if (subscriptionsCache) {
          const channelSubscription = subscriptionsCache.find(
            (sub) => sub.channel_id === channelId,
          );
          if (channelSubscription) {
            return channelSubscription.is_subscribed;
          }
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "subscriptions",
          message: "Checking subscription status",
          level: "info",
        });
        const response = await fetch(
          `/api/subscriptions?channelId=${channelId}&email=${encodeURIComponent(
            user.email,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!response.ok)
          throw new Error("Failed to check subscription status");
        const data = await response.json();
        return data.isSubscribed ?? false;
      } catch (error) {
        handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && channelId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
