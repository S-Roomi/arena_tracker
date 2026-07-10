/**
 * Fetches and caches Arena augment icons from Community Dragon for the augments
 * in AUGMENTS.
 *
 * Run with:  npm run augments:fetch
 *
 * Icons are written to `public/augments/{augmentId}.png` (served statically as
 * `/augments/{id}.png`), keyed by the id the Match-V5 API returns in each
 * participant's `playerAugment1`–`playerAugment4`.
 *
 * Match-V5 returns only augment *ids*; the art itself lives in Community
 * Dragon's Arena (CHERRY) data, keyed there by name. We resolve each augment by
 * a punctuation-insensitive name match, then download its `iconLarge`. Augments
 * with no Community Dragon match are skipped (the UI falls back to a
 * rarity-tinted chip for those).
 *
 * Already-cached icons are skipped, so the script is safe to re-run.
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { AUGMENTS } from "../src/server/riot/constants";

const ARENA_DATA_URL =
  "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json";
const gameAsset = (path: string) =>
  `https://raw.communitydragon.org/latest/game/${path.toLowerCase()}`;

const OUT_DIR = join(process.cwd(), "public", "augments");
const CONCURRENCY = 8;

interface CDragonAugment {
  name: string;
  iconLarge: string;
  iconSmall: string;
}

/** Collapse to lowercase alphanumerics so "First Aid Kit" ≈ "First-Aid Kit". */
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

async function fetchIconIndex(): Promise<Map<string, string>> {
  const res = await fetch(ARENA_DATA_URL);
  if (!res.ok) throw new Error(`arena data: HTTP ${res.status}`);
  const data = (await res.json()) as { augments: CDragonAugment[] };
  return new Map(
    data.augments
      .filter((a) => a.iconLarge)
      .map((a) => [normalize(a.name), a.iconLarge]),
  );
}

async function downloadIcon(iconPath: string, id: number): Promise<void> {
  const res = await fetch(gameAsset(iconPath));
  if (!res.ok) throw new Error(`augment ${id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `${id}.png`), buf);
}

/** Run `worker` over `items` with a bounded number of concurrent workers. */
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

  const iconIndex = await fetchIconIndex();
  const existing = new Set(
    (await readdir(OUT_DIR)).filter((f) => f.endsWith(".png")),
  );

  const targets = AUGMENTS.filter((a) => !existing.has(`${a.id}.png`)).map(
    (a) => ({ ...a, iconPath: iconIndex.get(normalize(a.name)) }),
  );
  const missing = targets.filter((t) => !t.iconPath);
  const toFetch = targets.filter((t) => t.iconPath);

  console.log(
    `${AUGMENTS.length} augments, ${existing.size} cached, ${toFetch.length} to fetch.`,
  );
  for (const m of missing) {
    console.warn(`  ⚠ no Community Dragon icon for "${m.name}" (${m.id}) — skipping.`);
  }

  let done = 0;
  let failed = 0;
  await runPool(toFetch, async (t) => {
    try {
      await downloadIcon(t.iconPath!, t.id);
      done++;
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${t.name} (${t.id}):`, (err as Error).message);
    }
  });

  console.log(`Cached ${done} new icon(s)${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error("Augment icon fetch failed:", err);
  process.exit(1);
});
