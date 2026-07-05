// Drizzle schema for Arena (Match-V5) data.
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * Multi-project schema: every table is prefixed so this database can be shared.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `arena_tracker_${name}`);

/** One row per Arena match (a flattened view of Match-V5 `info`). */
export const arenaMatches = createTable(
  "match",
  (d) => ({
    matchId: d.text({ length: 32 }).primaryKey(),
    gameCreation: d.integer({ mode: "timestamp_ms" }).notNull(),
    gameEndTimestamp: d.integer({ mode: "timestamp_ms" }).notNull(),
    /** Duration in seconds. */
    gameDuration: d.integer({ mode: "number" }).notNull(),
    gameVersion: d.text({ length: 32 }).notNull(),
    queueId: d.integer({ mode: "number" }).notNull(),
    gameMode: d.text({ length: 16 }).notNull(),
    mapId: d.integer({ mode: "number" }).notNull(),
    ingestedAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [index("match_created_idx").on(t.gameCreation)],
);

/** One row per participant per match (a flattened Match-V5 participant). */
export const arenaParticipants = createTable(
  "participant",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    matchId: d
      .text({ length: 32 })
      .notNull()
      .references(() => arenaMatches.matchId),
    puuid: d.text({ length: 78 }).notNull(),
    riotIdGameName: d.text({ length: 32 }).notNull(),
    riotIdTagline: d.text({ length: 16 }).notNull(),
    championId: d.integer({ mode: "number" }).notNull(),
    championName: d.text({ length: 32 }).notNull(),
    // Arena-specific
    placement: d.integer({ mode: "number" }).notNull(),
    playerSubteamId: d.integer({ mode: "number" }).notNull(),
    playerAugment1: d.integer({ mode: "number" }).notNull(),
    playerAugment2: d.integer({ mode: "number" }).notNull(),
    playerAugment3: d.integer({ mode: "number" }).notNull(),
    playerAugment4: d.integer({ mode: "number" }).notNull(),
    win: d.integer({ mode: "boolean" }).notNull(),
    kills: d.integer({ mode: "number" }).notNull(),
    deaths: d.integer({ mode: "number" }).notNull(),
    assists: d.integer({ mode: "number" }).notNull(),
    totalDamageDealtToChampions: d.integer({ mode: "number" }).notNull(),
    goldEarned: d.integer({ mode: "number" }).notNull(),
  }),
  (t) => [
    index("participant_match_idx").on(t.matchId),
    index("participant_champion_idx").on(t.championName),
    index("participant_puuid_idx").on(t.puuid),
  ],
);

export type ArenaMatch = typeof arenaMatches.$inferSelect;
export type ArenaParticipant = typeof arenaParticipants.$inferSelect;
