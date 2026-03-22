import { fixHeroProfession } from "./fixProfession";
import {
  normalizeProfessionId,
  getProfessionDefinition,
  getDefaultProfessionForKlass,
} from "../data/skills";
import type { ProfessionId } from "../data/skills/professionTypes";
import { PROFESSION_CHAIN } from "../data/skills/professionChain";

const GUILD_PATH = "/guild";

/** Чи є доступний вибір наступної професії (логіка як у GuildScreen) */
export function canChooseNextGuildProfession(hero: unknown): boolean {
  if (!hero || typeof hero !== "object") return false;
  const h = hero as Record<string, unknown>;
  const fixed = fixHeroProfession(h);
  const heroLevel = Number(fixed.level) || 1;
  const defaultProfession = getDefaultProfessionForKlass(
    String(fixed.klass ?? ""),
    String(fixed.race ?? "")
  ) as ProfessionId | null;
  const currentProfession = String(fixed.profession ?? "");
  const heroProfessionId =
    (normalizeProfessionId(currentProfession as ProfessionId | string | null) ??
      defaultProfession) as ProfessionId;

  const race = String(fixed.race ?? "").toLowerCase();
  const isDarkElf =
    race.includes("dark") || race.includes("темный") || race.includes("темний");
  const isDwarf =
    race.includes("dwarf") || race.includes("гном") || race.includes("dwarven");
  const professionStr = (heroProfessionId || "").toLowerCase();
  const chosenProfession: ProfessionId =
    (isDarkElf && professionStr.includes("human_mystic")) ||
    (isDwarf && professionStr.includes("human_fighter"))
      ? (defaultProfession as ProfessionId)
      : heroProfessionId;

  const nextProfessions = PROFESSION_CHAIN[chosenProfession] || [];
  return nextProfessions.some((pid) => {
    const def = getProfessionDefinition(pid);
    return def && heroLevel >= (def.minLevel ?? 1);
  });
}

export interface ContextualTutorialHint {
  id: string;
  message: string;
  ctaPath: string;
  ctaLabel: string;
}

/**
 * Контекстні підказки (російською). Порядок: спочатку важливіші (76 → 40 → 20 → гільдія).
 */
export function pickContextualTutorialHint(
  hero: unknown,
  dismissedIds: Set<string>
): ContextualTutorialHint | null {
  if (!hero || typeof hero !== "object") return null;
  const h = fixHeroProfession(hero as any);
  const level = Number((h as any).level) || 1;
  const canProf = canChooseNextGuildProfession(h);

  if (level >= 76 && canProf && !dismissedIds.has("milestone_prof_76")) {
    return {
      id: "milestone_prof_76",
      message:
        "Вы достигли 76 уровня! В гильдии навыков можно выбрать финальную профессию (третья ступень развития).",
      ctaPath: GUILD_PATH,
      ctaLabel: "В гильдию навыков",
    };
  }
  if (level >= 40 && canProf && !dismissedIds.has("milestone_prof_40")) {
    return {
      id: "milestone_prof_40",
      message:
        "Вы достигли 40 уровня! Зайдите в гильдию навыков и выберите следующую профессию (вторая ступень).",
      ctaPath: GUILD_PATH,
      ctaLabel: "В гильдию навыков",
    };
  }
  if (level >= 20 && canProf && !dismissedIds.has("milestone_prof_20")) {
    return {
      id: "milestone_prof_20",
      message:
        "Вы достигли 20 уровня! Перейдите в гильдию навыков и выберите первую профессию.",
      ctaPath: GUILD_PATH,
      ctaLabel: "В гильдию навыков",
    };
  }

  const blockGuildByProfession = level >= 20 && canProf;

  if (
    level >= 15 &&
    level < 20 &&
    !dismissedIds.has("milestone_guild_l15") &&
    !blockGuildByProfession
  ) {
    return {
      id: "milestone_guild_l15",
      message:
        "Скоро откроется выбор профессии. А пока загляните в гильдию навыков — за SP можно изучить и прокачать умения.",
      ctaPath: GUILD_PATH,
      ctaLabel: "Гильдия навыков",
    };
  }

  if (level >= 5 && !dismissedIds.has("milestone_guild_l5") && !blockGuildByProfession) {
    return {
      id: "milestone_guild_l5",
      message:
        "С повышением уровня открываются новые умения за SP. Перейдите в гильдию навыков, чтобы изучить и прокачать скиллы.",
      ctaPath: GUILD_PATH,
      ctaLabel: "В гильдию навыков",
    };
  }

  return null;
}
