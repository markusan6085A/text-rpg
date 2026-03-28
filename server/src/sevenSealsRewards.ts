import type { PrismaClient } from "@prisma/client";
import { getNextSevenSealsSaturday22UtcAfter, weekStartKey } from "./sevenSealsTime";

export const SEVEN_SEALS_RANGES: Record<
  number,
  { pAtk: [number, number]; pDef: [number, number]; coinLuck: [number, number] }
> = {
  1: { pAtk: [125, 750], pDef: [154, 456], coinLuck: [5, 20] },
  2: { pAtk: [100, 500], pDef: [100, 400], coinLuck: [5, 15] },
  3: { pAtk: [80, 300], pDef: [80, 300], coinLuck: [5, 10] },
};

function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export type SevenSealsBonusJson = {
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  coinLuck: number;
  rank: number;
  expiresAt: number;
  claimedWeekStart: string;
};

export function buildSevenSealsBonus(rank: number, awardWeekMondayUtc: Date, grantedAt: Date = new Date()): SevenSealsBonusJson {
  const r = SEVEN_SEALS_RANGES[rank] || SEVEN_SEALS_RANGES[3];
  const coinLuckReward = rand(r.coinLuck[0], r.coinLuck[1]);
  const expiresAt = getNextSevenSealsSaturday22UtcAfter(grantedAt).getTime();
  const claimedWeekStart = weekStartKey(awardWeekMondayUtc);

  return {
    pAtk: rand(r.pAtk[0], r.pAtk[1]),
    mAtk: rand(r.pAtk[0], r.pAtk[1]),
    pDef: rand(r.pDef[0], r.pDef[1]),
    mDef: rand(r.pDef[0], r.pDef[1]),
    coinLuck: coinLuckReward,
    rank,
    expiresAt,
    claimedWeekStart,
  };
}

/**
 * Нарахувати бонус топ-N (якщо ще не отримано за цей тиждень). Повертає true якщо оновлено.
 */
export async function grantSevenSealsRewardIfNeeded(
  prisma: PrismaClient,
  characterId: string,
  rank: number,
  awardWeekMondayUtc: Date,
  grantedAt: Date = new Date()
): Promise<{ applied: boolean; bonus?: SevenSealsBonusJson; skipped?: string }> {
  const awardKey = weekStartKey(awardWeekMondayUtc);
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true, heroJson: true, coinLuck: true },
  });
  if (!character) return { applied: false, skipped: "character_not_found" };

  const heroJson = (character.heroJson as Record<string, unknown>) || {};
  const existing = heroJson.sevenSealsBonus as { claimedWeekStart?: string } | undefined;
  if (existing?.claimedWeekStart === awardKey) {
    return { applied: false, skipped: "already_claimed", bonus: heroJson.sevenSealsBonus as SevenSealsBonusJson };
  }

  const sevenSealsBonus = buildSevenSealsBonus(rank, awardWeekMondayUtc, grantedAt);
  const updatedHeroJson = {
    ...heroJson,
    sevenSealsBonus,
  };

  await prisma.character.update({
    where: { id: characterId },
    data: {
      heroJson: updatedHeroJson,
      coinLuck: { increment: BigInt(Math.floor(sevenSealsBonus.coinLuck)) },
    },
  });

  return { applied: true, bonus: sevenSealsBonus };
}
