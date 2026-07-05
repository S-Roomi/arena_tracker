/**
 * Fetches and caches champion square icons from the Community Dragon API.
 *
 * Run with:  npm run icons:fetch
 *
 * Icons are written to `public/champions/{championId}.png` so Next.js serves
 * them as static assets (referenced as `/champions/{id}.png`). The Match-V5
 * API returns champion *ids*, so keying the cache by id matches that contract.
 *
 * Already-cached icons are skipped, making the script safe to re-run (e.g.
 * after a patch adds new champions).
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CDRAGON = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1";
const SUMMARY_URL = `${CDRAGON}/champion-summary.json`;
const iconUrl = (id: number) => `${CDRAGON}/champion-icons/${id}.png`;

const OUT_DIR = join(process.cwd(), "public", "champions");
const CONCURRENCY = 8;

interface ChampionSummary {
  id: number;
  name: string;
  alias: string;
}

async function fetchSummary(): Promise<ChampionSummary[]> {
  const res = await fetch(SUMMARY_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch champion summary: ${res.status}`);
  }
  const all = (await res.json()) as ChampionSummary[];
  // id -1 is the "None" sentinel; skip it.
  return all.filter((c) => c.id > 0);
}

async function downloadIcon(id: number): Promise<void> {
  const res = await fetch(iconUrl(id));
  if (!res.ok) {
    throw new Error(`icon ${id}: HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `${id}.png`), buf);
}

/** Run `tasks` with a bounded number of concurrent workers. */
async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let index = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (index < items.length) {
      const i = index++;
      await worker(items[i]!);
    }
  });
  await Promise.all(workers);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const champions = await fetchSummary();
  const existing = new Set(
    (await readdir(OUT_DIR)).filter((f) => f.endsWith(".png")),
  );

  const missing = champions.filter((c) => !existing.has(`${c.id}.png`));
  console.log(
    `${champions.length} champions total, ${existing.size} cached, ${missing.length} to fetch.`,
  );

  let done = 0;
  let failed = 0;
  await runPool(missing, async (c) => {
    try {
      await downloadIcon(c.id);
      done++;
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${c.name} (${c.id}):`, (err as Error).message);
    }
  });

  console.log(`Cached ${done} new icon(s)${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error("Icon fetch failed:", err);
  process.exit(1);
});
