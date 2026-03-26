import type { FastifyInstance } from "fastify";
import { getAuth } from "../../auth";
import { prisma } from "../../../../db";
import { isOnline } from "../pk/helpers";
import { tvtRegistrations, tvtMatches } from "./store";
import { TVT_DAILY_SLOTS, isRegistrationOpenForSlot, dayKeyFromDate, minutesSinceMidnight } from "./schedule";
import { loadTvtStateFromDb, persistTvtState } from "./persistence";
import { collectRegisteredForSlot, runTvtTick } from "./engine";

export async function registerTvtRoutes(app: FastifyInstance) {
  await loadTvtStateFromDb();

  setInterval(() => {
    try {
      runTvtTick();
    } catch (e) {
      app.log?.warn?.(e, "[tvt] tick");
    }
  }, 15_000);

  app.post("/characters/tvt/register", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body ?? {}) as { characterId?: string; slotId?: string };
    const characterId = String(body.characterId ?? "").trim();
    const slotId = String(body.slotId ?? "").trim();
    if (!characterId || !slotId) return reply.code(400).send({ error: "characterId and slotId required" });
    if (!TVT_DAILY_SLOTS.some((s) => s.id === slotId)) return reply.code(400).send({ error: "unknown slot" });

    const ch = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
      select: { id: true, lastActivityAt: true, updatedAt: true },
    });
    if (!ch) return reply.code(404).send({ error: "character not found" });
    if (!isOnline(ch.lastActivityAt as any, ch.updatedAt as any)) {
      return reply.code(400).send({ error: "must be online to register" });
    }

    const slot = TVT_DAILY_SLOTS.find((s) => s.id === slotId)!;
    const now = new Date();
    if (!isRegistrationOpenForSlot(now, slot)) {
      return reply.code(400).send({ error: "registration is closed for this slot" });
    }

    const dayKey = dayKeyFromDate(now);
    tvtRegistrations.set(characterId, { dayKey, slotId });
    await persistTvtState();
    return reply.send({ ok: true, serverNow: Date.now(), dayKey, slotId });
  });

  app.post("/characters/tvt/unregister", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body ?? {}) as { characterId?: string };
    const characterId = String(body.characterId ?? "").trim();
    if (!characterId) return reply.code(400).send({ error: "characterId required" });
    const ch = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
      select: { id: true },
    });
    if (!ch) return reply.code(404).send({ error: "character not found" });
    tvtRegistrations.delete(characterId);
    await persistTvtState();
    return reply.send({ ok: true, serverNow: Date.now() });
  });

  /**
   * Публічна частина без JWT: час сервера, слоти, кількість записів.
   * З валідним Bearer + characterId — додаються myRegistration, myMatch.
   */
  app.get("/characters/tvt/state", async (req, reply) => {
    const auth = getAuth(req);
    const characterId = String((req.query as { characterId?: string })?.characterId ?? "").trim();

    const now = new Date();
    const dayKey = dayKeyFromDate(now);

    const registrationsBySlot: Record<string, number> = {};
    for (const s of TVT_DAILY_SLOTS) {
      registrationsBySlot[s.id] = collectRegisteredForSlot(dayKey, s.id).length;
    }

    let myRegistration: { dayKey: string; slotId: string } | null = null;
    let myMatch: {
      id: string;
      slotId: string;
      queueALen: number;
      queueBLen: number;
      currentPkSessionId: string | null;
      status: string;
    } | null = null;

    if (auth && characterId) {
      const ch = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true },
      });
      if (ch) {
        const myReg = tvtRegistrations.get(characterId);
        myRegistration = myReg && myReg.dayKey === dayKey ? myReg : null;

        for (const m of tvtMatches.values()) {
          if (m.dayKey !== dayKey) continue;
          const inA = m.teamAIds.includes(characterId) || m.queueA.includes(characterId);
          const inB = m.teamBIds.includes(characterId) || m.queueB.includes(characterId);
          if (inA || inB) {
            myMatch = {
              id: m.id,
              slotId: m.slotId,
              queueALen: m.queueA.length,
              queueBLen: m.queueB.length,
              currentPkSessionId: m.currentPkSessionId,
              status: m.status,
            };
            break;
          }
        }
      }
    }

    let hasActiveMatch = false;
    for (const m of tvtMatches.values()) {
      if (m.dayKey === dayKey && m.status === "active") {
        hasActiveMatch = true;
        break;
      }
    }

    const t = Date.now();
    return reply.send({
      ok: true,
      serverNow: t,
      serverMinutesSinceMidnight: minutesSinceMidnight(now),
      dayKey,
      slots: TVT_DAILY_SLOTS,
      registrationsBySlot,
      hasActiveMatch,
      myRegistration,
      myMatch,
    });
  });
}
