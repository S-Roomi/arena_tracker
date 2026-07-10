import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { arenaMatches, arenaParticipants } from "~/server/db/schema";
import { getAugment, getChampion, getItem } from "~/server/riot/constants";

/** A subteam is a win in Arena when it places 1st; top-3 is the "positive" cut. */
const isWin = (placement: number) => placement === 1;
const isTop3 = (placement: number) => placement <= 3;

export const arenaRouter = createTRPCRouter({
  /**
   * The player the tracker is currently profiling (from the sign-in cookie),
   * resolved to a display Riot ID from their stored matches. Null when signed
   * out or when no matches are stored for the active puuid.
   */
  getActivePlayer: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.activePuuid) return null;
    const [row] = await ctx.db
      .select({
        gameName: arenaParticipants.riotIdGameName,
        tagLine: arenaParticipants.riotIdTagline,
      })
      .from(arenaParticipants)
      .where(eq(arenaParticipants.puuid, ctx.activePuuid))
      .limit(1);
    return row ? { gameName: row.gameName, tagLine: row.tagLine } : null;
  }),

  /** Headline stats for the active player across all stored matches. */
  getSummary: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.activePuuid) {
      return {
        player: null,
        games: 0,
        wins: 0,
        top3: 0,
        winRate: 0,
        top3Rate: 0,
        avgPlacement: 0,
        avgKda: 0,
      };
    }

    const rows = await ctx.db
      .select()
      .from(arenaParticipants)
      .where(eq(arenaParticipants.puuid, ctx.activePuuid));

    const games = rows.length;
    const wins = rows.filter((r) => isWin(r.placement)).length;
    const top3 = rows.filter((r) => isTop3(r.placement)).length;
    const placementSum = rows.reduce((acc, r) => acc + r.placement, 0);
    const kda = rows.reduce(
      (acc, r) => {
        acc.k += r.kills;
        acc.d += r.deaths;
        acc.a += r.assists;
        return acc;
      },
      { k: 0, d: 0, a: 0 },
    );

    return {
      player: rows[0]
        ? { gameName: rows[0].riotIdGameName, tagLine: rows[0].riotIdTagline }
        : null,
      games,
      wins,
      top3,
      winRate: games ? wins / games : 0,
      top3Rate: games ? top3 / games : 0,
      avgPlacement: games ? placementSum / games : 0,
      avgKda: kda.d ? (kda.k + kda.a) / kda.d : kda.k + kda.a,
    };
  }),

  /** Every champion the active player has played, ranked by their performance. */
  getChampionLeaderboard: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.activePuuid) return [];
      const rows = await ctx.db
        .select({
          championId: arenaParticipants.championId,
          championName: arenaParticipants.championName,
          placement: arenaParticipants.placement,
        })
        .from(arenaParticipants)
        .where(eq(arenaParticipants.puuid, ctx.activePuuid));

      const byChampion = new Map<
        number,
        { championId: number; championName: string; games: number; wins: number; top3: number; placementSum: number }
      >();

      for (const r of rows) {
        const entry =
          byChampion.get(r.championId) ??
          {
            championId: r.championId,
            championName: r.championName,
            games: 0,
            wins: 0,
            top3: 0,
            placementSum: 0,
          };
        entry.games += 1;
        entry.wins += isWin(r.placement) ? 1 : 0;
        entry.top3 += isTop3(r.placement) ? 1 : 0;
        entry.placementSum += r.placement;
        byChampion.set(r.championId, entry);
      }

      return [...byChampion.values()]
        .map((e) => ({
          championId: e.championId,
          championName: e.championName,
          games: e.games,
          winRate: e.wins / e.games,
          top3Rate: e.top3 / e.games,
          avgPlacement: e.placementSum / e.games,
        }))
        .sort((a, b) => b.top3Rate - a.top3Rate || b.games - a.games);
    }),

  /** Every augment the active player has taken, ranked by their win rate. */
  getAugmentLeaderboard: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.activePuuid) return [];
      const rows = await ctx.db
        .select({
          a1: arenaParticipants.playerAugment1,
          a2: arenaParticipants.playerAugment2,
          a3: arenaParticipants.playerAugment3,
          a4: arenaParticipants.playerAugment4,
          placement: arenaParticipants.placement,
        })
        .from(arenaParticipants)
        .where(eq(arenaParticipants.puuid, ctx.activePuuid));

      const byAugment = new Map<
        number,
        { augmentId: number; picks: number; wins: number; top3: number; placementSum: number }
      >();

      for (const r of rows) {
        // Each participant picks up to four augments over a game.
        for (const id of [r.a1, r.a2, r.a3, r.a4]) {
          if (id <= 0) continue;
          const entry =
            byAugment.get(id) ??
            { augmentId: id, picks: 0, wins: 0, top3: 0, placementSum: 0 };
          entry.picks += 1;
          entry.wins += isWin(r.placement) ? 1 : 0;
          entry.top3 += isTop3(r.placement) ? 1 : 0;
          entry.placementSum += r.placement;
          byAugment.set(id, entry);
        }
      }

      return [...byAugment.values()]
        .map((e) => {
          const meta = getAugment(e.augmentId);
          return {
            augmentId: e.augmentId,
            name: meta?.name ?? `Augment #${e.augmentId}`,
            rarity: meta?.rarity ?? ("Silver" as const),
            description: meta?.description ?? "",
            picks: e.picks,
            winRate: e.wins / e.picks,
            top3Rate: e.top3 / e.picks,
            avgPlacement: e.placementSum / e.picks,
          };
        })
        .sort((a, b) => b.winRate - a.winRate || b.picks - a.picks);
    }),

  /** Most recent matches with each subteam's result and the featured pick. */
  getRecentMatches: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
          /** Offset of the first row to return (from a previous nextCursor). */
          cursor: z.number().min(0).nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const offset = input?.cursor ?? 0;
      const empty = { items: [], nextCursor: null as number | null };
      if (!ctx.activePuuid) return empty;

      // The active player's line in each of their matches (one row per match).
      const mine = await ctx.db
        .select()
        .from(arenaParticipants)
        .where(eq(arenaParticipants.puuid, ctx.activePuuid));
      if (mine.length === 0) return empty;

      const byMatch = new Map(mine.map((p) => [p.matchId, p]));
      const total = byMatch.size;
      const matches = await ctx.db
        .select()
        .from(arenaMatches)
        .where(inArray(arenaMatches.matchId, [...byMatch.keys()]))
        .orderBy(desc(arenaMatches.gameEndTimestamp))
        .limit(limit)
        .offset(offset);

      const items = matches.map((m) => {
        const featured = byMatch.get(m.matchId)!;
        return {
          matchId: m.matchId,
          gameEndTimestamp: m.gameEndTimestamp,
          gameDuration: m.gameDuration,
          queueId: m.queueId,
          gameMode: m.gameMode,
          featured: {
            championId: featured.championId,
            championName: featured.championName,
            placement: featured.placement,
            kills: featured.kills,
            deaths: featured.deaths,
            assists: featured.assists,
            augments: [
              featured.playerAugment1,
              featured.playerAugment2,
              featured.playerAugment3,
              featured.playerAugment4,
            ]
              .filter((id) => id > 0)
              .map((id) => {
                const meta = getAugment(id);
                return {
                  augmentId: id,
                  name: meta?.name ?? `Augment #${id}`,
                  rarity: meta?.rarity ?? ("Silver" as const),
                  description: meta?.description ?? "",
                };
              }),
          },
        };
      });

      const consumed = offset + items.length;
      return { items, nextCursor: consumed < total ? consumed : null };
    }),

  /**
   * The featured player's profile for a single champion: their stats, builds,
   * augments, and match history on that champion (not aggregated across
   * other players).
   */
  getChampionProfile: publicProcedure
    .input(z.object({ championId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const champ = getChampion(input.championId);
      if (!champ || !ctx.activePuuid) return null;

      const rows = await ctx.db
        .select()
        .from(arenaParticipants)
        .where(
          and(
            eq(arenaParticipants.championId, input.championId),
            eq(arenaParticipants.puuid, ctx.activePuuid),
          ),
        );

      const games = rows.length;
      const sum = rows.reduce(
        (a, r) => {
          a.wins += isWin(r.placement) ? 1 : 0;
          a.top3 += isTop3(r.placement) ? 1 : 0;
          a.placement += r.placement;
          a.kills += r.kills;
          a.deaths += r.deaths;
          a.assists += r.assists;
          a.damage += r.totalDamageDealtToChampions;
          a.gold += r.goldEarned;
          return a;
        },
        { wins: 0, top3: 0, placement: 0, kills: 0, deaths: 0, assists: 0, damage: 0, gold: 0 },
      );
      const per = (n: number) => (games ? n / games : 0);

      // Most-built items (by share of this champion's games).
      const itemCounts = new Map<number, number>();
      for (const r of rows) {
        for (const id of [r.item0, r.item1, r.item2, r.item3, r.item4, r.item5]) {
          if (id > 0) itemCounts.set(id, (itemCounts.get(id) ?? 0) + 1);
        }
      }
      const topItems = [...itemCounts.entries()]
        .map(([itemId, count]) => ({
          itemId,
          name: getItem(itemId)?.name ?? `Item #${itemId}`,
          kind: getItem(itemId)?.kind ?? null,
          count,
          pickRate: per(count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Most-taken augments.
      const augCounts = new Map<number, number>();
      for (const r of rows) {
        for (const id of [r.playerAugment1, r.playerAugment2, r.playerAugment3, r.playerAugment4]) {
          if (id > 0) augCounts.set(id, (augCounts.get(id) ?? 0) + 1);
        }
      }
      const topAugments = [...augCounts.entries()]
        .map(([augmentId, count]) => {
          const meta = getAugment(augmentId);
          return {
            augmentId,
            name: meta?.name ?? `Augment #${augmentId}`,
            rarity: meta?.rarity ?? ("Silver" as const),
            description: meta?.description ?? "",
            count,
            pickRate: per(count),
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Match history (most recent first).
      const matchIds = [...new Set(rows.map((r) => r.matchId))];
      const matchRows = matchIds.length
        ? await ctx.db
            .select()
            .from(arenaMatches)
            .where(inArray(arenaMatches.matchId, matchIds))
        : [];
      const matchById = new Map(matchRows.map((m) => [m.matchId, m]));

      const matches = rows
        .map((r) => {
          const m = matchById.get(r.matchId);
          return {
            matchId: r.matchId,
            gameEndTimestamp: m?.gameEndTimestamp ?? new Date(0),
            gameDuration: m?.gameDuration ?? 0,
            placement: r.placement,
            win: r.win,
            gameName: r.riotIdGameName,
            tagLine: r.riotIdTagline,
            kills: r.kills,
            deaths: r.deaths,
            assists: r.assists,
            items: [r.item0, r.item1, r.item2, r.item3, r.item4, r.item5].filter(
              (id) => id > 0,
            ),
            augments: [
              r.playerAugment1,
              r.playerAugment2,
              r.playerAugment3,
              r.playerAugment4,
            ]
              .filter((id) => id > 0)
              .map((id) => {
                const meta = getAugment(id);
                return {
                  augmentId: id,
                  name: meta?.name ?? `Augment #${id}`,
                  rarity: meta?.rarity ?? ("Silver" as const),
                  description: meta?.description ?? "",
                };
              }),
          };
        })
        .sort((a, b) => b.gameEndTimestamp.getTime() - a.gameEndTimestamp.getTime())
        .slice(0, 20);

      return {
        champion: { id: champ.id, name: champ.name },
        player: rows[0]
          ? { gameName: rows[0].riotIdGameName, tagLine: rows[0].riotIdTagline }
          : null,
        stats: {
          games,
          wins: sum.wins,
          winRate: per(sum.wins),
          top3: sum.top3,
          top3Rate: per(sum.top3),
          avgPlacement: per(sum.placement),
          avgKills: per(sum.kills),
          avgDeaths: per(sum.deaths),
          avgAssists: per(sum.assists),
          avgKda: sum.deaths ? (sum.kills + sum.assists) / sum.deaths : sum.kills + sum.assists,
          avgDamage: per(sum.damage),
          avgGold: per(sum.gold),
        },
        topItems,
        topAugments,
        matches,
      };
    }),
});
