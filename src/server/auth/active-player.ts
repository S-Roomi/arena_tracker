/**
 * The "active player" — which summoner the tracker is currently profiling.
 *
 * A Riot development key + Account-V1 can resolve any Riot ID to a puuid but
 * cannot verify identity, so this is deliberately an *identification* cookie
 * ("show me this player"), not an authenticated session. The puuid is written
 * by the sign-in server action (`src/app/_actions/player.ts`) and read back into
 * the tRPC context so every query filters on it.
 */

import { cookies } from "next/headers";

/** Cookie holding the active player's puuid. */
export const ACTIVE_PUUID_COOKIE = "arena_active_puuid";

/**
 * Read the active player's puuid from the cookie store.
 *
 * Uses `next/headers` `cookies()` rather than parsing the raw request `cookie`
 * header so that a cookie just set by a server action (sign in / out) is
 * reflected in the same render pass — otherwise the page would only update the
 * active player after a full browser refresh.
 */
export async function getActivePuuid(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTIVE_PUUID_COOKIE)?.value ?? null;
}
