/**
 * Deterministic mock generator for Arena (Match-V5) data.
 *
 * Every object returned here conforms to {@link MatchDto} exactly as the live
 * `GET /lol/match/v5/matches/{matchId}` endpoint would return it for an Arena
 * game, so the seed/query code below never has to know the data is synthetic.
 *
 * The generation is seeded (mulberry32) so the dataset — and therefore the
 * demo landing page — is stable across restarts.
 */

import {
  MOCK_CHAMPIONS,
  AUGMENTS,
  MOCK_ITEMS,
  type ChampionRef,
} from "./constants";
import {
  ARENA_GAME_MODE,
  ARENA_MAP_ID,
  ARENA_QUEUE_ID,
  type MatchDto,
  type ParticipantDto,
} from "./types";

/** The summoner whose profile this demo renders. Present in every match. */
export const FEATURED_PLAYER = {
  puuid: "FEATURED-PUUID-0000000000000000000000000000000000000000000000000000",
  riotIdGameName: "ArenaGod",
  riotIdTagline: "NA1",
  summonerName: "ArenaGod",
} as const;

const PLATFORM = "NA1";
const OPPONENT_NAMES = [
  "Blitzcrankd", "MidDiff", "TeemoStepped", "0MS", "FlashOnW", "GankMePls",
  "SmiteStealer", "BaronNashor", "WardTheBush", "TiltProof", "PentaMachine",
  "CannonMinion", "AFKFarmer", "HardStuckGold", "ScuttleGod", "OneTrickPony",
  "LastPickADC", "SupportDiff", "RiftHerald", "ChronoBreaker", "SplitPusher",
  "BackdoorKing", "ExecutedByMinion", "MissedSkillshot", "LethalTempo",
  "CritOrMiss", "BuildDiff", "MacroKing", "InsecKick", "FrontToBack",
];

const TAGLINES = ["NA1", "NA2", "EUW", "KR", "OCE"];

/** mulberry32 — tiny deterministic PRNG. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Fisher-Yates shuffle of 1..6 → the placement drawn by each subteam. */
function shuffledPlacements(rng: () => number): number[] {
  const p = [1, 2, 3, 4, 5, 6];
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  return p;
}

function fourAugments(rng: () => number): [number, number, number, number] {
  const pool = [...AUGMENTS];
  const chosen: number[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]!.id);
  }
  return [chosen[0]!, chosen[1]!, chosen[2]!, chosen[3]!];
}

/** A coherent 6-item build: one pair of boots plus five distinct core items. */
function buildItems(rng: () => number): [number, number, number, number, number, number] {
  const boots = MOCK_ITEMS.filter((i) => i.kind === "Boots");
  const core = MOCK_ITEMS.filter((i) => i.kind !== "Boots");

  const chosen = [pick(rng, boots).id];
  const pool = [...core];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]!.id);
  }
  return [chosen[0]!, chosen[1]!, chosen[2]!, chosen[3]!, chosen[4]!, chosen[5]!];
}

function buildParticipant(
  rng: () => number,
  opts: {
    puuid: string;
    riotIdGameName: string;
    riotIdTagline: string;
    subteamId: number;
    placement: number;
    championId: number;
    championName: string;
  },
): ParticipantDto {
  const { placement } = opts;
  // Better-placed teams tend to deal more damage / earn more gold.
  const performance = (7 - placement) / 6;
  const kills = randInt(rng, 2, 4) + Math.round(performance * randInt(rng, 2, 8));
  const deaths = randInt(rng, 3, 9) - Math.round(performance * 3);
  const assists = kills + randInt(rng, 0, 6);
  const [a1, a2, a3, a4] = fourAugments(rng);
  const [i0, i1, i2, i3, i4, i5] = buildItems(rng);

  return {
    puuid: opts.puuid,
    riotIdGameName: opts.riotIdGameName,
    riotIdTagline: opts.riotIdTagline,
    summonerName: opts.riotIdGameName,
    championId: opts.championId,
    championName: opts.championName,
    champLevel: randInt(rng, 14, 18),
    kills,
    deaths: Math.max(1, deaths),
    assists,
    placement,
    playerSubteamId: opts.subteamId,
    subteamPlacement: placement,
    playerAugment1: a1,
    playerAugment2: a2,
    playerAugment3: a3,
    playerAugment4: a4,
    win: placement === 1,
    totalDamageDealtToChampions:
      8000 + Math.round(performance * 22000) + randInt(rng, 0, 4000),
    totalDamageTaken:
      9000 + Math.round((1 - performance) * 15000) + randInt(rng, 0, 4000),
    goldEarned: 9000 + Math.round(performance * 6000) + randInt(rng, 0, 1500),
    item0: i0,
    item1: i1,
    item2: i2,
    item3: i3,
    item4: i4,
    item5: i5,
    item6: 0,
    teamId: opts.subteamId <= 3 ? 100 : 200,
  };
}

