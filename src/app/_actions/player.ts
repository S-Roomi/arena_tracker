"use server";

/**
 * Sign-in / sign-out for the "active player" the tracker profiles.
 *
 * Implemented as Server Actions (rather than tRPC mutations) specifically so
 * they can set/clear the httpOnly puuid cookie cleanly in the App Router. The
 * sign-in path resolves the Riot ID, ingests the player's Arena history into
 * the same tables the demo seed uses, then remembers them in a cookie.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ACTIVE_PUUID_COOKIE } from "~/server/auth/active-player";
import { db } from "~/server/db";
import { ingestMatches } from "~/server/db/ingest";
import {
  DEFAULT_REGION,
  fetchArenaHistory,
  isRegion,
  RiotApiError,
} from "~/server/riot/api";
import { FEATURED_PLAYER } from "~/server/riot/mock";

/** Returned to the sign-in form via `useActionState` to surface errors. */
export interface SignInState {
  error?: string;
}

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * How many of the player's most recent Arena matches to pull on sign-in. Deep
 * enough to page through a real history, but bounded to stay within Riot
 * development-key rate limits (one detail request per match).
 */
const HISTORY_COUNT = 50;

export async function signInPlayer(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const gameName = String(formData.get("gameName") ?? "").trim();
  // Accept "#NA1" or "NA1"; the leading # is decorative.
  const tagLine = String(formData.get("tagLine") ?? "")
    .trim()
    .replace(/^#/, "");
  const regionRaw = String(formData.get("region") ?? DEFAULT_REGION);
  const region = isRegion(regionRaw) ? regionRaw : DEFAULT_REGION;

  if (!gameName || !tagLine) {
    return { error: "Enter a Riot ID, e.g. ArenaGod #NA1." };
  }

  let puuid: string;
  try {
    const history = await fetchArenaHistory(
      gameName,
      tagLine,
      region,
      HISTORY_COUNT,
    );
    if (history.matches.length === 0) {
      return {
        error: `No Arena games found for ${history.gameName}#${history.tagLine}.`,
      };
    }
    await ingestMatches(db, history.matches);
    puuid = history.puuid;
  } catch (err) {
    if (err instanceof RiotApiError) return { error: err.message };
    console.error("[signInPlayer] unexpected error:", err);
    return { error: "Something went wrong looking up that player." };
  }

  const jar = await cookies();
  jar.set(ACTIVE_PUUID_COOKIE, puuid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });

  revalidatePath("/", "layout");
  return {};
}

export async function signOutPlayer(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_PUUID_COOKIE);
  revalidatePath("/", "layout");
}

/**
 * Sign in as the seeded demo player (no Riot key required). Lets the tracker be
 * explored on the deterministic mock data from `npm run db:seed`.
 */
export async function signInDemo(): Promise<void> {
  const jar = await cookies();
  jar.set(ACTIVE_PUUID_COOKIE, FEATURED_PLAYER.puuid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  revalidatePath("/", "layout");
}
