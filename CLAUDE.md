# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A stats site for **Arena**, the 2v2v2v2 League of Legends mode (`queueId 1700`, `gameMode "CHERRY"`, map `30`). T3 Stack: Next.js App Router + React 19, tRPC, Drizzle ORM on SQLite/libSQL, Tailwind v4 + shadcn/ui.

All match data is **mock, generated deterministically** — but every payload conforms exactly to Riot's Match-V5 response shape. See the central design principle below.

## Commands

```bash
npm run dev          # dev server with Turbopack → http://localhost:3000
npm run db:push      # sync Drizzle schema to SQLite (no migration files)
npm run db:seed      # wipe + reload 40 deterministic mock matches
npm run db:studio    # Drizzle Studio
npm run icons:fetch  # download champion icons → public/champions/{id}.png
npm run typecheck    # tsc --noEmit — this is the test/verify step
npm run build        # production build
```

There is **no test runner and no linter** — `npm run typecheck` is how you verify changes. `DATABASE_URL` (default `file:./db.sqlite`) must be set in `.env`; copy from `.env.example`. First-time setup requires `db:push` then `db:seed`.

## Central design principle: the Match-V5 boundary

The single most important architectural decision: **`src/server/riot/` mimics the live Riot API so precisely that everything downstream is agnostic to whether data is real or mock.** Swapping the mock generator for real `GET /lol/match/v5/matches/{matchId}` calls should require *no changes* to the seed, schema, or query layers.

- `riot/types.ts` — typed subset of Match-V5 DTOs (`MatchDto` = `{ metadata, info }`), including Arena fields: `placement`, `playerSubteamId`, `playerAugment1..4`.
- `riot/mock.ts` — deterministic generator (`mulberry32` PRNG, fixed seed) returning full `MatchDto[]`. `generateMockMatches(count, seed)` is the entry point.
- `riot/constants.ts` — champion + augment reference tables. Real Match-V5 returns only *ids*; names/rarities are resolved from static data (Data Dragon / Community Dragon). `getAugment(id)` / champion lookups live here.

Because the mock returns nested DTOs, `seed.ts` performs the **same flattening a real ingestion pipeline would** — turning nested `MatchDto` into the flat `arena_match` / `arena_participant` rows. When touching this boundary, preserve DTO fidelity; don't take mock-only shortcuts.

## Key domain conventions

- **Featured player**: `FEATURED_PLAYER` (in `mock.ts`) is the summoner the whole site profiles. The generator guarantees this puuid anchors **subteam 1, slot 0 of every match**. Queries filter on `FEATURED_PLAYER.puuid`.
- **Placement semantics** (defined in `routers/arena.ts`): a "win" is `placement === 1` (Arena has 8 subteams, one winner); "top 4" (`placement <= 4`) is the positive/positive-finish cut. Reuse `isWin` / `isTop4` rather than re-deriving.
- **DB table prefix**: `sqliteTableCreator` prefixes every table `arena_tracker_` (multi-project schema). Physical table names differ from the exported symbol names.
- **Champion icons**: served as static PNGs from `public/champions/{championId}.png`, keyed by id to match the Match-V5 contract. `<ChampionIcon>` uses `unoptimized` Next Image on purpose (avoids a Next 15.5 image-cache bug).

## tRPC data flow

- Router lives in `src/server/api/routers/arena.ts` (`getSummary`, `getChampionLeaderboard`, `getRecentMatches`), registered in `api/root.ts`. All are `publicProcedure` (no auth). Aggregation is done in JS after a simple `select`, not in SQL.
- **Server Components** call the API directly via `~/trpc/server` (`api.arena.getSummary()`) — see `app/page.tsx`, which fetches all three procedures in parallel and passes data into presentational components.
- **Client Components** use `~/trpc/react` (`api` from `createTRPCReact`) inside `TRPCReactProvider`.
- `trpc.ts` adds a dev-only `timingMiddleware` with an artificial 100–500ms delay to surface waterfalls; it logs every procedure's timing.

## Layout

- `src/app/_components/` — presentational, data comes in as props. `arena-ui.tsx` holds shared bits (`ChampionIcon`, `PlacementBadge`, `pct` formatter).
- `src/components/ui/` — shadcn/ui primitives (base-nova, neutral). Regenerate via shadcn CLI rather than hand-editing.
- `src/env.js` — validated env schema (`@t3-oss/env-nextjs` + Zod); add new env vars here, not just to `.env`.

Not endorsed by or affiliated with Riot Games.
