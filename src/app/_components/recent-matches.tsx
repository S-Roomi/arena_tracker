import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ChampionIcon, PlacementBadge } from "./arena-ui";

export interface RecentMatch {
  matchId: string;
  gameEndTimestamp: Date;
  gameDuration: number;
  featured: {
    championId: number;
    championName: string;
    placement: number;
    kills: number;
    deaths: number;
    assists: number;
    augments: string[];
  } | null;
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecentMatches({ matches }: { matches: RecentMatch[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
        <CardDescription>ArenaGod#NA1 · latest games</CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {matches.map((m) => {
          const f = m.featured;
          if (!f) return null;
          const win = f.placement === 1;
          const top4 = f.placement <= 4;
          return (
            <div
              key={m.matchId}
              className={`flex items-center gap-4 rounded-lg border-l-2 p-3 ${
                win
                  ? "border-l-amber-400 bg-amber-400/5"
                  : top4
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
                  {f.augments.slice(0, 2).map((a) => (
                    <Badge key={a} variant="secondary" className="font-normal">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-muted-foreground shrink-0 text-right text-xs">
                <div>{timeAgo(m.gameEndTimestamp)}</div>
                <div className="tabular-nums">{duration(m.gameDuration)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
