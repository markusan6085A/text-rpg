/**
 * Після суботи 22:00 (Варшава): фіксуємо ТОП-3 за медалями тижня,
 * автоматично нараховуємо нагороди, листи від Existence.
 */
import { prisma } from "./db";
import {
  getLastCompletedSevenSealsWeekMondayStart,
  getSevenSealsWeekPendingFinalization,
  weekStartKey,
} from "./sevenSealsTime";
import { grantSevenSealsRewardIfNeeded } from "./sevenSealsRewards";

const KV_FINALIZED = "seven_seals_last_finalized_week";
const SENDER_NAME = "Existence";

const WINNER_MESSAGES: Record<number, string> = {
  1: `Вітаємо! Ви посіли 1 місце в івенті «7 Печатей».

Нагорода вже нарахована автоматично (стати та Coin of Luck). Деталі — екран «Персонаж».`,
  2: `Вітаємо! Ви посіли 2 місце в івенті «7 Печатей».

Нагорода вже нарахована автоматично (стати та Coin of Luck). Деталі — екран «Персонаж».`,
  3: `Вітаємо! Ви посіли 3 місце в івенті «7 Печатей».

Нагорода вже нарахована автоматично (стати та Coin of Luck). Деталі — екран «Персонаж».`,
};

export async function runSevenSealsFinalizeJob(
  log: (msg: string, meta?: object) => void,
  force = false
): Promise<{ finalized: boolean; weekKey?: string; top3?: number; skipped?: string }> {
  const now = new Date();
  const pending = getSevenSealsWeekPendingFinalization(now);
  const weekMon =
    pending ?? (force ? getLastCompletedSevenSealsWeekMondayStart(now) : null);
  if (!weekMon) {
    return { finalized: false, skipped: force ? "no_week" : "no_week_to_finalize" };
  }

  const weekKey = weekStartKey(weekMon);

  if (!force) {
    const kv = await prisma.kv.findUnique({ where: { key: KV_FINALIZED }, select: { value: true } });
    if (kv?.value === weekKey) {
      return { finalized: false, skipped: "already_finalized", weekKey };
    }
  }

  const medals = await prisma.sevenSealsMedal.findMany({
    where: { weekStart: weekMon },
    select: {
      characterId: true,
      character: { select: { id: true, name: true } },
    },
  });

  const medalCounts = new Map<string, { characterId: string; characterName: string; count: number }>();
  for (const m of medals) {
    const charId = m.characterId;
    const charName = m.character?.name ?? "Unknown";
    const cur = medalCounts.get(charId) ?? { characterId: charId, characterName: charName, count: 0 };
    cur.count++;
    medalCounts.set(charId, cur);
  }

  const sorted = Array.from(medalCounts.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.characterId.localeCompare(b.characterId);
  });

  const top3 = sorted.slice(0, 3);

  if (top3.length === 0) {
    log(`Seven Seals finalize: no medals for week ${weekKey}, marking finalized`);
    if (!force) {
      await prisma.kv.upsert({
        where: { key: KV_FINALIZED },
        create: { key: KV_FINALIZED, value: weekKey, updatedAt: new Date() },
        update: { value: weekKey, updatedAt: new Date() },
      });
    }
    return { finalized: true, weekKey, top3: 0 };
  }

  const sender = await prisma.character.findFirst({
    where: { name: { equals: SENDER_NAME, mode: "insensitive" } },
    select: { id: true },
  });

  const grantedAt = now;
  for (let i = 0; i < top3.length; i++) {
    const row = top3[i];
    const rank = i + 1;
    const r = await grantSevenSealsRewardIfNeeded(prisma, row.characterId, rank, weekMon, grantedAt);
    if (r.applied) {
      log(`Seven Seals: granted rank ${rank} to ${row.characterName} (${row.characterId})`);
    } else {
      log(`Seven Seals: grant skip ${row.characterName}: ${r.skipped ?? "unknown"}`);
    }

    if (sender && row.characterId !== sender.id) {
      const message = WINNER_MESSAGES[rank] ?? WINNER_MESSAGES[3];
      try {
        await prisma.letter.create({
          data: {
            fromCharacterId: sender.id,
            toCharacterId: row.characterId,
            subject: "7 Печатей — вітання!",
            message,
          },
        });
        log(`Seven Seals mail: sent to ${row.characterName} (rank ${rank})`);
      } catch (e) {
        log(`Seven Seals mail failed for ${row.characterName}`, { error: String(e) });
      }
    }
  }

  if (!force) {
    await prisma.kv.upsert({
      where: { key: KV_FINALIZED },
      create: { key: KV_FINALIZED, value: weekKey, updatedAt: new Date() },
      update: { value: weekKey, updatedAt: new Date() },
    });
  }

  return { finalized: true, weekKey, top3: top3.length };
}

/* remove dead computeTop3Medals */