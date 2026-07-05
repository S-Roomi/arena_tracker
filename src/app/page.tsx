import { Swords, Trophy } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/server";
import { pct } from "./_components/arena-ui";
import { ChampionLeaderboard } from "./_components/champion-leaderboard";
import { RecentMatches } from "./_components/recent-matches";
import { StatCard } from "./_components/stat-card";

export default async function Home() {
  const [summary, leaderboard, recent] = await Promise.all([
    api.arena.getSummary(),
    api.arena.getChampionLeaderboard({ limit: 12 }),
    api.arena.getRecentMatches({ limit: 8 }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <header className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <Swords className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Arena Tracker
          </span>
          <Badge variant="secondary" className="ml-1">
            Queue 1700 · CHERRY
          </Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          League of Legends <span className="text-primary">Arena</span>{" "}
          statistics
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-lg text-pretty">
          2v2v2v2 performance for{" "}
          <span className="text-foreground font-medium">
            {summary.player.gameName}#{summary.player.tagLine}
          </span>
          , plus a champion tier list. Built on the official Match-V5 data model.
        </p>
      </header>

      {/* Summary stat row */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Games" value={String(summary.games)} />
        <StatCard
          label="Win rate"
          value={pct(summary.winRate)}
          sub={`${summary.wins} firsts`}
          accent
        />
        <StatCard
          label="Top 4 rate"
          value={pct(summary.top4Rate)}
          sub={`${summary.top4} finishes`}
        />
        <StatCard
          label="Avg placement"
          value={summary.avgPlacement.toFixed(2)}
          sub="out of 8"
        />
        <StatCard label="Avg KDA" value={summary.avgKda.toFixed(2)} />
      </section>

      {/* Content grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChampionLeaderboard rows={leaderboard} />
        <RecentMatches matches={recent} />
      </section>

      <footer className="text-muted-foreground mt-12 flex items-center gap-1.5 text-sm">
        <Trophy className="size-4" />
        Mock data conforming to Riot Match-V5. Not endorsed by Riot Games.
      </footer>
    </main>
  );
}
