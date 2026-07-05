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
import { ChampionIcon, pct } from "./arena-ui";

export interface ChampionRow {
  championId: number;
  championName: string;
  games: number;
  winRate: number;
  top4Rate: number;
  avgPlacement: number;
}

export function ChampionLeaderboard({ rows }: { rows: ChampionRow[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Champion Leaderboard</CardTitle>
        <CardDescription>
          Ranked by top-4 rate across all tracked Arena games.
        </CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Champion</TableHead>
              <TableHead className="text-right">Games</TableHead>
              <TableHead className="text-right">Win %</TableHead>
              <TableHead className="text-right">Top 4 %</TableHead>
              <TableHead className="text-right">Avg Place</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.championId}>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ChampionIcon
                      championId={r.championId}
                      name={r.championName}
                    />
                    <span className="font-medium">{r.championName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.games}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pct(r.winRate)}
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-300 tabular-nums">
                  {pct(r.top4Rate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.avgPlacement.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
