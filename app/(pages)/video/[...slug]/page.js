import { cache } from "react";
import VideoPageClient from "@/components/clients/videoPageClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

const toHttpsUrl = (url) =>
  typeof url === "string" ? url.replace(/^http:\/\//, "https://") : url;

const getUploadedVideoThumbnail = (video) => {
  if (video.thumbnail_url) return toHttpsUrl(video.thumbnail_url);
};

const mapUploadedVideo = (video) => ({
  id: video.id,
  isUserVideo: true,
  videoUrl: video.video_url,
  snippet: {
    title: video.title,
    description: video.description || "",
    channelId: video.user_id,
    channelTitle: "User upload",
    publishedAt: video.created_at,
    thumbnails: {
      default: { url: getUploadedVideoThumbnail(video) },
      high: { url: getUploadedVideoThumbnail(video) },
      maxres: { url: getUploadedVideoThumbnail(video) },
    },
  },
  statistics: {
    viewCount: "0",
  },
  contentDetails: {},
});

const getUploadedVideoData = async (videoId) => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .single();

  if (error || !data) return null;
  return mapUploadedVideo(data);
};

// Function to fetch video data on the server
// Function is wrapped in React cache to deduplicate requests
const getVideoData = cache(async (videoId) => {
  if (!videoId) {
    return null;
  }

  if (isUuid(videoId)) {
    const uploadedVideo = await getUploadedVideoData(videoId);
    if (uploadedVideo) return uploadedVideo;
  }

  const apiKeys = [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY2,
    process.env.YOUTUBE_API_KEY3,
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    console.error("No YouTube API keys are set in environment variables.");
    return getUploadedVideoData(videoId);
  }

  // Iterate through the keys, trying each one until a request succeeds.
  for (const [index, apiKey] of apiKeys.entries()) {
    try {
      const params = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: videoId,
        key: apiKey,
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully fetched data with API key #${index + 1}`);
        return data?.items?.[0] || null; // Success!
      }

      // If the response is not OK, log it and try the next key.
      const errorData = await response.json();
      console.warn(
        `API key #${index + 1} failed with status ${response.status}: ${
          errorData?.error?.message
        }. Trying next key...`
      );
    } catch (error) {
      console.warn(
        `Network error with API key #${index + 1}. Trying next key...`,
        error
      );
    }
  }

  // If the loop completes, all keys have failed.
  console.error("All available YouTube API keys failed to fetch data.");
  return getUploadedVideoData(videoId);
});

// Dynamically generate metadata
export async function generateMetadata({ params }) {
  const awaitedParam = await params;
  const [videoId, channelIdentifier] = awaitedParam.slug || [];

  if (!videoId) {
    return { title: "Video Not Found" };
  }

  const videoData = await getVideoData(videoId);

  if (!videoData) {
    return {
      title: "Video Not Found",
      description: "The requested video could not be found.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";
  const pageUrl = `${baseUrl}/video/${videoId}/${
    channelIdentifier || videoData.snippet.channelId
  }`;
  const thumbnailUrl =
    videoData.snippet.thumbnails?.maxres?.url ||
    videoData.snippet.thumbnails?.high?.url ||
    videoData.snippet.thumbnails?.default?.url;

  return {
    title: videoData.snippet.title,
    description: videoData.snippet.description.substring(0, 200),
    creator: videoData.snippet.channelTitle || "Cyprian Obi",
    keywords: [
      videoData.snippet.title,
      videoData.snippet.channelTitle,
      "video",
      "watch",
    ],
    url: pageUrl,
    openGraph: {
      type: "video.other",
      title: videoData.snippet.title,
      description: videoData.snippet.description.substring(0, 200),
      url: pageUrl,
      images: thumbnailUrl
        ? [
            {
              url: thumbnailUrl,
              width: 1280,
              height: 720,
              alt: videoData.snippet.title,
            },
          ]
        : [],
      videos: [
        {
          url: pageUrl,
          secure_url: pageUrl,
          type: "text/html",
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: videoData.snippet.title,
      description: videoData.snippet.description.substring(0, 200),
      creator: "@Mc_Cprian02",
      images: thumbnailUrl ? [thumbnailUrl] : [],
    },
  };
}

// A small component for the error state to keep the main component clean.
function VideoError() {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col md:flex-row items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Error loading video from server. Please try again later.</span>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default async function VideoPage({ params }) {
  const awaitedParam = await params;
  const [videoId, channelTitle] = awaitedParam.slug || [];

  // A videoId is required to fetch data.
  if (!videoId) {
    return <VideoError />;
  }

  const videoData = await getVideoData(videoId);

  // If data fetching fails or the video doesn't exist, show an error.
  // The channelTitle is also required to render the client component.
  if (!videoData || !channelTitle) {
    return <VideoError />;
  }

  return <VideoPageClient videoId={videoId} initialVideoData={videoData} />;
}
