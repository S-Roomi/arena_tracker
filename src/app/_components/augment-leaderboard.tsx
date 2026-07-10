"use client";

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
import { type AugmentRarity } from "~/server/riot/constants";
import { RarityLabel, pct, winRateColor } from "./arena-ui";
import { AugmentIcon } from "./augment-icon";
import { AugmentTooltip } from "./augment-tooltip";
import {
  SortHead,
  useSort,
  type SortColumn,
} from "./sortable-table";

export interface AugmentRow {
  augmentId: number;
  name: string;
  rarity: AugmentRarity;
  description: string;
  picks: number;
  winRate: number;
  top3Rate: number;
  avgPlacement: number;
}

type Key = "name" | "picks" | "winRate" | "top3Rate" | "avgPlacement";

const COLUMNS: SortColumn<Key>[] = [
  { key: "name", label: "Augment", defaultDir: "asc", align: "left" },
  { key: "picks", label: "Picks", defaultDir: "desc", align: "right" },
  { key: "winRate", label: "Win %", defaultDir: "desc", align: "right" },
  { key: "top3Rate", label: "Top 3 %", defaultDir: "desc", align: "right" },
  { key: "avgPlacement", label: "Avg Place", defaultDir: "asc", align: "right" },
];

export function AugmentLeaderboard({
  rows,
  player,
}: {
  rows: AugmentRow[];
  player: string;
}) {
  const { sorted, sort, toggle } = useSort<AugmentRow, Key>(
    rows,
    { key: "winRate", dir: "desc" },
    (row, key) => row[key],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Augment Win Rates</CardTitle>
        <CardDescription>
          {player}&apos;s augments — click a column to sort.
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
            <TableRow key={r.augmentId}>
              <TableCell className="text-muted-foreground text-center tabular-nums">
                {i + 1}
              </TableCell>
              <TableCell>
                <AugmentTooltip
                  name={r.name}
                  rarity={r.rarity}
                  description={r.description}
                >
                  <span className="flex items-center gap-3">
                    <AugmentIcon augmentId={r.augmentId} rarity={r.rarity} />
                    <span className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      <RarityLabel rarity={r.rarity} />
                    </span>
                  </span>
                </AugmentTooltip>
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.picks}</TableCell>
              <TableCell
                className="text-right font-medium tabular-nums"
                style={{ color: winRateColor(r.winRate) }}
              >
                {pct(r.winRate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
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
