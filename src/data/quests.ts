// src/data/quests.ts
// Файл для зберігання даних квестів

export type QuestKillTarget = {
  /** Канонічна назва моба (як у даних зони) або підпис у UI */
  mobName: string;
  /** Лічильник за id (наприклад l2dop_20120 для Волка, включно з чемпіонами) */
  mobIdPrefix?: string;
  requiredCount: number;
  progressKey: string;
  /** Вбивства агро-мобів (aggressivePatrol / aggressiveGroup) лише в цій зоні (id зони, напр. l2dop_gludio_02) */
  aggressiveKillsInZone?: string;
  /** Будь-який рейд-бос зони (isRaidBoss) у цій зоні */
  raidBossKillInZone?: string;
  /** mob.name починається з цього (напр. "[Чемпіон] Рощовий Лорд" для III/IV тощо) */
  mobNamePrefix?: string;
  /** Лічити вбивство лише в цій зоні (разом із mobIdPrefix / mobName / mobNamePrefix) */
  killInZoneId?: string;
};

export interface Quest {
  id: string;
  name: string;
  description: string;
  level: number;
  /** Іконка у вкладці квестів (наприклад /nps/6.png) */
  icon?: string;
  location?: string; // Локація квесту
  locationLevel?: string; // Рівні локації (наприклад, "1-5")
  rewards?: {
    exp?: number;
    adena?: number;
    sp?: number;
    /** Серебряные монеты (quest shop), hero.coins_silver */
    coins_silver?: number;
    items?: Array<{ id: string; count: number }>;
  };
  requirements?: {
    level?: number;
    items?: Array<{ id: string; count: number }>;
  };
  status?: "available" | "in_progress" | "completed";
  progress?: Record<string, number>;
  questDrops?: Array<{
    mobName: string;
    itemId: string;
    requiredCount: number;
    location?: string;
    /** Якщо задано — дроп і підказка на локації лише для зон з id, що починається з префікса (напр. floran_village). */
    dropZoneIdPrefix?: string;
    /** При прийнятті квесту випадкова кількість [min..max] зберігається в activeQuest.rolledQuestDropNeeds[itemId]; requiredCount = верхня межа для fallback */
    requiredCountRandom?: { min: number; max: number };
    /** Підказка у вкладці «Квести»: де фармити цей тип предмета (зона, орієнтир). */
    farmHint?: string;
  }>;
  /** Після прийняття згенерувати rolledRewardBonus у записі активного квесту (людські / темноельфійські перші профи). */
  randomFirstProfBonus?: boolean;
  /** Лічильники вбивств (оновлюються при перемозі над мобом) */
  questKillTargets?: QuestKillTarget[];
  /** Коротка підказка + кнопка «Крафт ресурсів» у вкладці квестів (якщо передано navigate) */
  resourceCraftHint?: string;
}

/** Квест першої професії тільки для світлого ельфа-мага (базова профа `elven_mystic`). */
export const ELVEN_MYSTIC_FIRST_PROF_QUEST_ID = "elven_mystic_first_profession_materials";

export function isHeroElvenMysticBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  if (p !== "elven_mystic" && p !== "elven_mystic_base") return false;
  const r = String(hero.race || "").toLowerCase();
  if (r.includes("dark") || r.includes("темн")) return false;
  return true;
}

/** Квест першої професії — світлий ельф-воїн (база `elven_fighter`). */
export const ELVEN_FIGHTER_FIRST_PROF_QUEST_ID = "elven_fighter_first_profession_trophies";

export function isHeroElvenFighterBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  if (p !== "elven_fighter") return false;
  const r = String(hero.race || "").toLowerCase();
  if (r.includes("dark") || r.includes("темн")) return false;
  return true;
}

/**
 * Id міста з `src/data/world` (поле City.id), куди «належить» квест за текстом location.
 * Якщо undefined — квест не прив’язаний до відомого міста (не показуємо на дошці регіонально).
 */
export function getQuestCityId(quest: Pick<Quest, "location">): string | undefined {
  const loc = String(quest.location || "").trim();
  if (!loc) return undefined;
  if (loc.startsWith("Глудио")) return "l2dop_gludio";
  if (loc.startsWith("Floran")) return "floran_village";
  if (loc.startsWith("Gludin")) return "gludin_village";
  return undefined;
}

