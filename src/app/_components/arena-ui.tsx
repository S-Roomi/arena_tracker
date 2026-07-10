import Image from "next/image";

import { type AugmentRarity } from "~/server/riot/constants";
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

/**
 * Item icon, served from the locally cached Data Dragon icons in
 * `public/items/{id}.png` (populated by `npm run items:fetch`).
 */
export function ItemIcon({
  itemId,
  name,
  size = 32,
}: {
  itemId: number;
  name: string;
  size?: number;
}) {
  return (
    <Image
      src={`/items/${itemId}.png`}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-md ring-1 ring-white/10"
      style={{ width: size, height: size }}
    />
  );
}

/** Per-rarity styling for augments — the primary visual signal in Arena. */
export const RARITY_STYLES: Record<
  AugmentRarity,
  { gradient: string; ring: string; icon: string; text: string }
> = {
  Silver: {
    gradient: "from-slate-400/25 to-slate-600/25",
    ring: "ring-slate-300/40",
    icon: "text-slate-200",
    text: "text-slate-300",
  },
  Gold: {
    gradient: "from-amber-400/25 to-yellow-600/25",
    ring: "ring-amber-300/50",
    icon: "text-amber-200",
    text: "text-amber-300",
  },
  Prismatic: {
    gradient: "from-fuchsia-500/25 via-cyan-400/25 to-emerald-400/25",
    ring: "ring-fuchsia-300/50",
    icon: "text-fuchsia-100",
    text: "text-fuchsia-300",
  },
};

/** Small rarity label, colored to match the augment's rarity. */
export function RarityLabel({ rarity }: { rarity: AugmentRarity }) {
  return (
    <span className={cn("text-xs font-medium", RARITY_STYLES[rarity].text)}>
      {rarity}
    </span>
  );
}

/** Colored pill for a 1-6 Arena placement. */
export function PlacementBadge({ placement }: { placement: number }) {
  const tone =
    placement === 1
      ? "bg-amber-400/15 text-amber-300 ring-amber-400/30"
      : placement <= 3
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

/**
 * Color for a win rate, ramping grey → green → red as the rate rises, then into
 * gold (the LoL accent) for the elite 60%+ tier. 0% is neutral grey, green
 * peaks around 33% (~2× the ~16.7% Arena baseline for 6 teams), red at 50%, and
 * 75%+ lands on gold. Returns a CSS color for an inline style.
 */
export function winRateColor(rate: number): string {
  const r = Math.max(rate, 0);
  if (r <= 0.25) {
    // grey → green
    const k = r / 0.25;
    return `hsl(145 ${65 * k}% ${62 - 14 * k}%)`;
  }
  if (r <= 0.5) {
    // green → red
    const k = (r - 0.25) / 0.25;
    return `hsl(${145 - 137 * k} ${65 + 5 * k}% ${48 + 7 * k}%)`;
  }
  // red → gold (#C89B3C ≈ hsl(41 56% 51%)), clamped to gold at 75%+
  const k = Math.min((r - 0.5) / 0.25, 1);
  return `hsl(${8 + 33 * k} ${70 - 14 * k}% ${55 - 4 * k}%)`;
}
