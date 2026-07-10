/**
 * Fetches and caches item icons from Data Dragon for the items in ITEMS.
 *
 * Run with:  npm run items:fetch
 *
 * Icons are written to `public/items/{itemId}.png` (served statically as
 * `/items/{id}.png`). Ids are real Data Dragon item ids, matching the ids the
 * Match-V5 API returns in each participant's item slots.
 *
 * Already-cached icons are skipped, so the script is safe to re-run.
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ITEMS } from "../src/server/riot/constants";

const OUT_DIR = join(process.cwd(), "public", "items");

async function latestVersion(): Promise<string> {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!res.ok) throw new Error(`versions.json: HTTP ${res.status}`);
  const versions = (await res.json()) as string[];
  const v = versions[0];
  if (!v) throw new Error("No Data Dragon versions returned.");
  return v;
}

async function downloadIcon(version: string, id: number): Promise<void> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`item ${id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `${id}.png`), buf);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const version = await latestVersion();
  const existing = new Set(
    (await readdir(OUT_DIR)).filter((f) => f.endsWith(".png")),
  );
  const missing = ITEMS.filter((i) => !existing.has(`${i.id}.png`));

  console.log(
    `Data Dragon ${version}: ${ITEMS.length} items, ${existing.size} cached, ${missing.length} to fetch.`,
  );

  let done = 0;
  let failed = 0;
  for (const item of missing) {
    try {
      await downloadIcon(version, item.id);
      done++;
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${item.name} (${item.id}):`, (err as Error).message);
    }
  }

  console.log(`Cached ${done} new icon(s)${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error("Item icon fetch failed:", err);
  process.exit(1);
});
