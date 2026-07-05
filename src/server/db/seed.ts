/**
 * Seeds the SQLite database with mock Arena matches.
 *
 * Run with:  npm run db:seed
 *
 * The mock payloads are full Match-V5 DTOs; this script performs the same
 * flattening a real ingestion pipeline would when persisting them.
 *
 * It builds its own libSQL client (rather than importing the app's db module)
 * so it can run as a plain script without Next.js's env plumbing.
 */

import "dotenv/config";

import { createClient } from "@libsql/client";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { generateMockMatches } from "../riot/mock";
import { arenaMatches, arenaParticipants } from "./schema";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (expected in .env).");
}

const db = drizzle(createClient({ url }), { schema });

async function seed() {
  const matches = generateMockMatches(40);
  console.log(`Seeding ${matches.length} Arena matches…`);

  // Idempotent: clear existing rows first (participants before matches, FK order).
  await db.delete(arenaParticipants);
  await db.delete(arenaMatches);

  for (const { metadata, info } of matches) {
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
      })),
    );
  }

  const [row] = await db.select({ value: count() }).from(arenaMatches);
  console.log(`Done. ${row?.value ?? 0} matches in the database.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
