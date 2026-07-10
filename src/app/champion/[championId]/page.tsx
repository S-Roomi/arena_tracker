import { ArrowLeft, Swords } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/server";
import {
  ChampionIcon,
  ItemIcon,
  PlacementBadge,
  RarityLabel,
  pct,
} from "~/app/_components/arena-ui";
import { AugmentIcon } from "~/app/_components/augment-icon";
import { AugmentTooltip } from "~/app/_components/augment-tooltip";
import { StatCard } from "~/app/_components/stat-card";

type Params = { params: Promise<{ championId: string }> };

const kfmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

function timeAgo(date: Date): string {
  const hours = Math.round((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { championId } = await params;
  const profile = await api.arena.getChampionProfile({
    championId: Number(championId),
  });
  const name = profile?.champion.name ?? "Champion";
  return { title: `${name} · Arena Tracker` };
}

export default async function ChampionPage({ params }: Params) {
  const { championId } = await params;
  const id = Number(championId);
  if (!Number.isInteger(id)) notFound();

  const profile = await api.arena.getChampionProfile({ championId: id });
  if (!profile || !profile.player || profile.stats.games === 0) notFound();

  const { champion, player, stats, topItems, topAugments, matches } = profile;
  const handle = `${player.gameName}#${player.tagLine}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to leaderboard
      </Link>

      {/* Champion header */}
      <header className="mb-8 flex items-center gap-4">
        <ChampionIcon championId={champion.id} name={champion.name} size={72} />
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Swords className="mr-1 size-3" />
              Arena
            </Badge>
            <span className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">{handle}</span>
              {" · "}
              <span className="tabular-nums">{stats.games} games</span>
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {champion.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {player.gameName}&apos;s performance on {champion.name}
          </p>
        </div>
      </header>

      {/* Stat row */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Win rate" value={pct(stats.winRate)} accent />
        <StatCard label="Top 3 rate" value={pct(stats.top3Rate)} />
        <StatCard
          label="Avg placement"
          value={stats.avgPlacement.toFixed(2)}
          sub="out of 6"
        />
        <StatCard
          label="Avg KDA"
          value={stats.avgKda.toFixed(2)}
          sub={`${stats.avgKills.toFixed(1)} / ${stats.avgDeaths.toFixed(1)} / ${stats.avgAssists.toFixed(1)}`}
        />
        <StatCard label="Avg damage" value={kfmt(stats.avgDamage)} />
        <StatCard label="Avg gold" value={kfmt(stats.avgGold)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Builds + augments */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Built Items</CardTitle>
              <CardDescription>
                Items {player.gameName} builds most on {champion.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {topItems.map((it) => (
                <div key={it.itemId} className="flex items-center gap-3">
                  <ItemIcon itemId={it.itemId} name={it.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {it.name}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {pct(it.pickRate)}
                      </span>
                    </div>
                    <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.round(it.pickRate * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Augments</CardTitle>
              <CardDescription>
                Augments {player.gameName} takes most on {champion.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {topAugments.map((a) => (
                <AugmentTooltip
                  key={a.augmentId}
                  name={a.name}
                  rarity={a.rarity}
                  description={a.description}
                >
                  <span className="flex cursor-help items-center gap-3">
                    <AugmentIcon augmentId={a.augmentId} rarity={a.rarity} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{a.name}</span>
                      <RarityLabel rarity={a.rarity} />
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {pct(a.pickRate)}
                    </span>
                  </span>
                </AugmentTooltip>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Match history */}
        <Card>
          <CardHeader>
            <CardTitle>Match History</CardTitle>
            <CardDescription>
              {player.gameName}&apos;s recent {champion.name} games.
            </CardDescription>
          </CardHeader>
          <div className="flex max-h-[40rem] flex-col gap-2 overflow-y-auto px-4 pb-4">
            {matches.map((m) => {
              const win = m.placement === 1;
              const top3 = m.placement <= 3;
              return (
                <div
                  key={m.matchId}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-l-2 p-3 ${
                    win
                      ? "border-l-amber-400 bg-amber-400/5"
                      : top3
                        ? "border-l-emerald-400 bg-emerald-400/5"
                        : "border-l-rose-400/60 bg-muted/30"
                  }`}
                >
                  <PlacementBadge placement={m.placement} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium tabular-nums">
                      {m.kills} / {m.deaths} / {m.assists}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {timeAgo(m.gameEndTimestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.items.map((itemId, idx) => (
                      <ItemIcon
                        key={`${itemId}-${idx}`}
                        itemId={itemId}
                        name={`Item ${itemId}`}
                        size={26}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {m.augments.map((a, idx) => (
                      <AugmentTooltip
                        key={`${a.name}-${idx}`}
                        name={a.name}
                        rarity={a.rarity}
                        description={a.description}
                      >
                        <span className="cursor-help">
                          <AugmentIcon
                            augmentId={a.augmentId}
                            rarity={a.rarity}
                            size={22}
                          />
                        </span>
                      </AugmentTooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </main>
  );
}
