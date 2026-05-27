"use client";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import BrandLogo from "@/components/global/BrandLogo";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  const socialLinks = [
    {
      name: "GitHub",
      icon: <FaGithub className="h-4 w-4" />,
      href: "https://github.com/obinesto/youtube-clone",
      description: "Check out the source code",
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedin className="h-4 w-4" />,
      href: "https://www.linkedin.com/in/cyprian-obi-6306b4183",
      description: "Connect with me professionally",
    },
    {
      name: "Twitter",
      icon: <FaTwitter className="h-4 w-4" />,
      href: "https://www.x.com/obinesto",
      description: "Follow for updates",
    },
  ];

  const exploreLinks = [
    { name: "Home", href: "/" },
    { name: "Trending", href: "/trending" },
    { name: "Gaming", href: "/gaming" },
    { name: "Music", href: "/music" },
    { name: "Movies", href: "/movies" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  return (
    <footer className="mt-10 w-full overflow-hidden border-t border-border/70 bg-card/70 text-foreground shadow-[0_-18px_45px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-customRed/35 to-transparent" />

      <div className="mx-auto grid w-full max-w-[2000px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <BrandLogo size="sm" />
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Watch videos, play games, and discover more entertainment in one
            place.
          </p>
        </div>

        <div className="space-y-3 md:space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
            Explore
          </h2>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {exploreLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors hover:text-customRed"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
            Connect
          </h2>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <HoverCard key={link.name} openDelay={200}>
                <HoverCardTrigger asChild>
                  <Link
                    href={link.href}
                    target="blank"
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground shadow-sm shadow-black/[0.02] transition-colors hover:border-customRed/30 hover:bg-accent hover:text-customRed"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto">
                  <div className="flex items-center space-x-2">
                    {link.icon}
                    <div>
                      <h4 className="text-sm font-semibold">{link.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getUTCFullYear()} FunBx. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
