# Arena Tracker

A stats tracker for League of Legends Arena. Look up a player by Riot ID to see their recent Arena matches, along with how each champion performed, which augments they picked, what items they built, and their full match history.

**Live:** [arena-tracker-ruby.vercel.app](https://arena-tracker-ruby.vercel.app)

## Features

- **Player search:** find a player by Riot ID and import their recent Arena matches
- **Champion leaderboard:** win rate, average placement, and games played per champion
- **Augment stats:** how often each augment is picked and how it performs
- **Champion pages:** detailed stats, item builds, and augments for each champion
- **Match history:** your recent games, showing placement, augments, and items

## Getting Started

### Prerequisites

- Node.js 20+
- A [Riot API key](https://developer.riotgames.com/). Free development keys expire every 24 hours.

### Setup

```bash
git clone https://github.com/S-Roomi/arena_tracker.git
cd arena_tracker
npm install
cp .env.example .env   # then fill in the values below
npm run db:push        # create the database schema
npm run db:seed        # optional: load demo data
npm run dev
```

The app runs at http://localhost:3000.

### Environment Variables

| Variable             | Required | Description                                              |
| -------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | libSQL URL. Use `file:./db.sqlite` for a local database. |
| `DATABASE_API_TOKEN` | No       | Turso auth token. Only needed for a remote database.     |
| `RIOT_API_KEY`       | Yes      | Riot Games API key, used for Account-V1 and Match-V5.    |

## Disclaimer

Arena Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends.
