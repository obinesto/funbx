"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireUserRecord() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser?.email) {
    throw new Error("Unauthorized");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", sessionUser.email)
    .single();

  if (error) {
    throw error;
  }

  return user;
}

export async function setVideoLikeAction(videoId, action) {
  const user = await requireUserRecord();

  if (!videoId || !["like", "unlike"].includes(action)) {
    throw new Error("Invalid like operation");
  }

  if (action === "like") {
    const { error } = await supabase.from("video_likes").insert([
      {
        user_id: user.id,
        video_id: videoId,
      },
    ]);

    if (error && error.code !== "23505") {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("video_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);

    if (error) {
      throw error;
    }
  }

  revalidatePath("/liked-videos");
  return { success: true };
}

export async function setSavedVideoAction(videoId, action) {
  const user = await requireUserRecord();

  if (!videoId || !["add", "remove"].includes(action)) {
    throw new Error("Invalid saved video operation");
  }

  if (action === "add") {
    const { error } = await supabase.from("saved_videos").insert([
      {
        user_id: user.id,
        video_id: videoId,
      },
    ]);

    if (error && error.code !== "23505") {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("saved_videos")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);

    if (error) {
      throw error;
    }
  }

  revalidatePath("/saved-videos");
  return { success: true };
}

export async function setSubscriptionAction(channelId, channelTitle, action) {
  const user = await requireUserRecord();

  if (!channelId || !["add", "remove"].includes(action)) {
    throw new Error("Invalid subscription operation");
  }

  if (action === "add") {
    if (!channelTitle) {
      throw new Error("Channel title is required");
    }

    const { error } = await supabase.from("subscriptions").insert([
      {
        user_id: user.id,
        channel_id: channelId,
        channel_title: channelTitle,
      },
    ]);

    if (error && error.code !== "23505") {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("channel_id", channelId);

    if (error) {
      throw error;
    }
  }

  revalidatePath("/subscriptions");
  return { success: true };
}

export async function clearWatchHistoryAction() {
  const user = await requireUserRecord();

  const { error } = await supabase
    .from("watch_history")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/history");
  return { success: true };
}

export async function deleteVideoAction(videoId) {
  const user = await requireUserRecord();

  if (!videoId) {
    throw new Error("Video ID is required");
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (videoError) {
    throw videoError;
  }

  if (video.public_id) {
    await cloudinary.uploader.destroy(video.public_id, {
      resource_type: "video",
    });
  }

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", video.id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/your-videos");
  return { success: true };
}
