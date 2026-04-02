import { fixHeroProfession } from "./fixProfession";
import {
  normalizeProfessionId,
  getProfessionDefinition,
  getDefaultProfessionForKlass,
  getSkillsForProfession,
  allSkills,
} from "../data/skills";
import type { ProfessionId } from "../data/skills/professionTypes";
import { PROFESSION_CHAIN } from "../data/skills/professionChain";
import { getLearnSkillFailureReason } from "../state/heroStore/heroSkills";
import { ONBOARDING_GUILD_NEED_SP_KEY } from "../state/gameSettings";
import type { Hero } from "../types/Hero";
import { isMysticHero } from "./isMysticHero";

const GUILD_PATH = "/guild";

/** До цього рівня (включно 19) показуємо покроковий онбординг */
const ONBOARDING_MAX_LEVEL = 19;

export interface TutorialHintBattleContext {
  status: string;
  loadoutSlots: (number | string | null)[];
  activeChargeSlots: number[];
}

export interface TutorialHintPickContext {
  pathname: string;
  /** query з URL, напр. ?zone=...&idx=... */
  search: string;
  battle?: TutorialHintBattleContext | null;
}

export interface ContextualTutorialHint {
  id: string;
  message: string;
  ctaPath: string;
  ctaLabel: string;
  /** Тільки кнопка «Понятно» (закрити підказку), без переходу */
  closeOnly?: boolean;
}

function normPath(p: string): string {
  return p.replace(/\?.*$/, "").replace(/\/+$/, "") || "/";
}

function zoneIdFromLocation(pathname: string, search: string): string {
  if (normPath(pathname) !== "/location") return "";
  const q = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  return (params.get("id") || params.get("zone") || "").trim();
}

function resolveChosenProfessionId(hero: unknown): ProfessionId | null {
  if (!hero || typeof hero !== "object") return null;
  const fixed = fixHeroProfession(hero as Record<string, unknown>);
  const defaultProfession = getDefaultProfessionForKlass(
    String(fixed.klass ?? ""),
    String(fixed.race ?? "")
  ) as ProfessionId | null;
  const h = hero as Record<string, unknown>;
  const currentProfession = fixed.profession || h.profession;
  const heroProfessionId =
    (normalizeProfessionId(currentProfession as ProfessionId | string | null) ??
      defaultProfession) as ProfessionId;

  const race = String(fixed.race ?? "").toLowerCase();
  const isDarkElf =
    race.includes("dark") || race.includes("темный") || race.includes("темний");
  const isDwarf =
    race.includes("dwarf") || race.includes("гном") || race.includes("dwarven");
  const professionStr = (heroProfessionId || "").toLowerCase();
  const chosen: ProfessionId =
    (isDarkElf && professionStr.includes("human_mystic")) ||
    (isDwarf && professionStr.includes("human_fighter"))
      ? (defaultProfession as ProfessionId)
      : heroProfessionId;

  return chosen || null;
}

function affordableLearnableSkillExists(hero: Hero, profession: ProfessionId): boolean {
  const mysticOpts = isMysticHero(hero) ? ({ mageGuildSpellbooks: true } as const) : undefined;
  for (const sk of getSkillsForProfession(profession)) {
    if (getLearnSkillFailureReason(hero, sk.id, mysticOpts) === null) return true;
  }
  return false;
}

function hasSkillProgressAvailable(hero: Hero, profession: ProfessionId): boolean {
  const mysticOpts = isMysticHero(hero) ? ({ mageGuildSpellbooks: true } as const) : undefined;
  for (const sk of getSkillsForProfession(profession)) {
    const r = getLearnSkillFailureReason(hero, sk.id, mysticOpts);
    if (r === null || r === "sp" || r === "spellbook") return true;
  }
  return false;
}

function hasLearnedActiveSkillNotOnLoadout(
  hero: Hero,
  loadoutSlots: (number | string | null)[]
): boolean {
  const learned = Array.isArray(hero.skills) ? hero.skills : [];
  const numericSlots = new Set(
    loadoutSlots.filter((v): v is number => typeof v === "number" && v !== 0)
  );
  for (const ls of learned) {
    const id = Number(ls?.id);
    const lv = Number(ls?.level ?? 0);
    if (!Number.isFinite(id) || id <= 0 || lv < 1) continue;
    const def = allSkills.find((s) => s.id === id);
    if (!def || def.category === "passive") continue;
    if (!numericSlots.has(id)) return true;
  }
  return false;
}

function hasConsumablesInInventory(hero: Hero): boolean {
  const inv = Array.isArray(hero.inventory) ? hero.inventory : [];
  return inv.some(
    (item: { slot?: string; count?: number }) =>
      item && item.slot === "consumable" && (item.count ?? 0) > 0
  );
}

function hasConsumableOnLoadout(loadoutSlots: (number | string | null)[]): boolean {
  return loadoutSlots.some(
    (v) => typeof v === "string" && String(v).startsWith("consumable:")
  );
}

function guildNeedSpFlag(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(ONBOARDING_GUILD_NEED_SP_KEY) === "1";
  } catch {
    return false;
  }
}

