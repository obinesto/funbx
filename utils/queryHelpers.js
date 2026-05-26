import * as Sentry from "@sentry/react";

export function handleApiError(error) {
  Sentry.captureException(error);

  if (error.response?.status === 403) {
    throw new Error("YouTube API quota exceeded. Please try again later.");
  }

  if (error.response?.status === 404) {
    throw new Error("Video not found.");
  }

  throw new Error(
    error.response?.data?.message || "An unexpected error occurred.",
  );
}

export function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
