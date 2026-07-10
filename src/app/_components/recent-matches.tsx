"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { ChampionIcon, PlacementBadge } from "./arena-ui";
import { AugmentIcon } from "./augment-icon";
import { AugmentTooltip } from "./augment-tooltip";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecentMatches({ player }: { player: string }) {
  const query = api.arena.getRecentMatches.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialCursor: 0,
    },
  );

  const matches = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
        <CardDescription>{player} · latest games first</CardDescription>
      </CardHeader>
      <ScrollArea viewportClassName="max-h-[26rem]">
        <div className="flex flex-col gap-2 px-4 pb-4">
          {matches.map((m) => {
            const f = m.featured;
            const win = f.placement === 1;
            const top3 = f.placement <= 3;
            return (
              <div
                key={m.matchId}
                className={`flex items-center gap-4 rounded-lg border-l-2 p-3 ${
                  win
                    ? "border-l-amber-400 bg-amber-400/5"
                    : top3
                      ? "border-l-emerald-400 bg-emerald-400/5"
                      : "border-l-rose-400/60 bg-muted/30"
                }`}
              >
                <ChampionIcon
                  championId={f.championId}
                  name={f.championName}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{f.championName}</span>
                    <PlacementBadge placement={f.placement} />
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="tabular-nums text-foreground/80">
                      {f.kills} / {f.deaths} / {f.assists}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      {f.augments.map((a) => (
                        <AugmentTooltip
                          key={a.augmentId}
                          name={a.name}
                          rarity={a.rarity}
                          description={a.description}
                        >
                          <AugmentIcon
                            augmentId={a.augmentId}
                            rarity={a.rarity}
                            size={22}
                          />
                        </AugmentTooltip>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground shrink-0 text-right text-xs">
                  <div>{timeAgo(m.gameEndTimestamp)}</div>
                  <div className="tabular-nums">{duration(m.gameDuration)}</div>
                </div>
              </div>
            );
          })}

          {query.isLoading ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Loading matches…
            </p>
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No Arena matches found.
            </p>
          ) : null}
        </div>
      </ScrollArea>

      {query.hasNextPage ? (
        <div className="border-border/60 border-t p-3 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
