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
import { ingestMatches } from "./ingest";
import { arenaMatches, arenaParticipants } from "./schema";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (expected in .env).");
}

const db = drizzle(
  createClient({
    url,
    authToken:
      process.env.DATABASE_API_TOKEN ?? process.env.DATABASE_API_KEY,
  }),
  { schema },
);

async function seed() {
  const matches = generateMockMatches();
  console.log(`Seeding ${matches.length} Arena matches…`);

  // Idempotent: clear existing rows first (participants before matches, FK order).
  await db.delete(arenaParticipants);
  await db.delete(arenaMatches);

  // Same flattening a real ingestion pipeline performs (see ./ingest).
  await ingestMatches(db, matches);

  const [row] = await db.select({ value: count() }).from(arenaMatches);
  console.log(`Done. ${row?.value ?? 0} matches in the database.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