/** Людина (не темний ельф, не орк, не гном). */
export function isHeroHumanRaceForQuests(hero: { race?: string | null }): boolean {
  const r = String(hero.race || "").toLowerCase();
  if (r.includes("dark") || r.includes("темн") || r.includes("тёмн")) return false;
  if (r.includes("elf") || r.includes("ельф") || r.includes("эльф")) return false;
  if (r.includes("orc") || r.includes("орк")) return false;
  if (r.includes("dwarf") || r.includes("гном") || r.includes("dwarven")) return false;
  return r.includes("human") || r.includes("человек") || r.includes("людин") || r.trim() === "";
}

export const HUMAN_FIGHTER_FIRST_PROF_QUEST_ID = "human_fighter_first_profession_reagents";

export const HUMAN_MYSTIC_FIRST_PROF_QUEST_ID = "human_mystic_first_profession_essences";

export function isHeroHumanFighterBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroHumanRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "human_fighter";
}

export function isHeroHumanMysticBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroHumanRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "human_mystic_base" || p === "human_mystic";
}

/** Темний ельф за полем раси (укр./рос./англ.). */
export function isHeroDarkElfRaceForQuests(hero: { race?: string | null }): boolean {
  const r = String(hero.race || "").toLowerCase();
  return r.includes("dark") || r.includes("темн") || r.includes("тёмн");
}

export const DARK_FIGHTER_FIRST_PROF_QUEST_ID = "dark_elf_fighter_first_profession_effigies";

export const DARK_MYSTIC_FIRST_PROF_QUEST_ID = "dark_elf_mystic_first_profession_sigils";

export function isHeroDarkFighterBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroDarkElfRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "dark_fighter";
}

export function isHeroDarkMysticBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroDarkElfRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "dark_mystic_base";
}

/** Раса орк (укр./рос./англ.). */
export function isHeroOrcRaceForQuests(hero: { race?: string | null }): boolean {
  const r = String(hero.race || "").toLowerCase();
  return r.includes("orc") || r.includes("орк");
}

export const ORC_FIGHTER_FIRST_PROF_QUEST_ID = "orc_fighter_first_profession_totems";

export const ORC_MYSTIC_FIRST_PROF_QUEST_ID = "orc_mystic_first_profession_charms";

export function isHeroOrcFighterBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroOrcRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "orc_fighter";
}

export function isHeroOrcMysticBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroOrcRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "orc_mystic_base";
}

/** Раса гном (укр./рос./англ.). */
export function isHeroDwarvenRaceForQuests(hero: { race?: string | null }): boolean {
  const r = String(hero.race || "").toLowerCase();
  return r.includes("dwarf") || r.includes("гном") || r.includes("dwarven");
}

/** Квест першої професії — гном-воїн (база `dwarven_fighter`). Окремого «мага» у гномів немає. */
export const DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID = "dwarven_fighter_first_profession_samples";

