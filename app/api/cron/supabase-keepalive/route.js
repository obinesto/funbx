import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseConfig";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured" },
      { status: 500 },
    );
  }

  const startedAt = Date.now();
  const { data, error } = await supabase.from("users").select("id").limit(1);

  if (error) {
    console.error("Supabase keepalive failed:", error);
    return NextResponse.json(
      { error: "Supabase keepalive failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    checkedTable: "users",
    rowsRead: data?.length ?? 0,
    durationMs: Date.now() - startedAt,
  });
}
