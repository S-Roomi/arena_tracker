# Arena Tracker

A stats site for **Arena**, the League of Legends game mode. 

Built with the [T3 Stack](https://create.t3.gg/):

- **Next.js** (App Router) + **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (base-nova, neutral)
- **tRPC** for the type-safe API layer
- **Drizzle ORM** on **SQLite / libSQL**

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
