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
  }>;
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
    name: "Путь мага Эльфов — материалы для первой профессии",
    description:
      "Принесите 15 Animal Skin, 10 Thread и 5 Iron Ore. Сдайте задание во вкладке персонажа «Квесты». После сдачи на 20 уровне в Гильдии магов откроется выбор первой профессии (Elven Wizard / Elven Oracle).",
    level: 18,
    location: "Гильдия магов — первая профессия",
    locationLevel: "18–20",
    requirements: { level: 18 },
    rewards: { exp: 25_000, adena: 50_000 },
    questDrops: [
      { mobName: "Орк Воин, Monster Eye и др.", itemId: "animal_skin", requiredCount: 15 },
      { mobName: "Гоблин, Скелет, Элпи и др.", itemId: "thread", requiredCount: 10 },
      { mobName: "Гриб, Летучая мышь, Орк и др.", itemId: "iron_ore", requiredCount: 5 },
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
