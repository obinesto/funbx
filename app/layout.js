import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/global/NavBar";
import SideBar from "@/components/global/SideBar";
import DashboardShell from "@/components/global/DashboardShell";
import ErrorBoundary from "@/components/global/ErrorBoundary";
import ModeToggle from "@/components/global/ModeToggle";
import PwaSetup from "./pwa";
import { Providers } from "./providers";
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

export const metadata = {
  title: "YouTube Clone - By Cyprian Obi",
  description:
    "A progressive web application that replicates the core features of YouTube.",
  author: "Cyprian Obi",
  url: "https://youtube-clone-cyprianobi.vercel.app/",
  keywords: [
    "YouTube Clone",
    "Progressive Web Application",
    "Video Sharing",
    "Cyprian Obi",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Node.js",
  ],
  creator: "Cyprian Obi",
  openGraph: {
    type: "website",
    title: "YouTube Clone - By Cyprian Obi",
    description:
      "A progressive web application that replicates the core features of YouTube.",
    url: "https://youtube-clone-cyprianobi.vercel.app/",
    images: [
      {
        url: "https://youtube-clone-cyprianobi.vercel.app/preview.png",
        width: 1200,
        height: 630,
        alt: "Youtube Clone Preview Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Clone - By Cyprian Obi",
    description:
      "A progessive web application that replicates the core features of YouTube.",
    creator: "@Mc_Cprian02",
    images: ["https://youtube-clone-cyprianobi.vercel.app/preview.png"],
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
            <NavBar />
            <div className="flex min-h-screen">
              <SideBar />
              <DashboardShell>{children}</DashboardShell>
            </div>
            <div className="fixed bottom-4 right-4 z-50">
              <ModeToggle />
            </div>
          </ErrorBoundary>
          <PwaSetup />
          <Toaster />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
