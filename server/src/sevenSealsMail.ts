/**
 * Розсилка листів топ-3 переможцям 7 Печатей у неділю (ігровий час Europe/Warsaw).
 * Тиждень збору: понеділок–субота; підсумок — неділя.
 */
import { prisma } from "./db";
import {
  getSevenSealsWeekMondayStart,
  isSundayPoland,
  weekStartKey,
} from "./sevenSealsTime";

const SENDER_NAME = "Existence";
const KV_KEY = "seven_seals_mail_last_week";

const WINNER_MESSAGES: Record<number, string> = {
  1: `Поздравляю! Вы заняли 1 место в событии 7 Печатей!

Ваши призы:
• Физ/Маг атака: 125-750
• Физ/Маг защита: 154-456
• Кол (Coin of Luck): 5-20

Заберите награду в разделе Персонаж.`,
  2: `Поздравляю! Вы заняли 2 место в событии 7 Печатей!

Ваши призы:
• Физ/Маг атака: 100-500
• Физ/Маг защита: 100-400
• Кол (Coin of Luck): 5-15

Заберите награду в разделе Персонаж.`,
  3: `Поздравляю! Вы заняли 3 место в событии 7 Печатей!

Ваши призы:
• Физ/Маг атака: 80-300
• Физ/Маг защита: 80-300
• Кол (Coin of Luck): 5-10

Заберите награду в разделе Персонаж.`,
};

/** force=true — примусово запустити (для адмін-тесту), ігнорує час та Kv */
export async function runSevenSealsMailJob(
  log: (msg: string, meta?: object) => void,
  force = false
): Promise<{ sent: number; skipped: string }> {
  const result = { sent: 0, skipped: "" };
  try {
    if (!force && !isSundayPoland(new Date())) return result;

    const now = new Date();
    const weekStart = getSevenSealsWeekMondayStart(now);
    const weekStartKeyStr = weekStartKey(weekStart);

    // Перевіряємо, чи вже відправляли для цього тижня (пропускаємо при force)
    if (!force) {
      const kv = await prisma.kv.findUnique({
        where: { key: KV_KEY },
        select: { value: true },
      });
      if (kv?.value === weekStartKeyStr) return result;
    }

    // Знаходимо відправника "Existence"
    const sender = await prisma.character.findFirst({
      where: { name: { equals: SENDER_NAME, mode: "insensitive" } },
      select: { id: true },
    });
    if (!sender) {
      result.skipped = `character "${SENDER_NAME}" not found`;
      log(`Seven Seals mail: ${result.skipped}`);
      return result;
    }

    const medals = await prisma.sevenSealsMedal.findMany({
      where: { weekStart },
      select: {
        characterId: true,
        character: { select: { id: true, name: true } },
      },
    });

    const medalCounts = new Map<string, { characterId: string; characterName: string; count: number }>();
    medals.forEach((m) => {
      const charId = m.characterId;
      const charName = m.character?.name ?? "Unknown";
      const cur = medalCounts.get(charId) ?? {
        characterId: charId,
        characterName: charName,
        count: 0,
      };
      cur.count++;
      medalCounts.set(charId, cur);
    });

    const top3 = Array.from(medalCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    if (top3.length === 0) {
      result.skipped = "no medal winners this week";
      log("Seven Seals mail: no medal winners this week, nothing to send");
      if (!force) {
        await prisma.kv.upsert({
          where: { key: KV_KEY },
          create: { key: KV_KEY, value: weekStartKeyStr, updatedAt: new Date() },
          update: { value: weekStartKeyStr, updatedAt: new Date() },
        });
      }
      return result;
    }

    const subject = "7 Печатей — Поздравление!";

    for (let i = 0; i < top3.length; i++) {
      const winner = top3[i];
      const rank = i + 1;
      const message = WINNER_MESSAGES[rank] ?? WINNER_MESSAGES[3];

      if (winner.characterId === sender.id) {
        log(`Seven Seals mail: skip sending to self (Existence is rank ${rank})`);
        continue;
      }

      await prisma.letter.create({
        data: {
          fromCharacterId: sender.id,
          toCharacterId: winner.characterId,
          subject,
          message,
        },
      });
      log(`Seven Seals mail: sent to ${winner.characterName} (rank ${rank})`);
      result.sent++;
    }

    if (!force) {
      await prisma.kv.upsert({
        where: { key: KV_KEY },
        create: { key: KV_KEY, value: weekStartKeyStr, updatedAt: new Date() },
        update: { value: weekStartKeyStr, updatedAt: new Date() },
      });
    }
    return result;
  } catch (err) {
    log(`Seven Seals mail error: ${err instanceof Error ? err.message : String(err)}`, {
      error: err,
    } as any);
    result.skipped = String(err);
    return result;
  }
}