/** Generate a single Arena match conforming to Match-V5. */
function buildMatch(
  rng: () => number,
  index: number,
  featuredChampion: ChampionRef,
): MatchDto {
  const placements = shuffledPlacements(rng);
  const participants: ParticipantDto[] = [];

  for (let subteam = 1; subteam <= 6; subteam++) {
    const placement = placements[subteam - 1]!;

    // Three players per subteam. The featured player always anchors subteam 1,
    // playing the champion assigned to this match by the featured schedule.
    const usedChamps = new Set<number>();
    for (let slot = 0; slot < 3; slot++) {
      const isFeatured = subteam === 1 && slot === 0;

      let champ = isFeatured ? featuredChampion : pick(rng, MOCK_CHAMPIONS);
      while (usedChamps.has(champ.id)) champ = pick(rng, MOCK_CHAMPIONS);
      usedChamps.add(champ.id);

      participants.push(
        buildParticipant(rng, {
          puuid: isFeatured
            ? FEATURED_PLAYER.puuid
            : `PUUID-${index}-${subteam}-${slot}`,
          riotIdGameName: isFeatured
            ? FEATURED_PLAYER.riotIdGameName
            : pick(rng, OPPONENT_NAMES),
          riotIdTagline: isFeatured
            ? FEATURED_PLAYER.riotIdTagline
            : pick(rng, TAGLINES),
          subteamId: subteam,
          placement,
          championId: champ.id,
          championName: champ.name,
        }),
      );
    }
  }

  const durationSec = randInt(rng, 900, 1500);
  // Space matches ~3h apart, most recent first (index 0).
  const gameEnd = Date.UTC(2026, 6, 5, 18, 0, 0) - index * 3 * 3_600_000;
  const gameStart = gameEnd - durationSec * 1000;

  return {
    metadata: {
      dataVersion: "2",
      matchId: `${PLATFORM}_${5_012_300_000 + index}`,
      participants: participants.map((p) => p.puuid),
    },
    info: {
      gameCreation: gameStart - 90_000,
      gameDuration: durationSec,
      gameStartTimestamp: gameStart,
      gameEndTimestamp: gameEnd,
      gameId: 5_012_300_000 + index,
      gameMode: ARENA_GAME_MODE,
      gameName: `teambuilder-match-${5_012_300_000 + index}`,
      gameType: "MATCHED_GAME",
      gameVersion: "14.13.594.4067",
      mapId: ARENA_MAP_ID,
      platformId: PLATFORM,
      queueId: ARENA_QUEUE_ID,
      participants,
      teams: [
        { teamId: 100, win: false },
        { teamId: 200, win: false },
      ],
    },
  };
}

/**
 * The sequence of champions the featured player plays, one per match. Every
 * champion appears at least `minPerChampion` times (so each has a real match
 * history), plus some extra games for a natural, uneven spread. Shuffled.
 */
function buildFeaturedSchedule(
  rng: () => number,
  minPerChampion: number,
  extraGames: number,
): ChampionRef[] {
  const schedule: ChampionRef[] = [];
  for (const champ of MOCK_CHAMPIONS) {
    for (let i = 0; i < minPerChampion; i++) schedule.push(champ);
  }
  for (let i = 0; i < extraGames; i++) schedule.push(pick(rng, MOCK_CHAMPIONS));

  // Fisher-Yates shuffle so the player's games aren't grouped by champion.
  for (let i = schedule.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [schedule[i], schedule[j]] = [schedule[j]!, schedule[i]!];
  }
  return schedule;
}

/**
 * Generate deterministic Arena matches. The featured player's champion per
 * match follows a schedule that guarantees every champion is played several
 * times, so each champion has a meaningful per-player history.
 */
export function generateMockMatches(seed = 0xa2e1a): MatchDto[] {
  const rng = makeRng(seed);
  const schedule = buildFeaturedSchedule(rng, 2, 16);
  return schedule.map((champ, i) => buildMatch(rng, i, champ));
}
