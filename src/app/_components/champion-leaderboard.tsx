"use client";

import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ScrollArea } from "~/components/ui/scroll-area";
import { ChampionIcon, pct, winRateColor } from "./arena-ui";
import {
  SortHead,
  useSort,
  type SortColumn,
} from "./sortable-table";

export interface ChampionRow {
  championId: number;
  championName: string;
  games: number;
  winRate: number;
  top3Rate: number;
  avgPlacement: number;
}

type Key = "championName" | "games" | "winRate" | "top3Rate" | "avgPlacement";

const COLUMNS: SortColumn<Key>[] = [
  { key: "championName", label: "Champion", defaultDir: "asc", align: "left" },
  { key: "games", label: "Games", defaultDir: "desc", align: "right" },
  { key: "winRate", label: "Win %", defaultDir: "desc", align: "right" },
  { key: "top3Rate", label: "Top 3 %", defaultDir: "desc", align: "right" },
  { key: "avgPlacement", label: "Avg Place", defaultDir: "asc", align: "right" },
];

export function ChampionLeaderboard({
  rows,
  player,
}: {
  rows: ChampionRow[];
  player: string;
}) {
  const { sorted, sort, toggle } = useSort<ChampionRow, Key>(
    rows,
    { key: "top3Rate", dir: "desc" },
    (row, key) => row[key],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Champion Leaderboard</CardTitle>
        <CardDescription>
          {player}&apos;s champions — click a column to sort.
        </CardDescription>
      </CardHeader>
      <ScrollArea viewportClassName="max-h-[26rem]" scrollbarClassName="top-10!">
        <Table containerClassName="overflow-visible! pr-2.5">
          <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow>
            <TableHead className="font-heading w-10 text-center">#</TableHead>
            {COLUMNS.map((col) => (
              <SortHead
                key={col.key}
                column={col}
                active={sort.key === col.key}
                dir={sort.dir}
                onSort={toggle}
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r, i) => (
            <TableRow key={r.championId} className="hover:bg-muted/50">
              <TableCell className="text-muted-foreground text-center tabular-nums">
                {i + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/champion/${r.championId}`}
                  className="group flex items-center gap-3"
                >
                  <ChampionIcon championId={r.championId} name={r.championName} />
                  <span className="font-medium group-hover:underline">
                    {r.championName}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.games}</TableCell>
              <TableCell
                className="text-right font-medium tabular-nums"
                style={{ color: winRateColor(r.winRate) }}
              >
                {pct(r.winRate)}
              </TableCell>
              <TableCell className="text-right font-medium text-emerald-300 tabular-nums">
                {pct(r.top3Rate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.avgPlacement.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
