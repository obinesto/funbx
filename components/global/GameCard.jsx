import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Hand, Monitor, Play, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function GameCard({ game }) {
  return (
    <Link
      href={`/gaming/${game.slug}`}
      className="block h-full transition-transform duration-200 hover:scale-[1.02]"
    >
      <Card className="grid h-full min-h-[360px] grid-rows-[auto_1fr] overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video bg-muted">
          {game.thumbnail ? (
            <Image
              src={game.thumbnail}
              alt={`${game.title} thumbnail`}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Gamepad2 className="h-10 w-10" />
            </div>
          )}
          {game.rating > 0 && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {Math.round(game.rating)}
            </div>
          )}
        </div>

        <CardContent className="grid min-h-0 grid-rows-[1fr_auto] p-4">
          <div className="min-h-0">
            <h3 className="min-h-12 text-base font-semibold leading-6 line-clamp-2 hover:text-customRed">
              {game.title}
            </h3>
            {game.shortDescription && (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {game.shortDescription}
              </p>
            )}
            {game.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {game.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              {game.hardwareControls && (
                <span className="inline-flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  Keyboard
                </span>
              )}
              {game.touch && (
                <span className="inline-flex items-center gap-1">
                  <Hand className="h-3.5 w-3.5" />
                  Touch
                </span>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full bg-customRed text-white hover:bg-customRed/90">
              <Play className="h-4 w-4 fill-current" />
              Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
