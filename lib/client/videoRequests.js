import axios from "axios";
import * as Sentry from "@sentry/react";

const YOUTUBE_VIDEO_PARTS = "snippet,statistics,contentDetails";
const YOUTUBE_CHUNK_SIZE = 50;

export async function fetchYouTubeVideosByIds(
  videoIds,
  part = YOUTUBE_VIDEO_PARTS,
) {
  const allVideoDetails = [];

  for (let i = 0; i < videoIds.length; i += YOUTUBE_CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + YOUTUBE_CHUNK_SIZE).filter(Boolean);

    if (!chunk.length) {
      continue;
    }

    try {
      const response = await axios.get("/api/youtube/videos", {
        params: {
          part,
          id: chunk.join(","),
        },
      });

      if (response.data?.items) {
        allVideoDetails.push(...response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch a chunk of video details:", error);
    }
  }

  return allVideoDetails;
}

export async function fetchGuestFeed() {
  Sentry.addBreadcrumb({
    category: "feed",
    message: "Fetching popular feed for guest/fallback",
    level: "info",
  });

  const response = await axios.get("/api/youtube/videos", {
    params: {
      part: YOUTUBE_VIDEO_PARTS,
      chart: "mostPopular",
      maxResults: 50,
    },
  });

  if (!response.data?.items?.length) {
    throw new Error("No popular videos found.");
  }

  return response.data.items;
}
