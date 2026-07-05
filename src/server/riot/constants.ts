/**
 * Static reference data used to decorate raw Match-V5 responses.
 *
 * The Match API only returns *ids* for champions and augments; human-readable
 * names, icons and augment rarities are resolved from static data sources
 * (Data Dragon for champions, Community Dragon for Arena augments). The tables
 * below stand in for those sources so the mock data can be rendered without a
 * network call — while keeping the id-based contract identical to production.
 */

export interface ChampionRef {
  id: number;
  name: string;
}

/** A small, real subset of the champion roster (ids match Data Dragon). */
export const CHAMPIONS: ChampionRef[] = [
  { id: 103, name: "Ahri" },
  { id: 22, name: "Ashe" },
  { id: 122, name: "Darius" },
  { id: 81, name: "Ezreal" },
  { id: 86, name: "Garen" },
  { id: 222, name: "Jinx" },
  { id: 55, name: "Katarina" },
  { id: 64, name: "LeeSin" },
  { id: 99, name: "Lux" },
  { id: 54, name: "Malphite" },
  { id: 111, name: "Nautilus" },
  { id: 555, name: "Pyke" },
  { id: 92, name: "Riven" },
  { id: 360, name: "Samira" },
  { id: 875, name: "Sett" },
  { id: 412, name: "Thresh" },
  { id: 67, name: "Vayne" },
  { id: 45, name: "Veigar" },
  { id: 254, name: "Vi" },
  { id: 157, name: "Yasuo" },
  { id: 777, name: "Yone" },
  { id: 238, name: "Zed" },
  { id: 115, name: "Ziggs" },
  { id: 221, name: "Zeri" },
];

export type AugmentRarity = "Silver" | "Gold" | "Prismatic";

export interface AugmentRef {
  id: number;
  name: string;
  rarity: AugmentRarity;
}

/**
 * A representative slice of Arena augments. Ids are stable local identifiers
 * (in production these are Community Dragon augment ids); names/rarities are
 * what a resolver would attach to each id.
 */
export const AUGMENTS: AugmentRef[] = [
  { id: 1, name: "Blade Waltz", rarity: "Prismatic" },
  { id: 2, name: "Ethereal Weapon", rarity: "Gold" },
  { id: 3, name: "Combo Mage", rarity: "Silver" },
  { id: 4, name: "Goredrink", rarity: "Prismatic" },
  { id: 5, name: "Soul Siphon", rarity: "Gold" },
  { id: 6, name: "Tank It Or Leave It", rarity: "Silver" },
  { id: 7, name: "Executioner", rarity: "Gold" },
  { id: 8, name: "First Aid Kit", rarity: "Silver" },
  { id: 9, name: "Ultimate Unstoppable", rarity: "Prismatic" },
  { id: 10, name: "Contract Killer", rarity: "Gold" },
  { id: 11, name: "Perfect Timing", rarity: "Silver" },
  { id: 12, name: "Symphony of War", rarity: "Prismatic" },
  { id: 13, name: "Big Brain", rarity: "Gold" },
  { id: 14, name: "Restless Restoration", rarity: "Silver" },
  { id: 15, name: "Dawnbringer's Resolve", rarity: "Prismatic" },
  { id: 16, name: "Rabble-Rousing", rarity: "Gold" },
  { id: 17, name: "Cure-All", rarity: "Silver" },
  { id: 18, name: "Warmup Routine", rarity: "Silver" },
];

const CHAMPION_BY_ID = new Map(CHAMPIONS.map((c) => [c.id, c]));
const AUGMENT_BY_ID = new Map(AUGMENTS.map((a) => [a.id, a]));

export function getChampion(id: number): ChampionRef | undefined {
  return CHAMPION_BY_ID.get(id);
}

export function getAugment(id: number): AugmentRef | undefined {
  return AUGMENT_BY_ID.get(id);
}