export function isHeroDwarvenFighterBaseForFirstProfQuest(hero: {
  profession?: string | null;
  race?: string | null;
}): boolean {
  if (!isHeroDwarvenRaceForQuests(hero)) return false;
  const p = String(hero.profession || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  return p === "dwarven_fighter";
}

/** Інвентарні id, що рахуються/знімаються разом із квестовим предметом (дроп зони vs quest_*). */
export const QUEST_ITEM_TURN_IN_ALIASES: Record<string, readonly string[]> = {
  quest_gludio_charcoal: ["charcoal"],
};

export const QUESTS: Quest[] = [
  {
    id: "gludio_outskirts_wolf_charcoal",
    icon: "/nps/6.png",
    name: "Окраина Глудио: волки и уголь",
    description:
      "Убейте 5 волков в окрестностях Глудио. Принеси 5 Charcoal (выпадает с разных мобов зоны). После выполнения условий сдай через вкладку «Квесты» персонажа. Награда: 20 серебряных монет — можно потратить в квест-шопе.",
    level: 1,
    location: "Глудио — Окраина",
    locationLevel: "1–5",
    requirements: { level: 1 },
    rewards: { adena: 100_000, exp: 50_000, coins_silver: 20 },
    questKillTargets: [
      {
        mobName: "Волк",
        mobIdPrefix: "l2dop_20120",
        requiredCount: 5,
        progressKey: "gludio_wolf_kills",
      },
    ],
    questDrops: [
      { mobName: "Гоблин", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Материй Кельтир", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Молодой Шакал", itemId: "quest_gludio_charcoal", requiredCount: 5 },
      { mobName: "Бородатий Шакал", itemId: "quest_gludio_charcoal", requiredCount: 5 },
    ],
  },
  {
    id: "gludio_marsh_aggro_rb_suede",
    icon: "/nps/6.png",
    name: "Глудио — Луга: агро, рейд и замша",
    description:
      "На локации «Глудио — Луга» убейте 10 агрессивных мобов (агро-патруль или группа), одного рейдового босса зоны (в т.ч. «Raid Boss: Страж Лугів» и др.) и сдайте 10 Suede. Награда: 50 000 SP, 150 000 адены, 20 серебряных монет.",
    level: 3,
    location: "Глудио — Луга",
    locationLevel: "3–8",
    requirements: { level: 3 },
    rewards: { sp: 50_000, adena: 150_000, coins_silver: 20 },
    questKillTargets: [
      {
        mobName: "Агресивні моби (Луга)",
        progressKey: "gludio_marsh_aggro_kills",
        requiredCount: 10,
        aggressiveKillsInZone: "l2dop_gludio_02",
      },
      {
        mobName: "Рейдовий бос зони (Луга)",
        progressKey: "gludio_marsh_raid_kill",
        requiredCount: 1,
        raidBossKillInZone: "l2dop_gludio_02",
      },
    ],
    questDrops: [
      { mobName: "Гоблин", itemId: "suede", requiredCount: 10 },
      { mobName: "Бес", itemId: "suede", requiredCount: 10 },
      { mobName: "Старий Бес", itemId: "suede", requiredCount: 10 },
      { mobName: "Орк Лучник", itemId: "suede", requiredCount: 10 },
    ],
  },
  {
    id: "gludio_grove_orc_champion_thread",
    icon: "/nps/6.png",
    name: "Глудио — Роща: орки, чемпион и нить",
    description:
      "У околицях «Глудио — Роща» убийте 15 Орк Воїн, одного чемпіона «Рощовий Лорд» (напр. [Чемпіон] Рощовий Лорд III) та здайте 5 Thread. Нагорода: 50 000 SP, 50 000 досвіду, 100 000 адени, 10 серебряных монет.",
    level: 5,
    location: "Глудио — Роща",
    locationLevel: "5–12",
    requirements: { level: 5 },
    rewards: { sp: 50_000, exp: 50_000, adena: 100_000, coins_silver: 10 },
    questKillTargets: [
      {
        mobName: "Орк Воїн",
        mobIdPrefix: "l2dop_20093",
        requiredCount: 15,
        progressKey: "gludio_grove_orc_fighter",
        killInZoneId: "l2dop_gludio_03",
      },
      {
        mobName: "[Чемпіон] Рощовий Лорд",
        mobNamePrefix: "[Чемпіон] Рощовий Лорд",
        requiredCount: 1,
        progressKey: "gludio_grove_champion_lord",
        killInZoneId: "l2dop_gludio_03",
      },
    ],
    questDrops: [
      { mobName: "Гоблин", itemId: "thread", requiredCount: 5 },
      { mobName: "Скелет", itemId: "thread", requiredCount: 5 },
      { mobName: "Орк Воїн", itemId: "thread", requiredCount: 5 },
      { mobName: "Глаз Монстра", itemId: "thread", requiredCount: 5 },
      { mobName: "Ельпі", itemId: "thread", requiredCount: 5 },
    ],
  },
  {
    id: "gludio_swamp_aggro_rb_champion",
    icon: "/nps/6.png",
    name: "Глудио — Болото: агро, рейд и чемпион",
    description:
      "На локации «Глудио — Болото» убейте 10 агрессивных мобов (агро-патруль или группа), одного рейдового босса зоны (в т.ч. Raid Boss: Страж Болота и др.) и чемпиона «Болотний Тінь» (напр. [Чемпіон] Болотний Тінь III). Награда: 300 000 адены, 100 000 опыта, 20 серебряных монет.",
    level: 10,
    location: "Глудио — Болото",
    locationLevel: "10–18",
    requirements: { level: 10 },
    rewards: { adena: 300_000, exp: 100_000, coins_silver: 20 },
    questKillTargets: [
      {
        mobName: "Агресивні моби (Болото)",
        progressKey: "gludio_swamp_aggro_kills",
        requiredCount: 10,
        aggressiveKillsInZone: "l2dop_gludio_04",
      },
      {
        mobName: "Рейдовий бос зони (Болото)",
        progressKey: "gludio_swamp_raid_kill",
        requiredCount: 1,
        raidBossKillInZone: "l2dop_gludio_04",
      },
      {
        mobName: "[Чемпіон] Болотний Тінь",
        mobNamePrefix: "[Чемпіон] Болотний Тінь",
        requiredCount: 1,
        progressKey: "gludio_swamp_champion_shadow",
        killInZoneId: "l2dop_gludio_04",
      },
    ],
  },
  {
    id: "gludio_ruins_rb_varnish_tattoo",
    icon: "/nps/6.png",
    name: "Глудио — Руины: рейд и лак",
    description:
      "На локации «Глудио — Руины» убейте рейдового босса зоны (в т.ч. Raid Boss: Король Руїн) и сдайте 30 Varnish. Награда: 500 000 адены, 350 000 опыта и тату «Тату стійкості руїн» D-grade (+50 pDef / +50 mDef / +300 HP / +100 MP), можно одеть с 20 ур.",
    level: 14,
    location: "Глудио — Руины",
    locationLevel: "14–22",
    requirements: { level: 14 },
    rewards: {
      adena: 500_000,
      exp: 350_000,
      items: [{ id: "tattoo_gludio_ruins_cr_passive", count: 1 }],
    },
    questKillTargets: [
      {
        mobName: "Рейдовий бос зони (Руїни)",
        progressKey: "gludio_ruins_raid_kill",
        requiredCount: 1,
        raidBossKillInZone: "l2dop_gludio_05",
      },
    ],
    questDrops: [
      { mobName: "Гоблин", itemId: "varnish", requiredCount: 30 },
      { mobName: "Скелет", itemId: "varnish", requiredCount: 30 },
      { mobName: "Волк", itemId: "varnish", requiredCount: 30 },
      { mobName: "Орк Воїн", itemId: "varnish", requiredCount: 30 },
      { mobName: "Ельпі", itemId: "varnish", requiredCount: 30 },
    ],
  },
  {
    id: "gludio_lizards_cokes",
    icon: "/nps/6.png",
    name: "Глудио — Ящеры: кокс для кузни",
    description:
      "В зоне «Глудио — Ящеры» добудь 15 Coal и 15 Charcoal (ящеры и мобы зоны). В городе открой крафт ресурсов (с 20 ур.): 3 Charcoal + 3 Coal = 1 Cokes. Сделай 5 Cokes и сдай.",
    level: 20,
    location: "Глудио — Ящеры",
    locationLevel: "18–28",
    requirements: { level: 20 },
    resourceCraftHint: "Крафт (20 лвл.): 3 Charcoal + 3 Coal → 1× Cokes.",
    rewards: { adena: 200_000, exp: 120_000, coins_silver: 18 },
    questDrops: [
      {
        mobName: "дроп Coal/Charcoal в зоне, затем крафт в городе",
        itemId: "cokes",
        requiredCount: 5,
      },
    ],
  },
  {
    id: ELVEN_MYSTIC_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь мага Эльфов — отзвуки стихий",
    description:
      "Гильдия магов требует доказательств владения силами в окрестностях Floran Village (зоны «Дикий сад» и «Старый каменный круг», 15–25 ур.). " +
      "Добудите квестовые эссенции с Lirein, Will-O-Wisp и Undine; пока квест активен, мобы помечены «квест · добыча». " +
      "Сдайте во вкладке «Квесты». После сдачи на 20 уровне в гильдии откроется выбор первой профессии (Elven Wizard / Elven Oracle).",
    level: 18,
    location: "Floran Village — окрестности",
    locationLevel: "15–25",
    requirements: { level: 18 },
    rewards: { exp: 25_000, adena: 50_000 },
    questDrops: [
      {
        mobName: "Lirein",
        itemId: "quest_elf_mprof_lirein_whisper",
        requiredCount: 15,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Will-O-Wisp",
        itemId: "quest_elf_mprof_wisp_flame",
        requiredCount: 10,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Undine",
        itemId: "quest_elf_mprof_undine_mirror",
        requiredCount: 5,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
    ],
  },
  {
    id: ELVEN_FIGHTER_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь воина Эльфов — трофеи для первой профессии",
    description:
      "Гильдия воинов эльфов ждёт доказательств вашей готовности. Охотьтесь в окрестностях Floran Village (зоны «Дикий сад» 15–21 ур. и «Старый каменный круг» 19–25 ур.). " +
      "Добудите и сдайте во вкладке «Квесты»: 10× Клык ядовитого паука (Venomous Spider), 10× Лист духа (Lirein), 8× Осколок кости вождя скелетов (Tracker Skeleton Leader), 6× Жетон крысолюда (Boogle Ratman Leader). " +
      "Пока квест активен, эти мобы отмечены подсказкой «квест · добыча»; как только нужный предмет собран в нужном количестве — метка с этого типа мобов пропадает. После сдачи на 20 уровне в гильдии откроется выбор первой профессии (Elven Knight / Elven Scout).",
    level: 18,
    location: "Floran Village — окрестности (флоранские зоны)",
    locationLevel: "15–25",
    requirements: { level: 18 },
    rewards: { exp: 25_000, adena: 50_000 },
    questDrops: [
      {
        mobName: "Venomous Spider",
        itemId: "quest_elf_fprof_spider_fang",
        requiredCount: 10,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Lirein",
        itemId: "quest_elf_fprof_lirein_leaf",
        requiredCount: 10,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Tracker Skeleton Leader",
        itemId: "quest_elf_fprof_bone_shard",
        requiredCount: 8,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Boogle Ratman Leader",
        itemId: "quest_elf_fprof_ratman_badge",
        requiredCount: 6,
        location: "floran_village_03 / floran_village_04",
        dropZoneIdPrefix: "floran_village",
      },
    ],
  },
  {
    id: HUMAN_FIGHTER_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь человека-воина — реагенты для первой профессии",
    description:
      "Гильдия бойцов поручает собрать редкие реагенты в окрестностях Gludin Village (зоны 15–19 и 17–22 уровня). " +
      "Цель каждого предмета определяется случайно при приёме квеста (диапазон указан ниже). Дополнительная награда (адена, опыт, серебряные монеты) тоже выпадает случайно один раз — смотрите блок «Доп. награда» в активном квесте. " +
      "Мобы с нужным дропом помечены «квест · добыча», пока не набран нужный объём. После сдачи на 20 уровне откроется выбор первой профессии (Warrior / Knight / Rogue).",
    level: 18,
    location: "Gludin Village — окрестности",
    locationLevel: "15–22",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Evil Eye Seer",
        itemId: "quest_human_fprof_seer_orb",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Arachnid Tracker",
        itemId: "quest_human_fprof_tracker_spur",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Stink Zombie",
        itemId: "quest_human_fprof_zombie_ichor",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Skeleton Scout",
        itemId: "quest_human_fprof_scout_sigil",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "gludin_village",
      },
    ],
  },
  {
    id: HUMAN_MYSTIC_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь человека-мага — эссенции для первой профессии",
    description:
      "Гильдия магов просит собрать магические эссенции у мобов Gludin Village (зоны 15–22 уровня). Количество каждого компонента случайно при приёме задания; есть случайный бонус к награде — он уже показан в активном квесте. " +
      "После сдачи на 20 уровне откроется путь Cleric / Wizard.",
    level: 18,
    location: "Gludin Village — окрестности",
    locationLevel: "15–22",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Lirein Elder",
        itemId: "quest_human_mprof_fae_branch",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Salamander Noble",
        itemId: "quest_human_mprof_salamander_core",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Undine Noble",
        itemId: "quest_human_mprof_undine_tear",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Undead Slave",
        itemId: "quest_human_mprof_bone_script",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "gludin_village",
      },
    ],
  },
  {
    id: DARK_FIGHTER_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь тёмного эльфа-воина — эффигии кошмара",
    description:
      "Гильдия наёмников требует доказательства из окрестностей Floran Village (зоны «Дикий сад» и «Старый каменный круг», 15–25 ур.). " +
      "Случайные количества трофеев и бонус к награде определяются при приёме и отображаются в активном квесте. " +
      "После сдачи на 20 уровне откроется выбор Palus Knight / Assassin.",
    level: 18,
    location: "Floran Village — окрестности",
    locationLevel: "15–25",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Lesser Dark Horror",
        itemId: "quest_defelf_fprof_lesser_cinder",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Shade Horror",
        itemId: "quest_defelf_fprof_shade_hook",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Crypt Horror",
        itemId: "quest_defelf_fprof_crypt_chain",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Oblivion Watcher",
        itemId: "quest_defelf_fprof_oblivion_tag",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "floran_village",
      },
    ],
  },
  {
    id: DARK_MYSTIC_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь тёмного эльфа-мага — знаки стихий",
    description:
      "Гильдия тёмной магии поручает собрать конденсаты сил в Floran Village. Число каждого компонента и дополнительная награда выпадают при приёме. " +
      "После сдачи на 20 уровне доступны Dark Wizard / Shillien Oracle.",
    level: 18,
    location: "Floran Village — окрестности",
    locationLevel: "15–25",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Will-O-Wisp",
        itemId: "quest_defelf_mprof_wisp_husk",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Mana Seeker",
        itemId: "quest_defelf_mprof_mana_splinter",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Scarlet Salamander",
        itemId: "quest_defelf_mprof_ember_scale",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "floran_village",
      },
      {
        mobName: "Undine",
        itemId: "quest_defelf_mprof_undine_drop",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "floran_village",
      },
    ],
  },
  {
    id: ORC_FIGHTER_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь орка-воина — тотемы клана",
    description:
      "Провидцы требуют доказательств из окрестностей Gludin Village (зоны 11–22 уровня). Случайные количества трофеев и бонус к награде определяются при приёме и отображаются в активном квесте. " +
      "Мобы с нужным дропом помечены «квест · добыча», пока не набран нужный объём. После сдачи на 20 уровне откроется выбор Orc Raider / Orc Monk.",
    level: 18,
    location: "Gludin Village — окрестности",
    locationLevel: "15–22",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Vuku Orc Fighter",
        itemId: "quest_orc_fprof_vuku_trophy",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Vuku Orc Archer",
        itemId: "quest_orc_fprof_archer_feather",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Enku Orc Shaman",
        itemId: "quest_orc_fprof_enku_fetish",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Enku Orc Champion",
        itemId: "quest_orc_fprof_champion_brand",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "gludin_village",
      },
    ],
  },
  {
    id: ORC_MYSTIC_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь орка-шамана — обереги стихий",
    description:
      "Соберите конденсаты сил в окрестностях Gludin Village. Число каждого компонента и дополнительная награда выпадают при приёме. " +
      "После сдачи на 20 уровне доступен путь Orc Shaman.",
    level: 18,
    location: "Gludin Village — окрестности",
    locationLevel: "15–22",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Orc Shaman",
        itemId: "quest_orc_mprof_shaman_claw",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Enku Orc Shaman",
        itemId: "quest_orc_mprof_enku_totem",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Mana Seeker",
        itemId: "quest_orc_mprof_mana_fractal",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Will-O-Wisp",
        itemId: "quest_orc_mprof_wisp_cinder",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "gludin_village",
      },
    ],
  },
  {
    id: DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID,
    icon: "/nps/6.png",
    name: "Путь гнома — образцы руин и шахт",
    description:
      "Гильдия ремесленников поручает собрать компоненты из руин и заброшенных работ окрестностей Gludin Village (зоны 11–22 уровня). " +
      "Количество каждого типа и бонус к награде определяются при приёме. После сдачи на 20 уровне откроется выбор Scavenger / Artisan.",
    level: 18,
    location: "Gludin Village — окрестности",
    locationLevel: "15–22",
    requirements: { level: 18 },
    randomFirstProfBonus: true,
    rewards: { exp: 22_000, adena: 45_000, coins_silver: 3 },
    questDrops: [
      {
        mobName: "Pitchstone Golem",
        itemId: "quest_dwarf_fprof_pitchstone_chip",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Dwarf Ghost",
        itemId: "quest_dwarf_fprof_ghost_dust",
        requiredCount: 14,
        requiredCountRandom: { min: 6, max: 14 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Ruin Imp",
        itemId: "quest_dwarf_fprof_ruin_ember",
        requiredCount: 12,
        requiredCountRandom: { min: 5, max: 12 },
        dropZoneIdPrefix: "gludin_village",
      },
      {
        mobName: "Obsidian Golem",
        itemId: "quest_dwarf_fprof_obsidian_splinter",
        requiredCount: 10,
        requiredCountRandom: { min: 4, max: 10 },
        dropZoneIdPrefix: "gludin_village",
      },
    ],
  },
];

export const QUESTS_BY_LOCATION: Record<string, Quest[]> = {};
QUESTS.forEach((quest) => {
  if (quest.location) {
    if (!QUESTS_BY_LOCATION[quest.location]) {
      QUESTS_BY_LOCATION[quest.location] = [];
    }
    QUESTS_BY_LOCATION[quest.location].push(quest);
  }
});
