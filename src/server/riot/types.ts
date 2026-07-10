/**
 * Type definitions for the subset of Riot's Match-V5 API used by this app,
 * focused on the Arena game mode (gameMode "CHERRY", queueId 1700, mapId 30).
 *
 * These intentionally mirror the official response shapes so that the mock
 * data can be swapped for live calls to:
 *   GET /lol/match/v5/matches/{matchId}
 * without changing any downstream code.
 *
 * @see https://developer.riotgames.com/apis#match-v5/GET_getMatch
 */

/** Arena is queueId 1700 (6 three-player subteams on "Rings of Wrath"). */
export const ARENA_QUEUE_ID = 1750;
/** Arena reports gameMode "CHERRY" (its internal codename). */
export const ARENA_GAME_MODE = "CHERRY";
/** Arena is played on the Rings of Wrath map (mapId 30). */
export const ARENA_MAP_ID = 30;

export interface MatchDto {
  metadata: MetadataDto;
  info: InfoDto;
}

export interface MetadataDto {
  /** Match data version. */
  dataVersion: string;
  /** Globally unique match id, e.g. "NA1_5012345678". */
  matchId: string;
  /** Puuids of every participant in the match. */
  participants: string[];
}

export interface InfoDto {
  /** Unix ms timestamp when the game was created (champ select ended). */
  gameCreation: number;
  /** Game length. Seconds for older matches; ms once gameEndTimestamp exists. */
  gameDuration: number;
  /** Unix ms timestamp when the game ended. */
  gameEndTimestamp: number;
  gameId: number;
  /** "CHERRY" for Arena. */
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  /** e.g. "14.13.594.4067". */
  gameVersion: string;
  /** 30 for Arena (Rings of Wrath). */
  mapId: number;
  participants: ParticipantDto[];
  platformId: string;
  /** 1700 for Arena. */
  queueId: number;
  /** In Arena the three-player subteams live under `players`/subteam ids. */
  teams: TeamDto[];
}

export interface TeamDto {
  teamId: number;
  win: boolean;
}

/**
 * A single player's line in the match. Only Arena-relevant fields are typed;
 * the live API returns many more, but these are the ones this app consumes.
 */
export interface ParticipantDto {
  puuid: string;
  /** Riot ID game name, e.g. "Faker". */
  riotIdGameName: string;
  /** Riot ID tagline, e.g. "KR1". */
  riotIdTagline: string;
  summonerName: string;

  championId: number;
  championName: string;
  champLevel: number;

  kills: number;
  deaths: number;
  assists: number;

  /** ---- Arena-specific fields ---- */
  /** Final placement of this player's subteam, 1 (win) through 6. */
  placement: number;
  /** The subteam this player belongs to (1-6). Teammates share this id. */
  playerSubteamId: number;
  /** Placement of the subteam (mirrors `placement`). */
  subteamPlacement: number;
  /** Chosen augment ids, 0 when a slot was not filled. Resolve via Community Dragon. */
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;

  /** Riot marks the 1st-place subteam as the winner. */
  win: boolean;

  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  goldEarned: number;

  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;

  teamId: number;
}
