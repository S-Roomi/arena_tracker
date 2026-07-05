import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <span
          className={cn(
            "text-3xl font-bold tabular-nums",
            accent && "text-primary",
          )}
        >
          {value}
        </span>
        {sub ? (
          <span className="text-muted-foreground text-xs">{sub}</span>
        ) : null}
      </CardContent>
    </Card>
  );
}
