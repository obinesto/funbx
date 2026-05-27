import GameCard from "@/components/global/GameCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getGamePixGames, getTopGameCategories } from "@/lib/server/games";
import { AlertTriangle, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { GameGridLoadingSkeleton } from "./loading";

export const revalidate = 43200;

const FALLBACK_GAME_CATEGORIES = [
  "Arcade",
  "Puzzles",
  "Adventure",
  "Junior",
  "Sports",
  "Classics",
  "Strategy",
  "Board",
  "Casino",
];

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

function CategoryLinks({ category, categories }) {
  return (
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
        <Link key={item} href={`/gaming?category=${encodeURIComponent(item)}`}>
          <Badge
            variant={category === item ? "destructive" : "secondary"}
            className="whitespace-nowrap"
          >
            {item}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

async function GameCategoryNav({ category }) {
  const fallbackCategories = FALLBACK_GAME_CATEGORIES;
  let categories = fallbackCategories;

  try {
    const catalog = await getGamePixGames({ limit: 500 });
    const topCategories = getTopGameCategories(catalog.games, 10);

    if (topCategories.length) {
      categories = topCategories;
    }
  } catch (error) {
    console.warn("Using fallback game categories:", error);
  }

  return <CategoryLinks category={category} categories={categories} />;
}

async function GameGrid({ category, search }) {
  try {
    const data = await getGamePixGames({ category, search, limit: 48 });

    if (!data.games.length) {
      return (
        <Card className="flex min-h-[240px] flex-col items-center justify-center gap-2 border-border/60 bg-card/90 p-6 text-center shadow-sm shadow-black/[0.03] backdrop-blur">
          <Gamepad2 className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No games found</h2>
          <p className="text-sm text-muted-foreground">
            Try another category or come back when the catalog refreshes.
          </p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
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
    <section className="space-y-4 pb-12">
      <div>
        <div className="flex items-center gap-2 text-customRed">
          <Gamepad2 className="h-5 w-5" />
          <h1 className="text-xl font-bold md:text-2xl">Games</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a game to play it in-app.
        </p>
      </div>

      <Suspense
        fallback={
          <CategoryLinks
            category={category}
            categories={FALLBACK_GAME_CATEGORIES}
          />
        }
      >
        <GameCategoryNav category={category} />
      </Suspense>

      <Suspense key={loadingKey} fallback={<GameGridLoadingSkeleton />}>
        <GameGrid category={category} search={search} />
      </Suspense>
    </section>
  );
}
