/**
 * Live Riot API client — the real-data counterpart to {@link ./mock}.
 *
 * It resolves a Riot ID to a puuid (Account-V1) and pulls that player's Arena
 * match history (Match-V5), returning the exact same {@link MatchDto} shape the
 * mock generator produces. Everything downstream (ingestion, schema, queries)
 * therefore stays agnostic to whether the data is real or synthetic — the
 * central design principle of this project.
 *
 * @see https://developer.riotgames.com/apis#account-v1
 * @see https://developer.riotgames.com/apis#match-v5
 */

import "server-only";

import { env } from "~/env";
import { type Region } from "./regions";
import { ARENA_QUEUE_ID, type MatchDto } from "./types";

export { DEFAULT_REGION, isRegion, REGIONS, type Region } from "./regions";

/** Account-V1 is only served from americas/asia/europe; fold SEA into asia. */
function accountHost(region: Region): string {
  const routing = region === "sea" ? "asia" : region;
  return `https://${routing}.api.riotgames.com`;
}

function matchHost(region: Region): string {
  return `https://${region}.api.riotgames.com`;
}

/** How the live lookup failed, so the UI can show a friendly message. */
export type RiotErrorKind =
  | "no-key"
  | "not-found"
  | "unauthorized"
  | "rate-limited"
  | "unknown";

export class RiotApiError extends Error {
  constructor(
    readonly kind: RiotErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

function requireKey(): string {
  if (!env.RIOT_API_KEY) {
    throw new RiotApiError(
      "no-key",
      "RIOT_API_KEY is not set. Add a Riot API key to .env to look up players.",
    );
  }
  return env.RIOT_API_KEY;
}

const MAX_RETRIES = 2;

/** A single GET with the API key header, JSON parsing, and 429 backoff. */
async function riotGet<T>(url: string): Promise<T> {
  const key = requireKey();

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": key },
      cache: "no-store",
    });

    if (res.ok) return (await res.json()) as T;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
      await sleep((Number.isFinite(retryAfter) ? retryAfter : 1) * 1000);
      continue;
    }

    throw toError(res.status);
  }
}

function toError(status: number): RiotApiError {
  switch (status) {
    case 404:
      return new RiotApiError("not-found", "No player found for that Riot ID.");
    case 401:
    case 403:
      return new RiotApiError(
        "unauthorized",
        "Riot API key is invalid or expired. Development keys expire every 24h.",
      );
    case 429:
      return new RiotApiError(
        "rate-limited",
        "Riot API rate limit reached. Please try again in a moment.",
      );
    default:
      return new RiotApiError("unknown", `Riot API request failed (${status}).`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface AccountDto {
  puuid: string;
  gameName: string;
  tagLine: string;
}

/** Resolve a Riot ID (game name + tagline) to a puuid via Account-V1. */
export async function resolveAccount(
  gameName: string,
  tagLine: string,
  region: Region,
): Promise<AccountDto> {
  const url =
    `${accountHost(region)}/riot/account/v1/accounts/by-riot-id/` +
    `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotGet<AccountDto>(url);
}

/** List a player's most recent Arena (queue 1700) match ids via Match-V5. */
export async function getArenaMatchIds(
  puuid: string,
  region: Region,
  count: number,
): Promise<string[]> {
  const url =
    `${matchHost(region)}/lol/match/v5/matches/by-puuid/` +
    `${encodeURIComponent(puuid)}/ids?queue=${ARENA_QUEUE_ID}&start=0&count=${count}`;
  return riotGet<string[]>(url);
}

/** Fetch a single full match DTO via Match-V5. */
export async function getMatch(
  matchId: string,
  region: Region,
): Promise<MatchDto> {
  const url = `${matchHost(region)}/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
  return riotGet<MatchDto>(url);
}

/** Run `worker` over `items` with a bounded number of concurrent workers. */
async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]!);
    }
  });
  await Promise.all(workers);
  return results;
}

export interface ArenaHistory {
  puuid: string;
  gameName: string;
  tagLine: string;
  matches: MatchDto[];
}

/**
 * The full sign-in fetch: Riot ID → puuid → recent Arena matches. Match detail
 * requests are throttled (bounded concurrency + 429 retry) to stay within
 * development-key rate limits.
 */
export async function fetchArenaHistory(
  gameName: string,
  tagLine: string,
  region: Region,
  count = 20,
): Promise<ArenaHistory> {
  const account = await resolveAccount(gameName, tagLine, region);
  const matchIds = await getArenaMatchIds(account.puuid, region, count);
  const matches = await runPool(matchIds, 5, (id) => getMatch(id, region));

  return {
    puuid: account.puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
    matches,
  };
}
