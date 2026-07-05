import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { arenaMatches, arenaParticipants } from "~/server/db/schema";
import { getAugment } from "~/server/riot/constants";
import { FEATURED_PLAYER } from "~/server/riot/mock";

/** A subteam is a win in Arena when it places 1st; top-4 is the "positive" cut. */
const isWin = (placement: number) => placement === 1;
const isTop4 = (placement: number) => placement <= 4;

export const arenaRouter = createTRPCRouter({
  /** Headline stats for the featured player across all stored matches. */
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(arenaParticipants)
      .where(eq(arenaParticipants.puuid, FEATURED_PLAYER.puuid));

    const games = rows.length;
    const wins = rows.filter((r) => isWin(r.placement)).length;
    const top4 = rows.filter((r) => isTop4(r.placement)).length;
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
      player: {
        gameName: FEATURED_PLAYER.riotIdGameName,
        tagLine: FEATURED_PLAYER.riotIdTagline,
      },
      games,
      wins,
      top4,
      winRate: games ? wins / games : 0,
      top4Rate: games ? top4 / games : 0,
      avgPlacement: games ? placementSum / games : 0,
      avgKda: kda.d ? (kda.k + kda.a) / kda.d : kda.k + kda.a,
    };
  }),

  /** Champion leaderboard aggregated across every participant in the DB. */
  getChampionLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(12) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 12;
      const rows = await ctx.db
        .select({
          championId: arenaParticipants.championId,
          championName: arenaParticipants.championName,
          placement: arenaParticipants.placement,
        })
        .from(arenaParticipants);

      const byChampion = new Map<
        number,
        { championId: number; championName: string; games: number; wins: number; top4: number; placementSum: number }
      >();

      for (const r of rows) {
        const entry =
          byChampion.get(r.championId) ??
          {
            championId: r.championId,
            championName: r.championName,
            games: 0,
            wins: 0,
            top4: 0,
            placementSum: 0,
          };
        entry.games += 1;
        entry.wins += isWin(r.placement) ? 1 : 0;
        entry.top4 += isTop4(r.placement) ? 1 : 0;
        entry.placementSum += r.placement;
        byChampion.set(r.championId, entry);
      }

      return [...byChampion.values()]
        .map((e) => ({
          championId: e.championId,
          championName: e.championName,
          games: e.games,
          winRate: e.wins / e.games,
          top4Rate: e.top4 / e.games,
          avgPlacement: e.placementSum / e.games,
        }))
        .sort((a, b) => b.top4Rate - a.top4Rate || b.games - a.games)
        .slice(0, limit);
    }),

  /** Most recent matches with each subteam's result and the featured pick. */
  getRecentMatches: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(8) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 8;
      const matches = await ctx.db
        .select()
        .from(arenaMatches)
        .orderBy(desc(arenaMatches.gameEndTimestamp))
        .limit(limit);

      return Promise.all(
        matches.map(async (m) => {
          const players = await ctx.db
            .select()
            .from(arenaParticipants)
            .where(eq(arenaParticipants.matchId, m.matchId));

          const featured = players.find(
            (p) => p.puuid === FEATURED_PLAYER.puuid,
          );

          return {
            matchId: m.matchId,
            gameEndTimestamp: m.gameEndTimestamp,
            gameDuration: m.gameDuration,
            queueId: m.queueId,
            gameMode: m.gameMode,
            featured: featured
              ? {
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
                    .map((id) => getAugment(id)?.name ?? `Augment #${id}`),
                }
              : null,
          };
        }),
      );
    }),
});
