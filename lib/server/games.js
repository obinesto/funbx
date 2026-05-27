import "server-only";

const GAMEPIX_GAMES_API_URL = "https://games.gamepix.com/games";
const GAMEPIX_GAME_API_URL = "https://games.gamepix.com/game";
const DEFAULT_REVALIDATE = 60 * 60 * 12;
const MAX_CACHEABLE_GAME_LIMIT = 800;
const CATEGORY_SCAN_LIMIT = 500;
const DEFAULT_SID = process.env.GAMEPIX_SID || "1";

function normalizeGame(game) {
  return {
    title: game.title?.trim() || "Untitled game",
    slug: game.id,
    id: game.id,
    url: game.url,
    categories: Array.isArray(game.categories)
      ? game.categories.filter(Boolean)
      : [game.category].filter(Boolean),
    thumbnail: game.thumbnailUrl || game.thumbnailUrl100,
    rating: Number(game.rkScore || 0),
    shortDescription: game.description || game.desc_en || "",
    width: Number(game.width || 0),
    height: Number(game.height || 0),
    orientation: game.orientation,
    responsive: Boolean(game.responsive),
    touch: Boolean(game.touch),
    hardwareControls: Boolean(game.hwcontrols),
  };
}

export async function getGamePixGames({
  category,
  search,
  limit = 48,
  revalidate = DEFAULT_REVALIDATE,
} = {}) {
  const requestedLimit = Math.min(
    Math.max(Number(limit) || 48, 1),
    MAX_CACHEABLE_GAME_LIMIT,
  );
  const apiLimit = category || search ? CATEGORY_SCAN_LIMIT : requestedLimit;
  const searchParams = new URLSearchParams({
    sid: DEFAULT_SID,
    order: "q",
    limit: String(apiLimit),
    offset: "0",
  });

  const response = await fetch(`${GAMEPIX_GAMES_API_URL}?${searchParams}`, {
    next: {
      revalidate,
      tags: ["gamepix-games"],
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load games right now.");
  }

  const data = await response.json();
  const normalizedCategory = category?.trim().toLowerCase();
  const normalizedSearch = search?.trim().toLowerCase();

  const games = (data.data || [])
    .map(normalizeGame)
    .filter((game) => {
      if (!game.id || !game.url) {
        return false;
      }

      if (
        normalizedCategory &&
        !game.categories.some(
          (item) => item.toLowerCase() === normalizedCategory,
        )
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        game.title.toLowerCase().includes(normalizedSearch) ||
        game.shortDescription.toLowerCase().includes(normalizedSearch) ||
        game.categories.some((item) =>
          item.toLowerCase().includes(normalizedSearch),
        )
      );
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, requestedLimit);

  return {
    totalGames: data.count || games.length,
    source: "https://games.gamepix.com/gameinfo/",
    license: "GamePix publisher integration",
    games,
  };
}

export async function getGamePixGameBySlug(slug) {
  if (!slug) {
    return null;
  }

  const searchParams = new URLSearchParams({
    sid: DEFAULT_SID,
    gid: slug,
  });

  const response = await fetch(`${GAMEPIX_GAME_API_URL}?${searchParams}`, {
    next: {
      revalidate: DEFAULT_REVALIDATE,
      tags: ["gamepix-games", `gamepix-game-${slug}`],
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.status !== "success" || !data.data) {
    return null;
  }

  return normalizeGame(data.data);
}

export function getTopGameCategories(games, limit = 10) {
  const counts = new Map();

  for (const game of games) {
    for (const category of game.categories) {
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}
