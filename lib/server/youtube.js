import "server-only";

import { supabase } from "../supabaseConfig";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const DEFAULT_REVALIDATE = 300;
const TRENDING_REGIONS = ["NG", "US", "GB", "IN", "BR", "DE", "AU", "JP"];


function getApiKeys() {
  return [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY2,
    process.env.YOUTUBE_API_KEY3,
  ].filter(Boolean);
}

export async function fetchYouTube(
  resourceType,
  params,
  { revalidate = DEFAULT_REVALIDATE, tags = ["youtube"] } = {},
) {
  const apiKeys = getApiKeys();

  if (!apiKeys.length) {
    throw new Error("No YouTube API keys are configured.");
  }

  for (const [index, apiKey] of apiKeys.entries()) {
    const searchParams = new URLSearchParams({
      ...params,
      key: apiKey,
    });

    const response = await fetch(
      `${YOUTUBE_API_URL}/${resourceType}?${searchParams.toString()}`,
      {
        next: {
          revalidate,
          tags,
        },
      },
    );
    const data = await response.json();

    if (response.ok) {
      return data;
    }

    const isQuotaError =
      response.status === 403 && data?.error?.message?.includes("quota");

    if (!isQuotaError || index === apiKeys.length - 1) {
      throw new Error(
        data?.error?.message || `Failed to fetch ${resourceType} from YouTube`,
      );
    }
  }

  return null;
}

export async function getPopularVideos({
  maxResults = "50",
  regionCode = "US",
  revalidate = DEFAULT_REVALIDATE,
  tags = ["youtube-feed"],
} = {}) {
  const data = await fetchYouTube(
    "videos",
    {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      maxResults,
      regionCode,
    },
    { revalidate, tags },
  );

  return data?.items || [];
}

export async function getTrendingVideos() {
  const results = await Promise.allSettled(
    TRENDING_REGIONS.map((regionCode) =>
      getPopularVideos({
        maxResults: "10",
        regionCode,
        revalidate: DEFAULT_REVALIDATE,
        tags: ["youtube-trending"],
      }),
    ),
  );

  const videos = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (!videos.length) {
    const firstError = results.find((result) => result.status === "rejected");
    throw new Error(firstError?.reason?.message || "No trending videos found.");
  }

  return [...new Map(videos.map((video) => [video.id, video])).values()].sort(
    (a, b) =>
      Number(b.statistics?.viewCount || 0) -
      Number(a.statistics?.viewCount || 0),
  );
}

async function fetchVideoDetails(videoIds) {
  const chunks = [];
  const chunkSize = 50;

  for (let index = 0; index < videoIds.length; index += chunkSize) {
    chunks.push(videoIds.slice(index, index + chunkSize));
  }

  const results = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchYouTube(
        "videos",
        {
          part: "snippet,statistics,contentDetails",
          id: chunk.join(","),
        },
        {
          revalidate: 3600,
          tags: ["youtube-search"],
        },
      ),
    ),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value?.items || [] : [],
  );
}

export async function getSearchVideos(searchQuery) {
  if (!searchQuery) {
    return [];
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (supabase) {
    const { data: cachedData, error: cacheError } = await supabase
      .from("search_cache")
      .select("results")
      .eq("query", normalizedQuery)
      .single();

    if (cacheError && cacheError.code !== "PGRST116") {
      console.error("Error fetching from search cache:", cacheError);
    }

    if (cachedData?.results) {
      supabase
        .from("search_cache")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("query", normalizedQuery)
        .then();

      return cachedData.results;
    }
  }

  const searchResponse = await fetchYouTube(
    "search",
    {
      part: "snippet",
      q: normalizedQuery,
      type: "video",
      maxResults: "50",
      videoEmbeddable: "true",
    },
    {
      revalidate: 3600,
      tags: ["youtube-search"],
    },
  );

  const videoIds =
    searchResponse?.items?.map((item) => item.id.videoId).filter(Boolean) ||
    [];

  if (!videoIds.length) {
    return [];
  }

  const videoDetails = await fetchVideoDetails(videoIds);

  if (supabase && videoDetails.length) {
    const { error: insertError } = await supabase
      .from("search_cache")
      .insert({ query: normalizedQuery, results: videoDetails });

    if (insertError) {
      console.error("Error saving search cache:", insertError);
    }
  }

  return videoDetails;
}
