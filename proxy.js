import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/studio",
  "/playlist",
  "/liked-videos",
  "/saved-videos",
  "/subscriptions",
  "/settings",
  "/history",
  "/your-videos",
];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/studio/:path*",
    "/playlist/:path*",
    "/liked-videos/:path*",
    "/saved-videos/:path*",
    "/subscriptions/:path*",
    "/settings/:path*",
    "/history/:path*",
    "/your-videos/:path*",
  ],
};
