import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TAGS = new Set([
  "youtube",
  "youtube-feed",
  "youtube-search",
  "youtube-trending",
]);

export async function POST(request) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { error: "REVALIDATION_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { path, tag } = body;

  if (tag) {
    if (!ALLOWED_TAGS.has(tag)) {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }

    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }

  if (path) {
    if (typeof path !== "string" || !path.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json(
    { error: "Provide either a path or tag to revalidate" },
    { status: 400 },
  );
}
