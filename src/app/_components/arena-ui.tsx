import Image from "next/image";

import { cn } from "~/lib/utils";

/**
 * Champion portrait, served from the locally cached Community Dragon icons in
 * `public/champions/{id}.png` (populated by `npm run icons:fetch`). The
 * Match-V5 API returns champion ids, so the cache is keyed by id.
 */
export function ChampionIcon({
  championId,
  name,
  size = 36,
}: {
  championId: number;
  name: string;
  size?: number;
}) {
  return (
    <Image
      src={`/champions/${championId}.png`}
      alt={name}
      width={size}
      height={size}
      // Icons are already 128px static PNGs; skip the optimizer (no benefit,
      // and it avoids the Next 15.5 image-cache bug).
      unoptimized
      className="shrink-0 rounded-md object-cover ring-1 ring-white/10"
      style={{ width: size, height: size }}
    />
  );
}

/** Colored pill for a 1-8 Arena placement. */
export function PlacementBadge({ placement }: { placement: number }) {
  const tone =
    placement === 1
      ? "bg-amber-400/15 text-amber-300 ring-amber-400/30"
      : placement <= 4
        ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
        : "bg-rose-400/10 text-rose-300 ring-rose-400/25";
  const suffix =
    placement === 1
      ? "st"
      : placement === 2
        ? "nd"
        : placement === 3
          ? "rd"
          : "th";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset tabular-nums",
        tone,
      )}
    >
      {placement}
      {suffix}
    </span>
  );
}

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
