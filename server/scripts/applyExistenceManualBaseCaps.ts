/**
 * Те саме, що manual-fix-existence-base-caps.sql — для запуску без psql.
 * cd server && npx tsx scripts/applyExistenceManualBaseCaps.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  coerceBaseResourceTriplet,
  injectColumnBaseResourcesIntoHeroJson,
} from "../src/utils/characterBaseResources";

const ID = "cmldrjv0n001fya3wym7r5cq1";

const MANUAL = coerceBaseResourceTriplet({
  baseMaxHp: 7554,
  baseMaxMp: 780,
  baseMaxCp: 3792,
});

async function main() {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.character.findUnique({
      where: { id: ID },
      select: { id: true, name: true, heroJson: true },
    });
    if (!row) {
      console.error(`[applyManualCaps] character not found: ${ID}`);
      process.exit(1);
    }
    const hj =
      row.heroJson && typeof row.heroJson === "object" && !Array.isArray(row.heroJson)
        ? { ...(row.heroJson as Record<string, unknown>) }
        : {};
    const heroJson = injectColumnBaseResourcesIntoHeroJson(hj as Record<string, any>, MANUAL);
    await prisma.character.update({
      where: { id: ID },
      data: {
        baseMaxHp: MANUAL.baseMaxHp,
        baseMaxMp: MANUAL.baseMaxMp,
        baseMaxCp: MANUAL.baseMaxCp,
        heroJson: heroJson as object,
      },
    });
    console.log(`[applyManualCaps] OK: ${row.name} (${ID}) baseMax=`, MANUAL);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
