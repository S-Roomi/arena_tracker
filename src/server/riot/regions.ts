/**
 * Regional routing clusters for the Riot API. Both Account-V1 and Match-V5 are
 * routed by region (not by platform like NA1/EUW1), so this is the value the
 * sign-in form picks.
 *
 * Kept free of any server-only imports so the client sign-in form can render the
 * region options too.
 */

export const REGIONS = {
  americas: "Americas",
  asia: "Asia",
  europe: "Europe",
  sea: "SEA",
} as const;

export type Region = keyof typeof REGIONS;

export const DEFAULT_REGION: Region = "americas";

export function isRegion(value: string): value is Region {
  return value in REGIONS;
}
