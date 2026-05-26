# FunBx

FunBx is a full-stack entertainment hub built with Next.js App Router, React, Supabase, Firebase Auth, Cloudinary, and the YouTube Data API. The project is currently in active development and is designed toward an SSR-first architecture.

## Current Status

The app uses a hybrid model:

- Server-rendered pages for primary route data, including feed/trending-style pages, protected library pages, uploaded videos, subscriptions, and gaming pages.
- Server actions for authenticated mutations such as likes, saved videos, subscriptions, clearing history, and deleting uploaded videos.
- Client hooks only where client interactivity still needs them, such as auth state, video action status, search UI behavior, playback, optimistic card actions, and feed personalization fallback.
- Route-level `loading.js` files for the main dynamic/protected surfaces, including gaming, game player, video, history, liked videos, saved videos, subscriptions, trending, and your videos.

## Features

- Authentication with Firebase email/password and Google sign-in.
- Firebase session cookies for server-side route protection.
- Supabase-backed user records, watch history, likes, saved videos, subscriptions, uploaded videos, and search cache.
- YouTube playback, video details, related videos, search, and trending discovery.
- User-uploaded video support with Cloudinary storage.
- Protected user library pages:
  - Watch history
  - Liked videos
  - Saved videos
  - Subscriptions
  - Your uploaded videos
- GamePix-powered gaming section with category filtering and in-app game player pages.
- PWA support through the app provider layer, `features/pwa`, and `public/sw.js`.
- Responsive layout, dark/light theme support, reusable UI primitives, skeleton loading states, and toast feedback.
- Sentry, Vercel Analytics, and Vercel Speed Insights integration.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS
- Radix UI primitives
- TanStack Query for client queries and mutation status
- Zustand for client state
- Firebase client/auth/admin SDKs
- Supabase
- Cloudinary
- YouTube Data API
- GamePix API
- Sentry

## Architecture

### App Routing

The `app` folder is kept focused on routes:

```text
app/
|-- (pages)/              # User-facing app routes
|-- api/                  # API route handlers
|-- layout.js             # Root shell and providers
|-- loading.js            # Root loading fallback
`-- page.js               # Home page
```

The `(pages)` route group keeps page routes together without adding a URL segment. Route folders own their `page.js` and, where useful, their `loading.js`.

### Server Data Layer

Server-only data access lives under `lib/server`:

```text
lib/server/
|-- games.js              # GamePix catalog and game detail fetches
|-- protectedActions.js   # Server actions for protected mutations
|-- protectedData.js      # SSR data for protected library pages
|-- userRecord.js         # Server-side user record helpers
`-- youtube.js            # YouTube API fetches, trending, search, cache-aware helpers
```

Protected pages call `getCurrentUser()` first, redirect unauthenticated users, then load their data on the server. Client page components receive `initial...` props and manage only local UI updates after mutations.

### Client Layer

Client-only code is separated by role:

```text
components/
|-- clients/              # Route-level client components
|-- global/               # Shared app components
`-- ui/                   # Reusable design primitives

hooks/
|-- useProtectedFeatures.js
|-- useQueries.js
`-- useYouTubePlayer.js

store/
|-- authStore.js
|-- playerStore.js
`-- uiStore.js

providers/
|-- AuthProvider.jsx
|-- PromptProvider.jsx
|-- ThemeProvider.jsx
`-- index.js
```

`hooks/useQueries.js` keeps query/mutation hooks that are still client-owned: feed, search, video details fallback, related videos, history write, action status checks, and upload/delete mutations.

### API Routes

The API folder is used for browser-to-server boundaries and integrations that need route handlers:

```text
app/api/
|-- cron/supabase-keepalive
|-- history
|-- likes
|-- saved-videos
|-- search
|-- session
|-- subscriptions
|-- users
|-- videos
`-- youtube/[resourceType]
```

These routes support auth session syncing, client-side action status checks, uploads, search, YouTube proxying, user records, and existing client flows. SSR page data doesn't need a browser API hop is handled directly in `lib/server`.

### Design Code Architecture

The UI is organized around a few stable layers:

- `components/ui`: base primitives and shadcn-style building blocks.
- `components/global`: reusable product components such as navigation, sidebar, video cards, video player, game cards, dialogs, and dashboard loading shells.
- `components/clients`: route-specific interactive components. These should receive server-loaded data and own only local presentation state.
- `utils`: formatting and shape-mapping helpers used by both client components and page rendering.
- Tailwind CSS is the styling system, with responsive grids, cards, skeleton states, and theme-aware color utilities.

Current design direction:

- Dashboard/product UI is dense, scannable, and content-first.
- Cards are used for repeated content and loading frames.
- Route loading states should mirror the final layout.
- Server-rendered pages should avoid client spinners for initial data whenever SSR can provide it.
- Client state should enhance the page after render, not be the first source of visible content.

### Data Flow

Typical protected page flow:

```text
request route
  -> getCurrentUser()
  -> redirect if unauthenticated
  -> load data from lib/server/protectedData.js
  -> render page client with initial data
  -> user action calls server action
  -> local state updates the visible list
```

Typical video/card action flow:

```text
VideoCard
  -> useVideoActions/useProtectedFeatures
  -> server action in lib/server/protectedActions.js
  -> invalidate small status query when needed
  -> optional local callback updates parent page state
```

## Environment Variables

Create a `.env` or `.env.local` file with the values needed for the features you run locally:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# YouTube API key rotation
YOUTUBE_API_KEY=
YOUTUBE_API_KEY2=
YOUTUBE_API_KEY3=

# Cloudinary uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# GamePix
GAMEPIX_SID=1

# PWA push notifications
AUTHOR_EMAIL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Optional app/runtime values
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_VERCEL_URL=
CRON_SECRET=
```

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Note: the current `npm start` script runs `next build && next start`.

## Scripts

```text
npm run dev      # Start the development server
npm run build    # Build for production
npm start        # Build, then start the production server
npm run lint     # Run ESLint
```

## Project Structure

```text
funbx/
|-- app/                  # App Router pages, API routes, root layout/loading
|-- components/           # Route clients, global components, UI primitives
|-- features/             # Feature modules such as PWA support
|-- hooks/                # Client hooks for queries, mutations, player behavior
|-- lib/                  # Server, client, database, Firebase, Supabase modules
|-- providers/            # Root client providers
|-- public/               # Static assets and service worker
|-- store/                # Zustand stores
`-- utils/                # Formatting and mapping utilities
```

## Development Notes

- Prefer `lib/server` for data that can be fetched during SSR.
- Prefer server actions for authenticated mutations.
- Keep `app/api` for browser boundaries, third-party proxy routes, uploads, cron, session syncing, and client status checks.
- Avoid reintroducing protected list-fetching hooks for pages that already receive SSR data.
- Add `loading.js` beside routes where server work may be noticeable during navigation.
- Keep route clients thin: receive data, render UI, perform local optimistic updates.

## License

This project is licensed under the MIT License.
