"use client";

import { type ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { type AugmentRarity } from "~/server/riot/constants";
import { cn } from "~/lib/utils";

/**
 * Rarity-matched tooltip styling. `border` sets the tinted edge + glow (Prismatic
 * stays transparent and layers in the animated `.augment-tooltip-prismatic`
 * ring); `bg` is a dark, opaque gradient in the same hue so the panel reads as
 * that rarity while staying legible (the app is always dark); `body`/`label`
 * are light-on-dark text tones tuned for contrast against `bg`.
 */
const RARITY_STYLE: Record<
  AugmentRarity,
  { border: string; bg: string; body: string; label: string }
> = {
  Silver: {
    border: "border-slate-300/60 shadow-[0_0_28px_-6px] shadow-slate-300/40",
    bg: "bg-linear-to-br from-slate-700/95 to-slate-950/95",
    body: "text-slate-200/90",
    label: "text-slate-200",
  },
  Gold: {
    border: "border-amber-400/70 shadow-[0_0_28px_-5px] shadow-amber-400/50",
    bg: "bg-linear-to-br from-amber-800/95 via-amber-950/95 to-neutral-950/95",
    body: "text-amber-100/90",
    label: "text-amber-200",
  },
  Prismatic: {
    border:
      "relative border-transparent shadow-[0_0_30px_-6px] shadow-fuchsia-500/50",
    bg: "bg-linear-to-br from-fuchsia-900/90 via-indigo-950/95 to-cyan-900/90",
    body: "text-fuchsia-50/90",
    label: "text-fuchsia-200",
  },
};

export interface AugmentInfo {
  name: string;
  rarity: AugmentRarity;
  description: string;
}

/** Wraps any element so hovering it reveals the augment's details. */
export function AugmentTooltip({
  name,
  rarity,
  description,
  children,
}: AugmentInfo & { children: ReactNode }) {
  const style = RARITY_STYLE[rarity];
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="cursor-help" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          "flex max-w-sm flex-col items-start gap-2 border-2 p-4",
          style.bg,
          style.border,
        )}
      >
        {rarity === "Prismatic" && (
          <span aria-hidden className="augment-tooltip-prismatic" />
        )}
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold text-white">{name}</span>
          <span
            className={cn(
              "text-[11px] font-semibold tracking-wide uppercase",
              style.label,
            )}
          >
            {rarity}
          </span>
        </div>
        <p className={cn("text-sm leading-relaxed", style.body)}>
          {description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
