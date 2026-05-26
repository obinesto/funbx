export function getVideoCardProps(video) {
  if (!video) {
    return null;
  }

  const snippet = video.snippet || {};
  const thumbnails = snippet.thumbnails || {};
  const statistics = video.statistics || {};
  const contentDetails = video.contentDetails || {};
  const videoId = video.videoId || video.id || video.video_id;
  const title = snippet.title || video.title;

  if (!videoId || !title) {
    return null;
  }

  return {
    videoId,
    title,
    thumbnail:
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      video.thumbnail ||
      video.thumbnail_url,
    channelTitle:
      snippet.channelTitle ||
      video.channelTitle ||
      video.channel_title ||
      "Your channel",
    createdAt: snippet.publishedAt || video.createdAt || video.created_at,
    views: statistics.viewCount || video.views || video.view_count,
    duration: contentDetails.duration || video.duration,
    watchedAt: video.watchedAt,
    savedAt: video.savedAt,
    likedAt: video.likedAt,
    isOwner: video.isOwner,
    isUserVideo: video.isUserVideo || video.is_user_video,
    videoUrl: video.videoUrl || video.video_url,
  };
}

