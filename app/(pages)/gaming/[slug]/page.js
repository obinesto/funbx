import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGamePixGameBySlug } from "@/lib/server/games";
import { ArrowLeft, ExternalLink, Hand, Monitor, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 43200;

export default async function GamePlayerPage({ params }) {
  const { slug } = await params;
  const game = await getGamePixGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <section className="space-y-4 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/gaming">
              <ArrowLeft className="h-4 w-4" />
              Back to games
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{game.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {game.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {game.rating.toFixed(1)}
                </span>
              )}
              {game.hardwareControls && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  Keyboard
                </span>
              )}
              {game.touch && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Hand className="h-4 w-4" />
                  Touch
                </span>
              )}
              {game.categories.slice(0, 4).map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={game.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Source
          </a>
        </Button>
      </div>

      <Card className="overflow-hidden border-hidden bg-black shadow-lg">
        <div className="relative h-[72vh] min-h-[520px] w-full">
          <iframe
            src={game.url}
            title={game.title}
            className="h-full w-full"
            allow="autoplay; fullscreen; gamepad; pointer-lock"
            sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
            loading="eager"
            allowFullScreen
          />
        </div>
      </Card>

      <Alert>
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Game data and hosted player are provided by GamePix.
          </span>
          <a
            href="https://games.gamepix.com/gameinfo/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-customRed"
          >
            Attribution
            <ExternalLink className="h-4 w-4" />
          </a>
        </AlertDescription>
      </Alert>
    </section>
  );
}
