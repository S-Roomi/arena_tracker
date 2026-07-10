/**
 * Generates the static reference tables that decorate raw Match-V5 ids with
 * human-readable names (and augment rarities / item kinds).
 *
 * Run with:  npm run data:fetch
 *
 * Match-V5 returns only *ids* for champions, items and augments. To render real
 * players' matches — not just the curated demo roster — we need the *complete*
 * id→name maps. This script pulls them from the same static sources production
 * trackers use and writes them to `src/server/riot/data/*.json`, which
 * `constants.ts` imports. The JSON is committed so the app builds without a
 * network call; re-run this after a patch adds new champions/items/augments.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CDRAGON =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1";
const ARENA_DATA_URL =
  "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json";

const OUT_DIR = join(process.cwd(), "src", "server", "riot", "data");

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ---- Champions ----------------------------------------------------------

interface ChampionSummary {
  id: number;
  name: string;
}

async function buildChampions() {
  const all = await getJson<ChampionSummary[]>(`${CDRAGON}/champion-summary.json`);
  return all
    .filter((c) => c.id > 0) // id -1 is the "None" sentinel
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.id - b.id);
}

// ---- Items --------------------------------------------------------------

const AP_TAGS = ["SpellDamage", "Mana", "ManaRegen", "AbilityHaste"];
const AD_TAGS = ["Damage", "AttackSpeed", "CriticalStrike", "LifeSteal"];
const TANK_TAGS = ["Armor", "Health", "SpellBlock", "HealthRegen"];

function itemKind(tags: string[]): "AD" | "AP" | "Tank" | "Boots" {
  if (tags.includes("Boots")) return "Boots";
  if (tags.some((t) => AP_TAGS.includes(t))) return "AP";
  if (tags.some((t) => AD_TAGS.includes(t))) return "AD";
  if (tags.some((t) => TANK_TAGS.includes(t))) return "Tank";
  return "AD";
}

interface DDragonItem {
  name: string;
  tags?: string[];
}

async function buildItems() {
  const versions = await getJson<string[]>(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  );
  const version = versions[0];
  if (!version) throw new Error("No Data Dragon versions returned.");

  const data = await getJson<{ data: Record<string, DDragonItem> }>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
  );

  return Object.entries(data.data)
    .filter(([, item]) => Boolean(item.name))
    .map(([id, item]) => ({
      id: Number(id),
      name: item.name,
      kind: itemKind(item.tags ?? []),
    }))
    .sort((a, b) => a.id - b.id);
}

// ---- Augments -----------------------------------------------------------

const RARITY: Record<number, "Silver" | "Gold" | "Prismatic"> = {
  0: "Silver",
  1: "Gold",
  2: "Prismatic",
};

/** Turn Community Dragon's HTML/templated description into plain text. */
function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/@[^@]+@/g, "X") // templated values like @MaxStacks@
    .replace(/%[^%]+%/g, "") // inline icon tokens like %i:cooldown%
    .replace(/\s+/g, " ")
    .trim();
}

interface CDragonAugment {
  id: number;
  name: string;
  rarity: number;
  desc: string;
}

async function buildAugments() {
  const data = await getJson<{ augments: CDragonAugment[] }>(ARENA_DATA_URL);
  return data.augments
    .filter((a) => a.id > 0 && a.name)
    .map((a) => ({
      id: a.id,
      name: a.name,
      rarity: RARITY[a.rarity] ?? "Prismatic",
      description: plainText(a.desc ?? ""),
    }))
    .sort((a, b) => a.id - b.id);
}

// ---- Main ---------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const [champions, items, augments] = await Promise.all([
    buildChampions(),
    buildItems(),
    buildAugments(),
  ]);

  await Promise.all([
    writeFile(join(OUT_DIR, "champions.json"), JSON.stringify(champions, null, 2) + "\n"),
    writeFile(join(OUT_DIR, "items.json"), JSON.stringify(items, null, 2) + "\n"),
    writeFile(join(OUT_DIR, "augments.json"), JSON.stringify(augments, null, 2) + "\n"),
  ]);

  console.log(
    `Wrote reference data: ${champions.length} champions, ${items.length} items, ${augments.length} augments.`,
  );
}

main().catch((err) => {
  console.error("Reference data fetch failed:", err);
  process.exit(1);
});
