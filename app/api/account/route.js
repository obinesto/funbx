import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { validateRequest } from "@/lib/authConfig";
import { supabase } from "@/lib/supabaseConfig";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const USER_SCOPED_TABLES = [
  "pwa_subscriptions",
  "video_likes",
  "saved_videos",
  "watch_history",
  "subscriptions",
];

export async function DELETE(request) {
  try {
    const sessionUser = await validateRequest(request);

    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", sessionUser.email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("email", sessionUser.email.toLowerCase());

    if (!userRecord) {
      return NextResponse.json({ success: true });
    }

    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("id, public_id")
      .eq("user_id", userRecord.id);

    if (videosError) {
      throw videosError;
    }

    for (const video of videos || []) {
      if (video.public_id) {
        await cloudinary.uploader.destroy(video.public_id, {
          resource_type: "video",
        });
      }
    }

    for (const table of USER_SCOPED_TABLES) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userRecord.id);

      if (error) {
        throw error;
      }
    }

    const { error: deleteVideosError } = await supabase
      .from("videos")
      .delete()
      .eq("user_id", userRecord.id);

    if (deleteVideosError) {
      throw deleteVideosError;
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userRecord.id);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: error.message || "Unable to delete account" },
      { status: 500 },
    );
  }
}
