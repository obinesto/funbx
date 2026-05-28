import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/global/NavBar";
import SideBar from "@/components/global/SideBar";
import DashboardShell from "@/components/global/DashboardShell";
import ErrorBoundary from "@/components/global/ErrorBoundary";
import ModeToggle from "@/components/global/ModeToggle";
import PwaSetup from "../features/pwa";
import { Providers } from "../providers";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(appUrl),
  title: "FunBx",
  description:
    "An entertainment hub for watching videos, playing games, and discovering music and movies.",
  author: "Cyprian Obi",
  url: appUrl,
  keywords: [
    "FunBx",
    "Entertainment",
    "Progressive Web Application",
    "Video",
    "Gaming",
    "Music",
    "Movies",
    "Cyprian Obi",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Node.js",
  ],
  creator: "Cyprian Obi",
  openGraph: {
    type: "website",
    title: "FunBx",
    description:
      "An entertainment hub for watching videos, playing games, and discovering music and movies.",
    url: appUrl,
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "FunBx preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FunBx",
    description:
      "An entertainment hub for watching videos, playing games, and discovering music and movies.",
    creator: "@obinesto",
    images: ["/preview.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <Providers>
          <ErrorBoundary>
            <div className="app-shell grid h-dvh grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden text-foreground dark:text-foreground md:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="col-span-full">
                <NavBar />
              </div>
              <SideBar />
              <DashboardShell>{children}</DashboardShell>
            </div>
            <div className="fixed bottom-4 right-4 z-50">
              <ModeToggle />
            </div>
          </ErrorBoundary>
          <PwaSetup />
          <Toaster position="bottom-right" richColors />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