function pickOnboardingTutorialHint(
  hero: Hero,
  level: number,
  dismissedIds: Set<string>,
  ctx: TutorialHintPickContext
): ContextualTutorialHint | null {
  if (level > ONBOARDING_MAX_LEVEL) return null;

  const path = normPath(ctx.pathname);
  const zoneId = zoneIdFromLocation(ctx.pathname, ctx.search);

  const battle = ctx.battle;
  const fighting = battle?.status === "fighting";
  const slots = battle?.loadoutSlots ?? [];

  if (
    path === GUILD_PATH &&
    guildNeedSpFlag() &&
    !dismissedIds.has("onboard_guild_low_sp")
  ) {
    return {
      id: "onboard_guild_low_sp",
      message:
        "У вас не хватает SP. Вернитесь в город, затем в окрестность — убейте мобов, накопите SP и снова прокачайте умение в гильдии навыков.",
      ctaPath: "/city",
      ctaLabel: "В город",
    };
  }

  const cityLike = path === "/city" || path === "/";
  if (cityLike && !dismissedIds.has("onboard_magic_statue")) {
    return {
      id: "onboard_magic_statue",
      message:
        "Зайдите в магическую статую в городе и возьмите бесплатный баф — он усилит персонажа перед охотой на мобов.",
      ctaPath: "/magic-statue",
      ctaLabel: "Магическая статуя",
    };
  }

  if (cityLike && isMysticHero(hero) && !dismissedIds.has("onboard_mage_guild_intro")) {
    return {
      id: "onboard_mage_guild_intro",
      message:
        "Перейдите в гильдию магов в городе — там изучают боевые скиллы и заклинания за очки умений (SP).",
      ctaPath: "/mage-guild",
      ctaLabel: "Гильдия магов",
    };
  }

  if (path === "/gk" && !dismissedIds.has("onboard_gk_zones")) {
    return {
      id: "onboard_gk_zones",
      message:
        "Выберите город и локацию не выше вашего уровня (смотрите уровень мобов), затем нападайте на монстров, чтобы получать опыт и SP.",
      ctaPath: "",
      ctaLabel: "",
      closeOnly: true,
    };
  }

  if (path === "/location" && zoneId && !dismissedIds.has("onboard_location_mobs")) {
    return {
      id: "onboard_location_mobs",
      message:
        "Нажмите на моба своего уровня или ниже, чтобы начать бой. В бою следите за HP и MP.",
      ctaPath: "",
      ctaLabel: "",
      closeOnly: true,
    };
  }

  if (path === "/battle" && fighting && !dismissedIds.has("onboard_battle_items")) {
    const invCons = hasConsumablesInInventory(hero);
    const onBar = hasConsumableOnLoadout(slots);
    if (invCons && !onBar) {
      return {
        id: "onboard_battle_items",
        message:
          "Откройте панель умений внизу, переключитесь на вкладку предметов и перетащите на панель банки HP/MP и заряды (сосоки), чтобы использовать их в бою.",
        ctaPath: "",
        ctaLabel: "",
        closeOnly: true,
      };
    }
    return {
      id: "onboard_battle_items",
      message:
        "Внизу экрана — панель умений и предметов. Добавьте на слоты банки для HP/MP и заряды, чтобы быстрее выигрывать бои.",
      ctaPath: "",
      ctaLabel: "",
      closeOnly: true,
    };
  }

  if (
    path === "/battle" &&
    fighting &&
    dismissedIds.has("onboard_battle_items") &&
    hasLearnedActiveSkillNotOnLoadout(hero, slots) &&
    !dismissedIds.has("onboard_battle_skillbar")
  ) {
    return {
      id: "onboard_battle_skillbar",
      message:
        "Вы изучили новое умение — добавьте его на панель: откройте слот, выберите раздел магии и поставьте скилл в свободную ячейку.",
      ctaPath: "",
      ctaLabel: "",
      closeOnly: true,
    };
  }

  const learnHintBlockedPaths = new Set([
    "/gk",
    "/location",
    "/battle",
    GUILD_PATH,
    "/mage-guild",
    "/help",
  ]);

  const profession = resolveChosenProfessionId(hero);
  if (!profession) return null;

  if (
    !learnHintBlockedPaths.has(path) &&
    affordableLearnableSkillExists(hero, profession) &&
    !dismissedIds.has("onboard_go_learn_skill")
  ) {
    if (isMysticHero(hero)) {
      return {
        id: "onboard_go_learn_skill",
        message:
          "Доступно новое заклинание или уровень скила за SP! Перейдите в гильдию магов и изучите умение.",
        ctaPath: "/mage-guild",
        ctaLabel: "Гильдия магов",
      };
    }
    return {
      id: "onboard_go_learn_skill",
      message:
        "Доступно новое умение за SP! Перейдите в гильдию навыков (в городе) и изучите или прокачайте скилл.",
      ctaPath: GUILD_PATH,
      ctaLabel: "В гильдию навыков",
    };
  }

  const farmSpPaths = new Set(["/city", "/", "/character"]);
  if (
    farmSpPaths.has(path) &&
    !affordableLearnableSkillExists(hero, profession) &&
    hasSkillProgressAvailable(hero, profession) &&
    (hero.sp ?? 0) < 50 &&
    level >= 2 &&
    !dismissedIds.has("onboard_farm_sp_for_skill")
  ) {
    return {
      id: "onboard_farm_sp_for_skill",
      message:
        "Чтобы прокачать умение, нужно больше SP. Вернитесь в телепорт, выберите локацию и убивайте мобов, пока не накопите очки умений.",
      ctaPath: "/gk",
      ctaLabel: "Телепорт",
    };
  }

  return null;
}

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

/**
 * Контекстні підказки (російською). Онбординг до 20 рівня, потім віхи професії / гільдія.
 */
export function pickContextualTutorialHint(
  hero: unknown,
  dismissedIds: Set<string>,
  pickCtx?: TutorialHintPickContext
): ContextualTutorialHint | null {
  if (!hero || typeof hero !== "object") return null;
  const h = fixHeroProfession(hero as any);
  const level = Number((h as any).level) || 1;
  const heroTyped = h as Hero;

  if (pickCtx) {
    const onboarding = pickOnboardingTutorialHint(heroTyped, level, dismissedIds, pickCtx);
    if (onboarding) return onboarding;
  }

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
