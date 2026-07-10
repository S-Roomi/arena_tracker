import { Swords, Trophy } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/server";
import { pct, winRateColor } from "./_components/arena-ui";
import { AugmentLeaderboard } from "./_components/augment-leaderboard";
import { ChampionLeaderboard } from "./_components/champion-leaderboard";
import { PlayerSearch } from "./_components/player-search";
import { RecentMatches } from "./_components/recent-matches";
import { StatCard } from "./_components/stat-card";

export default async function Home() {
  const activePlayer = await api.arena.getActivePlayer();
  if (!activePlayer) return <SignedOutHero />;

  const [summary, leaderboard, augments] = await Promise.all([
    api.arena.getSummary(),
    api.arena.getChampionLeaderboard(),
    api.arena.getAugmentLeaderboard(),
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
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {activePlayer.gameName}
          <span className="text-muted-foreground">#{activePlayer.tagLine}</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          League of Legends Arena statistics
        </p>
      </header>

      {/* Summary stat row */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Games" value={String(summary.games)} />
        <StatCard
          label="Win rate"
          value={pct(summary.winRate)}
          sub={`${summary.wins} firsts`}
          valueColor={winRateColor(summary.winRate)}
        />
        <StatCard
          label="Top 3 rate"
          value={pct(summary.top3Rate)}
          sub={`${summary.top3} finishes`}
        />
        <StatCard
          label="Avg placement"
          value={summary.avgPlacement.toFixed(2)}
          sub="out of 6"
        />
        <StatCard label="Avg KDA" value={summary.avgKda.toFixed(2)} />
      </section>

      {/* Content grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChampionLeaderboard rows={leaderboard} player={activePlayer.gameName} />
        <RecentMatches player={`${activePlayer.gameName}#${activePlayer.tagLine}`} />
      </section>

      {/* Augment win rates */}
      <section className="mt-6">
        <AugmentLeaderboard rows={augments} player={activePlayer.gameName} />
      </section>
    </main>
  );
}

/** Landing state before a player has been looked up. */
function SignedOutHero() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
        <Swords className="size-7" />
      </span>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Arena Tracker
      </h1>
      <p className="text-muted-foreground mt-2 mb-2 text-balance"/>
      <PlayerSearch />
    </main>
  );
}
