import GameCard from "@/components/global/GameCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getGamePixGames, getTopGameCategories } from "@/lib/server/games";
import { AlertTriangle, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { GamingLoadingSkeleton } from "./loading";

export const revalidate = 43200;

function GamesError({ error }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-center">
            {error?.message || "Error loading games. Please try again later."}
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
}

async function GamingContent({ category, search }) {
  try {
    const data = await getGamePixGames({ category, search, limit: 48 });
    const allGamesData =
      category || search ? await getGamePixGames({ limit: 500 }) : data;
    const categories = getTopGameCategories(allGamesData.games, 10);

    return (
      <section className="space-y-4 pb-12">
        <Card className="border-hidden p-4">
          <div>
            <div className="flex items-center gap-2 text-customRed">
              <Gamepad2 className="h-5 w-5" />
              <h1 className="text-xl font-bold md:text-2xl">Games</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a game to play it in-app.
            </p>
          </div>
        </Card>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href="/gaming">
              <Badge
                variant={!category ? "destructive" : "secondary"}
                className="whitespace-nowrap"
              >
                All
              </Badge>
            </Link>
            {categories.map((item) => (
              <Link
                key={item}
                href={`/gaming?category=${encodeURIComponent(item)}`}
              >
                <Badge
                  variant={category === item ? "destructive" : "secondary"}
                  className="whitespace-nowrap"
                >
                  {item}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {data.games.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        ) : (
          <Card className="flex min-h-[240px] flex-col items-center justify-center gap-2 border-hidden p-6 text-center">
            <Gamepad2 className="h-8 w-8 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No games found</h2>
            <p className="text-sm text-muted-foreground">
              Try another category or come back when the catalog refreshes.
            </p>
          </Card>
        )}
      </section>
    );
  } catch (error) {
    return <GamesError error={error} />;
  }
}

export default async function GamingPage({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;
  const search = params?.q;
  const loadingKey = `${category || "all"}:${search || ""}`;

  return (
    <Suspense key={loadingKey} fallback={<GamingLoadingSkeleton />}>
      <GamingContent category={category} search={search} />
    </Suspense>
  );
}
