import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import type { PkSession } from "./types";
import { pkSessions } from "./store";
import { getEffectivePkNickColor } from "./helpers";
export function registerCharacterPkStateRoute(app: FastifyInstance): void {
  app.get("/characters/:id/pk/state", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = String((req.params as any)?.id ?? "").trim();
    if (!id) return reply.code(400).send({ error: "character id required" });

    let currentHp = null;
    let currentMp = null;
    let currentMaxHp = null;
    let currentMaxMp = null;

    const getHpMpFromSession = (idToFind: string, sess: PkSession) => {
      const isAttacker = sess.attackerId === idToFind;
      const meFighter = isAttacker ? sess.attacker : sess.defender;
      return {
        hp: meFighter.hp,
        mp: meFighter.mp,
        maxHp: meFighter.maxHp,
        maxMp: meFighter.maxMp,
      };
    };

    for (const sess of pkSessions.values()) {
      if (!sess.ended && (sess.attackerId === id || sess.defenderId === id)) {
        const stats = getHpMpFromSession(id, sess);
        currentHp = stats.hp;
        currentMp = stats.mp;
        currentMaxHp = stats.maxHp;
        currentMaxMp = stats.maxMp;
        break;
      }
    }

    if (currentHp === null) {
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
          `SELECT "payload" FROM "PkSessionStore" WHERE "expiresAt" >= $1 AND ("payload"->>'attackerId' = $2 OR "payload"->>'defenderId' = $2) AND ("payload"->>'ended')::boolean = false LIMIT 1`,
          Date.now(),
          id
        );
        if (rows[0]?.payload) {
          const sessionData = typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : (rows[0].payload as any);
          if (sessionData) {
            const isAttacker = sessionData.attackerId === id;
            const meFighter = isAttacker ? sessionData.attacker : sessionData.defender;
            if (meFighter) {
              currentHp = meFighter.hp;
              currentMp = meFighter.mp;
              currentMaxHp = meFighter.maxHp;
              currentMaxMp = meFighter.maxMp;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const char = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
      select: { id: true, heroJson: true, nickColor: true },
    });
    if (!char) return reply.code(404).send({ error: "character not found" });

    let heroJson = ((char.heroJson as any) || {}) as any;

    if (currentHp !== null && currentMp !== null) {
      heroJson = {
        ...heroJson,
        hp: currentHp,
        mp: currentMp,
        maxHp: currentMaxHp ?? heroJson.maxHp,
        maxMp: currentMaxMp ?? heroJson.maxMp,
      };
    }

    const ts = Date.now();
    const pkIncoming =
      heroJson?.pkIncoming && Number(heroJson.pkIncoming?.until ?? 0) > ts ? heroJson.pkIncoming : null;
    const pkDeathNotice =
      heroJson?.pkDeathNotice && Number(heroJson.pkDeathNotice?.until ?? 0) > ts ? heroJson.pkDeathNotice : null;
    const effectiveNickColor = getEffectivePkNickColor({ ...heroJson, nickColor: char.nickColor }, ts) || null;
    const pkSyncActive = Number(heroJson?.pkSyncUntil ?? 0) > ts;

    return reply.send({
      ok: true,
      hp: Number(heroJson.hp ?? heroJson.maxHp ?? 0),
      mp: Number(heroJson.mp ?? heroJson.maxMp ?? 0),
      cp: Number(heroJson.cp ?? 0),
      maxHp: Number(heroJson.maxHp ?? 0),
      maxMp: Number(heroJson.maxMp ?? 0),
      maxCp: Number(heroJson.maxCp ?? 0),
      nickColor: effectiveNickColor,
      pkIncoming,
      pkDeathNotice,
      pkSyncActive,
    });
  });
}
