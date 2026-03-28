import { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { getAuth } from "./routes/character/auth";
import {
  getLastCompletedSevenSealsWeekMondayStart,
  getSevenSealsWeekMondayStart,
  isSevenSealsFarmWindowActive,
  weekStartKey,
} from "./sevenSealsTime";
import { grantSevenSealsRewardIfNeeded } from "./sevenSealsRewards";

export async function sevenSealsRoutes(app: FastifyInstance) {
  // GET /seven-seals/ranking - поточний тиждень збору (медалі з понеділка 00:00 нового циклу)
  app.get("/seven-seals/ranking", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) return reply.code(404).send({ error: "character not found" });

      const weekStart = getSevenSealsWeekMondayStart(new Date());

      const medals = await prisma.sevenSealsMedal.findMany({
        where: { weekStart },
        select: {
          characterId: true,
          character: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const medalCounts = new Map<string, { characterId: string; characterName: string; count: number }>();

      medals.forEach((medal) => {
        const charId = medal.characterId;
        const charName = medal.character?.name || "Unknown";
        const current = medalCounts.get(charId) || { characterId: charId, characterName: charName, count: 0 };
        current.count++;
        medalCounts.set(charId, current);
      });

      const ranking = Array.from(medalCounts.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.characterId.localeCompare(b.characterId);
        })
        .slice(0, 100)
        .map((player, index) => ({
          characterId: player.characterId,
          characterName: player.characterName,
          medalCount: player.count,
          rank: index + 1,
        }));

      const myMedals = await prisma.sevenSealsMedal.count({
        where: { characterId: character.id, weekStart },
      });

      const myRankIndex = ranking.findIndex((p) => p.characterId === character.id);
      const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

      return {
        ok: true,
        ranking,
        myRank,
        myMedals,
        weekPaused: !isSevenSealsFarmWindowActive(new Date()),
      };
    } catch (error) {
      app.log.error(error, "Error fetching Seven Seals ranking:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/seven-seals/medal", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId?: string };

    if (!body.characterId) {
      return reply.code(400).send({ error: "characterId is required" });
    }

    if (!isSevenSealsFarmWindowActive(new Date())) {
      return reply
        .code(400)
        .send({ error: "Event farm window closed (Mon 00:00–Sat 22:00 Europe/Warsaw only)" });
    }

    try {
      const character = await prisma.character.findFirst({
        where: {
          id: body.characterId,
          accountId: auth.accountId,
        },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const weekStart = getSevenSealsWeekMondayStart(new Date());

      await prisma.sevenSealsMedal.create({
        data: {
          characterId: character.id,
          weekStart,
        },
      });

      return { ok: true };
    } catch (error) {
      app.log.error(error, "Error adding Seven Seals medal:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Ранг «переможця» лише з активного sevenSealsBonus (після офіційної видачі).
   * Поточний лідерборд тижня не дає статусу переможця минулого тижня.
   */
  app.get("/seven-seals/rank/:characterId", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { characterId } = req.params as { characterId: string };
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    try {
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { heroJson: true },
      });

      const heroJson = (char?.heroJson ?? {}) as Record<string, unknown>;
      const sevenSealsBonus = heroJson.sevenSealsBonus as {
        rank?: number;
        expiresAt?: number;
        claimedWeekStart?: string;
      } | undefined;
      const claimedRank =
        sevenSealsBonus && typeof sevenSealsBonus === "object" ? sevenSealsBonus.rank : undefined;
      const expiresAt = sevenSealsBonus?.expiresAt ?? 0;
      const activeBonus =
        typeof claimedRank === "number" &&
        claimedRank >= 1 &&
        claimedRank <= 3 &&
        expiresAt > Date.now();

      const weekStart = getSevenSealsWeekMondayStart(new Date());
      const medalsCur = await prisma.sevenSealsMedal.findMany({
        where: { weekStart },
        select: { characterId: true },
      });
      const countsCur = new Map<string, number>();
      medalsCur.forEach((m) => countsCur.set(m.characterId, (countsCur.get(m.characterId) ?? 0) + 1));
      const myMedalsCur = countsCur.get(characterId) ?? 0;
      const aboveCur = Array.from(countsCur.values()).filter((c) => c > myMedalsCur).length;
      const provisionalRank = myMedalsCur > 0 ? aboveCur + 1 : null;

      const awardWeekStart = getLastCompletedSevenSealsWeekMondayStart(new Date());
      const awardKey = weekStartKey(awardWeekStart);
      const medalsAward = await prisma.sevenSealsMedal.findMany({
        where: { weekStart: awardWeekStart },
        select: { characterId: true },
      });
      const countsAward = new Map<string, number>();
      medalsAward.forEach((m) => countsAward.set(m.characterId, (countsAward.get(m.characterId) ?? 0) + 1));
      const myAward = countsAward.get(characterId) ?? 0;
      const aboveAward = Array.from(countsAward.values()).filter((c) => c > myAward).length;
      const rankAward = myAward > 0 ? aboveAward + 1 : 0;

      const claimedKey = sevenSealsBonus?.claimedWeekStart ?? "";
      const canClaimLastWeek = rankAward >= 1 && rankAward <= 3 && claimedKey !== awardKey;

      return {
        ok: true,
        characterId,
        rank: activeBonus ? (claimedRank ?? null) : null,
        medalCount: myMedalsCur,
        provisionalRank,
        fromClaimedBonus: !!activeBonus,
        canClaimLastWeek,
      };
    } catch (error) {
      app.log.error(error, "Error fetching Seven Seals rank:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/seven-seals/claim", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId: string };
    const characterId = body.characterId;
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    try {
      const character = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true, heroJson: true },
      });
      if (!character) return reply.code(404).send({ error: "character not found" });

      const awardWeekStart = getLastCompletedSevenSealsWeekMondayStart(new Date());
      const awardKey = weekStartKey(awardWeekStart);

      const medals = await prisma.sevenSealsMedal.findMany({
        where: { weekStart: awardWeekStart },
        select: { characterId: true },
      });
      const medalCounts = new Map<string, number>();
      medals.forEach((m) => medalCounts.set(m.characterId, (medalCounts.get(m.characterId) ?? 0) + 1));
      const myMedals = medalCounts.get(characterId) ?? 0;
      const aboveCount = Array.from(medalCounts.values()).filter((c) => c > myMedals).length;
      const rank = myMedals > 0 ? aboveCount + 1 : 0;
      if (rank < 1 || rank > 3) {
        return reply.code(400).send({ error: "only rank 1-3 (by medals) can claim rewards" });
      }

      const heroJson = (character.heroJson as Record<string, unknown>) || {};
      const existing = heroJson.sevenSealsBonus as { claimedWeekStart?: string } | undefined;
      if (existing?.claimedWeekStart === awardKey) {
        return reply.send({
          ok: true,
          alreadyClaimed: true,
          bonus: heroJson.sevenSealsBonus,
        });
      }

      const grant = await grantSevenSealsRewardIfNeeded(prisma, characterId, rank, awardWeekStart, new Date());
      if (!grant.applied) {
        return reply.code(400).send({ error: grant.skipped || "claim_failed" });
      }

      return reply.send({
        ok: true,
        bonus: grant.bonus,
      });
    } catch (error) {
      app.log.error(error, "Error claiming Seven Seals reward:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/seven-seals/add", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId: string; points?: number; seal?: string | null };
    const characterId = body.characterId;
    const add = Math.trunc(body.points ?? 0);
    const seal = body.seal ?? null;

    if (!characterId || !Number.isFinite(add)) {
      return reply.code(400).send({ ok: false, error: "bad_request" });
    }

    try {
      const row = await prisma.sevenSealsScore.upsert({
        where: { characterId },
        create: { characterId, points: Math.max(0, add), seal },
        update: {
          points: { increment: add },
          seal,
        },
        select: { characterId: true, points: true, seal: true, updatedAt: true },
      });

      return { ok: true, ...row };
    } catch (error) {
      app.log.error(error, "Error adding Seven Seals points:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
