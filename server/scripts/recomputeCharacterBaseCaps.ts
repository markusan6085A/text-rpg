/**
 * Одноразове виправлення Character.baseMaxHp/Mp/Cp + heroJson caps після кривого backfill,
 * коли в колонки потрапили бафнуті max*. Перерахунок як у клієнті: recalculateAllStats(…, [])
 * (рівень, раса, клас, екіп, пасиви в т.ч. Destroyer, камені LS, краски — без battle бафів).
 *
 * Запуск (з DATABASE_URL): cd server && npx tsx scripts/recomputeCharacterBaseCaps.ts
 * Перевірка без запису: ... --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { recalculateAllStats } from "../../src/utils/stats/recalculateAllStats";
import {
  coerceBaseResourceTriplet,
  injectColumnBaseResourcesIntoHeroJson,
} from "../src/utils/characterBaseResources";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const rows = await prisma.character.findMany({
    select: {
      id: true,
      name: true,
      heroJson: true,
      level: true,
      race: true,
      classId: true,
      baseMaxHp: true,
      baseMaxMp: true,
      baseMaxCp: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const hjRaw = row.heroJson;
    const hj =
      hjRaw && typeof hjRaw === "object" && !Array.isArray(hjRaw)
        ? { ...(hjRaw as Record<string, unknown>) }
        : {};

    // ❗ Не передавати battle-бафи в перерахунок бази: з heroJson має бути порожній heroBuffs.
    // recalculateAllStats НЕ читає heroBuffs сам — тільки масив buffs другим аргументом (нижче []).
    // Але знімаємо знімок полів, що могли б зіпсувати «базу»: battleStats, вкладений heroJson, бафи.
    const hero: Record<string, unknown> = {
      ...hj,
      level: row.level ?? (hj.level as number) ?? 1,
      race: (hj.race as string) || row.race,
      klass: (hj.klass as string) || (hj.classId as string) || row.classId,
      classId: row.classId,
      heroBuffs: [],
      hp: undefined,
      mp: undefined,
      cp: undefined,
      baseMaxHp: 999_999,
      maxHp: 999_999,
      baseMaxMp: 999_999,
      maxMp: 999_999,
      baseMaxCp: 999_999,
      maxCp: 999_999,
    };
    delete hero.battleStats;
    delete hero.heroJson;

    let rec: ReturnType<typeof recalculateAllStats>;
    try {
      rec = recalculateAllStats(hero as any, []);
    } catch (e) {
      errors++;
      console.error(`[recomputeBaseCaps] FAIL id=${row.id} name=${row.name}`, e);
      continue;
    }

    const next = coerceBaseResourceTriplet({
      baseMaxHp: rec.resources.maxHp,
      baseMaxMp: rec.resources.maxMp,
      baseMaxCp: rec.resources.maxCp,
    });

    const prev = coerceBaseResourceTriplet({
      baseMaxHp: row.baseMaxHp,
      baseMaxMp: row.baseMaxMp,
      baseMaxCp: row.baseMaxCp,
    });

    const changed =
      next.baseMaxHp !== prev.baseMaxHp ||
      next.baseMaxMp !== prev.baseMaxMp ||
      next.baseMaxCp !== prev.baseMaxCp;

    if (!changed) {
      skipped++;
      continue;
    }

    const newHeroJson = injectColumnBaseResourcesIntoHeroJson(hj as Record<string, any>, next);

    console.log(
      `[recomputeBaseCaps] ${row.name} (${row.id}): HP ${prev.baseMaxHp} -> ${next.baseMaxHp}, MP ${prev.baseMaxMp} -> ${next.baseMaxMp}, CP ${prev.baseMaxCp} -> ${next.baseMaxCp}${dryRun ? " [dry-run]" : ""}`,
    );

    if (!dryRun) {
      await prisma.character.update({
        where: { id: row.id },
        data: {
          baseMaxHp: next.baseMaxHp,
          baseMaxMp: next.baseMaxMp,
          baseMaxCp: next.baseMaxCp,
          heroJson: newHeroJson as object,
        },
      });
    }
    updated++;
  }

  console.log(
    `[recomputeBaseCaps] done: updated=${updated}, unchanged=${skipped}, errors=${errors}, dryRun=${dryRun}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
