import "server-only";

import { fetchYouTube } from "@/lib/server/youtube";
import { getCurrentUserRecord } from "@/lib/server/userRecord";
import { supabase } from "@/lib/supabaseConfig";

const toHttpsUrl = (url) =>
  typeof url === "string" ? url.replace(/^http:\/\//, "https://") : url;

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function normalizeUserVideo(video, user) {
  return {
    ...video,
    id: video.id,
    videoId: video.id,
    title: video.title,
    thumbnail: toHttpsUrl(video.thumbnail_url),
    channelTitle: user?.name || user?.email || "Your channel",
    createdAt: video.created_at,
    videoUrl: video.video_url,
    isUserVideo: true,
  };
}

const requireUserRecord = () => getCurrentUserRecord("id, email, username");

async function getYouTubeVideoDetails(videoIds) {
  if (!videoIds.length) {
    return [];
  }

  const data = await fetchYouTube(
    "videos",
    {
      part: "snippet,statistics,contentDetails",
      id: videoIds.join(","),
    },
    {
      revalidate: 300,
      tags: ["youtube-protected"],
    },
  );

  return data?.items || [];
}

async function getUploadedVideos(videoIds, user) {
  if (!videoIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .in("id", videoIds);

  if (error) {
    throw error;
  }

  return (data || []).map((video) => normalizeUserVideo(video, user));
}

async function hydrateInteractionVideos(rows, dateField, context) {
  if (!context?.record) {
    return [];
  }

  const youtubeRows = rows.filter((row) => !isUuid(row.video_id));
  const uploadedRows = rows.filter((row) => isUuid(row.video_id));
  const youtubeIds = youtubeRows.map((row) => row.video_id).filter(Boolean);
  const uploadedIds = uploadedRows.map((row) => row.video_id).filter(Boolean);

  const [youtubeVideos, uploadedVideos] = await Promise.all([
    getYouTubeVideoDetails(youtubeIds),
    getUploadedVideos(uploadedIds, context.auth),
  ]);

  const byId = new Map([
    ...youtubeVideos.map((video) => [video.id, video]),
    ...uploadedVideos.map((video) => [video.id, video]),
  ]);

  return rows
    .map((row) => {
      const video = byId.get(row.video_id);
      return video ? { ...video, [dateField]: row.created_at } : null;
    })
    .filter(Boolean);
}

export async function getServerWatchHistory() {
  const context = await requireUserRecord();

  if (!context?.record) {
    return [];
  }

  const { data, error } = await supabase
    .from("watch_history")
    .select("video_id, created_at")
    .eq("user_id", context.record.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateInteractionVideos(data || [], "watchedAt", context);
}

export async function getServerLikedVideos() {
  const context = await requireUserRecord();

  if (!context?.record) {
    return [];
  }

  const { data, error } = await supabase
    .from("video_likes")
    .select("video_id, created_at")
    .eq("user_id", context.record.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateInteractionVideos(data || [], "likedAt", context);
}

export async function getServerSavedVideos() {
  const context = await requireUserRecord();

  if (!context?.record) {
    return [];
  }

  const { data, error } = await supabase
    .from("saved_videos")
    .select("video_id, created_at")
    .eq("user_id", context.record.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateInteractionVideos(data || [], "savedAt", context);
}

export async function getServerUserVideos() {
  const context = await requireUserRecord();

  if (!context?.record) {
    return [];
  }

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", context.record.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((video) => normalizeUserVideo(video, context.auth));
}

export async function getServerSubscriptions() {
  const context = await requireUserRecord();

  if (!context?.record) {
    return [];
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", context.record.id);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getServerChannelInfo(subscriptions) {
  if (!subscriptions?.length) {
    return [];
  }

  const uniqueChannelIds = [
    ...new Set(subscriptions.map((sub) => sub.channel_id).filter(Boolean)),
  ];

  const channels = await Promise.all(
    uniqueChannelIds.map(async (channelId) => {
      try {
        const [channelResponse, videosResponse] = await Promise.all([
          fetchYouTube(
            "channels",
            {
              part: "snippet,statistics",
              id: channelId,
            },
            { revalidate: 300, tags: ["youtube-subscriptions"] },
          ),
          fetchYouTube(
            "search",
            {
              part: "snippet",
              channelId,
              order: "date",
              type: "video",
              maxResults: "12",
            },
            { revalidate: 300, tags: ["youtube-subscriptions"] },
          ),
        ]);

        const videoIds =
          videosResponse?.items
            ?.map((item) => item.id.videoId)
            .filter(Boolean) || [];
        const videoDetails = await getYouTubeVideoDetails(videoIds);

        return {
          channelInfo: {
            channel_id: channelId,
            channel_title: channelResponse?.items?.[0]?.snippet?.title,
            snippet: channelResponse?.items?.[0]?.snippet,
            statistics: channelResponse?.items?.[0]?.statistics,
          },
          videos: videoDetails,
        };
      } catch (error) {
        console.error(`Error fetching channel data for ${channelId}:`, error);
        return null;
      }
    }),
  );

  return channels.filter(Boolean);
}
