/**
 * Shared ingestion: flatten Match-V5 {@link MatchDto}s into the `arena_match` /
 * `arena_participant` rows this app queries.
 *
 * This is the one place the nested Match-V5 shape is turned into flat rows, used
 * by both the demo seed ({@link ./seed}) and the live sign-in flow
 * (`src/app/_actions/player.ts`). Keeping it shared means the real ingestion
 * pipeline and the mock one stay byte-for-byte identical downstream.
 */

import { inArray } from "drizzle-orm";
import { type LibSQLDatabase } from "drizzle-orm/libsql";

import { type MatchDto } from "../riot/types";
import { arenaMatches, arenaParticipants } from "./schema";
import * as schema from "./schema";

type Db = LibSQLDatabase<typeof schema>;

export interface IngestResult {
  /** Matches newly written (already-stored matches are skipped). */
  inserted: number;
  /** Matches skipped because they were already in the database. */
  skipped: number;
}

/**
 * Persist a batch of Match-V5 DTOs. Idempotent per `matchId`: any match already
 * stored is skipped whole, so repeated sign-ins never duplicate rows and many
 * players can coexist in one database.
 */
export async function ingestMatches(
  db: Db,
  matches: MatchDto[],
): Promise<IngestResult> {
  if (matches.length === 0) return { inserted: 0, skipped: 0 };

  const ids = matches.map((m) => m.metadata.matchId);
  const existing = await db
    .select({ matchId: arenaMatches.matchId })
    .from(arenaMatches)
    .where(inArray(arenaMatches.matchId, ids));
  const existingIds = new Set(existing.map((r) => r.matchId));

  let inserted = 0;
  for (const { metadata, info } of matches) {
    if (existingIds.has(metadata.matchId)) continue;

    await db.insert(arenaMatches).values({
      matchId: metadata.matchId,
      gameCreation: new Date(info.gameCreation),
      gameEndTimestamp: new Date(info.gameEndTimestamp),
      gameDuration: info.gameDuration,
      gameVersion: info.gameVersion,
      queueId: info.queueId,
      gameMode: info.gameMode,
      mapId: info.mapId,
    });

    await db.insert(arenaParticipants).values(
      info.participants.map((p) => ({
        matchId: metadata.matchId,
        puuid: p.puuid,
        riotIdGameName: p.riotIdGameName,
        riotIdTagline: p.riotIdTagline,
        championId: p.championId,
        championName: p.championName,
        placement: p.placement,
        playerSubteamId: p.playerSubteamId,
        // Arena awards up to 6 augments; we keep the existing 4-column schema
        // and store the first four (a deliberate fidelity trade-off).
        playerAugment1: p.playerAugment1,
        playerAugment2: p.playerAugment2,
        playerAugment3: p.playerAugment3,
        playerAugment4: p.playerAugment4,
        win: p.win,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        totalDamageDealtToChampions: p.totalDamageDealtToChampions,
        goldEarned: p.goldEarned,
        item0: p.item0,
        item1: p.item1,
        item2: p.item2,
        item3: p.item3,
        item4: p.item4,
        item5: p.item5,
      })),
    );
    inserted++;
  }

  return { inserted, skipped: matches.length - inserted };
}
