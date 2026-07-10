# Arena Tracker

A stats site for **Arena**, the League of Legends game mode where 8 three-player
subteams fight it out (`queueId 1700`, `gameMode "CHERRY"`, Rings of Wrath map
`30`). It shows a
featured player's summary, a champion tier list, and recent match history.

Built with the [T3 Stack](https://create.t3.gg/):

- **Next.js** (App Router) + **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (base-nova, neutral)
- **tRPC** for the type-safe API layer
- **Drizzle ORM** on **SQLite / libSQL**

## Data

All data is **mock data**, generated deterministically, but every payload
conforms to Riot's official **Match-V5** response shape
(`GET /lol/match/v5/matches/{matchId}`). Swapping the mock generator for real
API calls requires no changes downstream.

- `src/server/riot/types.ts` — typed subset of the Match-V5 DTOs (Arena fields:
  `placement`, `playerSubteamId`, `playerAugment1..4`, …).
- `src/server/riot/constants.ts` — champion + augment reference tables (the
  static data you'd otherwise resolve from Data Dragon / Community Dragon).
- `src/server/riot/mock.ts` — deterministic Arena match generator.
- `src/server/db/schema.ts` — `arena_match` and `arena_participant` tables.
- `src/server/api/routers/arena.ts` — tRPC procedures: `getSummary`,
  `getChampionLeaderboard`, `getRecentMatches`.

## Getting started

```bash
npm install         # already done if you scaffolded this
npm run db:push     # create the SQLite tables (uses DATABASE_URL from .env)
npm run db:seed     # load 40 mock Arena matches
npm run dev         # http://localhost:3000
```

The database URL defaults to a local file (`.env`):

```
DATABASE_URL="file:./db.sqlite"
```

## Scripts

| Script              | Description                        |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)  |
| `npm run db:push`   | Sync the Drizzle schema to SQLite |
| `npm run db:seed`   | Seed mock Arena matches           |
| `npm run icons:fetch` | Cache champion icons (Community Dragon) |
| `npm run items:fetch` | Cache item icons (Data Dragon)    |
| `npm run db:studio` | Open Drizzle Studio               |
| `npm run typecheck` | Type-check with `tsc`             |
| `npm run build`     | Production build                  |

> Not endorsed by or affiliated with Riot Games.
