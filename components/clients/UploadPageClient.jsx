"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileVideo, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useUserStore from "@/hooks/useStore";

const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE_MB = 50;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/x-matroska"];

export default function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, token, loading } = useUserStore();
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");

    if (!file) {
      setVideoFile(null);
      return;
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setVideoFile(null);
      setError("Upload an MP4 or MKV video.");
      return;
    }

    if (file.size > MAX_VIDEO_FILE_SIZE) {
      setVideoFile(null);
      setError(`Keep videos at ${MAX_VIDEO_FILE_SIZE_MB}MB or smaller.`);
      return;
    }

    setVideoFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isAuthenticated || !user?.email || !token) {
      router.push("/auth");
      return;
    }

    if (!videoFile) {
      setError("Choose a video file first.");
      return;
    }

    if (!title.trim()) {
      setError("Add a title before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("videoFile", videoFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim() || "No description provided");
    formData.append("email", user.email);
    formData.append("action", "create");

    setIsUploading(true);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload video");
      }

      await queryClient.invalidateQueries({ queryKey: ["userVideos"] });
      toast("Video uploaded");
      router.push("/your-videos");
    } catch (uploadError) {
      setError(uploadError.message);
      toast(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-customRed" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in before uploading videos to your library.
            </p>
            <Button onClick={() => router.push("/auth")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="min-h-full pb-6">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => router.push("/your-videos")}
        >
          <ArrowLeft className="h-4 w-4" />
          Your Videos
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="videoFile">Video file</Label>
                <label
                  htmlFor="videoFile"
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 px-4 text-center transition-colors hover:bg-muted/50"
                >
                  <FileVideo className="mb-3 h-10 w-10 text-customRed" />
                  <span className="font-medium">
                    {videoFile ? videoFile.name : "Choose an MP4 or MKV file"}
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {videoFile
                      ? `${(videoFile.size / (1024 * 1024)).toFixed(1)}MB`
                      : `Maximum file size: ${MAX_VIDEO_FILE_SIZE_MB}MB`}
                  </span>
                </label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/mp4,video/x-matroska,.mkv"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  maxLength={5000}
                  disabled={isUploading}
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isUploading || !videoFile}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Upload Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
