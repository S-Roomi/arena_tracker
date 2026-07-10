"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { type AugmentRarity } from "~/server/riot/constants";
import { cn } from "~/lib/utils";
import { RARITY_STYLES } from "./arena-ui";

/**
 * Augment icon, served from the locally cached Community Dragon art in
 * `public/augments/{id}.png` (populated by `npm run augments:fetch`). Match-V5
 * returns augment ids, so the cache is keyed by id.
 *
 * Not every augment has cached art (a fictional or brand-new augment may not
 * resolve to a Community Dragon icon), so we fall back to a rarity-tinted chip —
 * rarity being the defining visual cue for augments in Arena.
 */
export function AugmentIcon({
  augmentId,
  rarity,
  size = 36,
}: {
  augmentId: number;
  rarity: AugmentRarity;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const s = RARITY_STYLES[rarity];

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br ring-1 ring-inset",
          s.gradient,
          s.ring,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Sparkles className={s.icon} style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }

  return (
    <Image
      src={`/augments/${augmentId}.png`}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-md ring-1 ring-inset", s.ring)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
