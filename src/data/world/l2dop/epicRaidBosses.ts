// src/data/world/l2dop/epicRaidBosses.ts
// Канонічні епік-рейдбоси L2 (імена з оф. лору), прив’язані до зон l2dop за рівнем локації.
// У папці l2dop немає окремих записів «Queen Ant / Valakas» — тільки загальні РБ у mobs.ts;
// тут додаємо окремі сутності зі статами як у відповідного зонного РБ того ж tier.
//
// Респавн: base respawnTime (сек) для логіки/підказок; детальний текст — respawnLabelUkr (± рандом).
// Уже з дропом: QA/Core/Orfen (біжутерія 30%); Zaken + гранд-епіки (біжутерія 100%).
// xmlGrandRaidBossEpics.ts зараз порожній.

import type { RaidBoss } from "../../bosses/floran_overlord";
import { CORE_EPIC_DROPS } from "./coreEpicDrops";
import {
  ANTHARAS_EPIC_DROPS,
  BAIUM_EPIC_DROPS,
  FRINTEZZA_EPIC_DROPS,
  VALAKAS_EPIC_DROPS,
} from "./grandEpicRaidDrops";
import { ORFEN_EPIC_DROPS } from "./orfenEpicDrops";
import { QUEEN_ANT_EPIC_DROPS } from "./queenAntEpicDrops";
import { ZAKEN_EPIC_DROPS } from "./zakenEpicDrops";
import { XML_GRAND_RAID_BOSS_EPICS } from "./xmlGrandRaidBossEpics";

const H = 60 * 60;

/** Епіки додаються до пулу raidBosses зони з тим самим tier, що й звичайний РБ цієї зони. */
export const L2_EPIC_RAID_BOSSES: RaidBoss[] = [
  {
    id: "rb_epic_l2_queen_ant",
    name: "Raid Boss: Queen Ant (Королева мурахів)",
    lore:
      "Глибоко під Діонськими рівнинами її величність править безжальною ієрархією: лише гуркіт лап, крихітні вартові та безкінечні галереї формікарію. Королева Мурахів — живий символ рою: один удар її стражів стискає сталь, а сама вона не знає милосердя до чужинців. Казан золотого піску під її троном нерідко приховує те, що у світі називають реліквією: перстень, що зберіг отруйну волю матері-рою і холод її погляду.",
    level: 40,
    hp: 165000,
    mp: 0,
    pAtk: 900,
    mAtk: 480,
    pDef: 450,
    mDef: 310,
    exp: 91000,
    sp: 4800,
    adenaMin: 6800,
    adenaMax: 10500,
    dropChance: 1,
    drops: [...QUEEN_ANT_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 24 * H,
    respawnLabelUkr: "24 год ± 4 год (~раз на добу)",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_dion_07",
  },
  {
    id: "rb_epic_l2_core",
    name: "Raid Boss: Core",
    level: 50,
    hp: 295000,
    mp: 0,
    pAtk: 520,
    mAtk: 0,
    pDef: 408,
    mDef: 276,
    exp: 138000,
    sp: 7100,
    adenaMin: 55000,
    adenaMax: 85000,
    dropChance: 1,
    drops: [...CORE_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 36 * H,
    respawnLabelUkr: "36 год ± 4 год",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_oren_04",
  },
  {
    id: "rb_epic_l2_orfen",
    name: "Raid Boss: Orfen",
    lore:
      "Владарка Моря спор — не міф для глудіанських караванів: під зеленою плесінню і грибковими шатрами ходить легенда про павукоподібну сутність, що не терпить чужинців. Орфен збирає навколо себе отруйних слуг і старі таємниці Башхтарів; у її лігві іноді знаходять не лише C-grade трофеї, а й сережку з блакитним каменем — ніби уламок самого моря спор, що шепоче про кров і відновлення.",
    level: 52,
    hp: 335000,
    mp: 0,
    pAtk: 560,
    mAtk: 0,
    pDef: 442,
    mDef: 298,
    exp: 158000,
    sp: 8100,
    adenaMin: 62000,
    adenaMax: 96000,
    dropChance: 1,
    drops: [...ORFEN_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 36 * H,
    respawnLabelUkr: "36 год ± 4 год",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_oren_05",
  },
  {
    id: "rb_epic_l2_zaken",
    name: "Raid Boss: Zaken",
    level: 60,
    hp: 520000,
    mp: 0,
    pAtk: 890,
    mAtk: 0,
    pDef: 750,
    mDef: 505,
    exp: 280000,
    sp: 14200,
    adenaMin: 120000,
    adenaMax: 180000,
    dropChance: 1,
    drops: [...ZAKEN_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 48 * H,
    respawnLabelUkr: "48 год ± 2 год",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_aden_07",
  },
  {
    id: "rb_epic_l2_baium",
    name: "Raid Boss: Baium",
    level: 78,
    hp: 620000,
    mp: 0,
    pAtk: 3250,
    mAtk: 0,
    pDef: 1020,
    mDef: 690,
    exp: 395000,
    sp: 22200,
    adenaMin: 220000,
    adenaMax: 340000,
    dropChance: 1,
    drops: [...BAIUM_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    /** База 120 год + до 8 год рандому — для числового поля ~середина вікна */
    respawnTime: 124 * H,
    respawnLabelUkr: "5 діб (120 год) + рандом 0–8 год",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_goddard_03",
  },
  {
    id: "rb_epic_l2_frintezza",
    name: "Raid Boss: Frintezza",
    level: 80,
    hp: 760000,
    mp: 0,
    pAtk: 3550,
    mAtk: 1200,
    pDef: 1080,
    mDef: 820,
    exp: 480000,
    sp: 27500,
    adenaMin: 268000,
    adenaMax: 415000,
    dropChance: 1,
    drops: [...FRINTEZZA_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 48 * H,
    respawnLabelUkr: "48 год ± 2 год",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_goddard_06",
  },
  {
    id: "rb_epic_l2_antharas",
    name: "Raid Boss: Antharas",
    level: 81,
    hp: 800000,
    mp: 0,
    pAtk: 3750,
    mAtk: 0,
    pDef: 1140,
    mDef: 780,
    exp: 510000,
    sp: 29200,
    adenaMin: 285000,
    adenaMax: 440000,
    dropChance: 1,
    drops: [...ANTHARAS_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 192 * H,
    respawnLabelUkr: "8 діб (192 год)",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_goddard_07",
  },
  {
    id: "rb_epic_l2_valakas",
    name: "Raid Boss: Valakas",
    level: 87,
    hp: 1120000,
    mp: 0,
    pAtk: 4720,
    mAtk: 0,
    pDef: 1310,
    mDef: 885,
    exp: 920000,
    sp: 51000,
    adenaMin: 500000,
    adenaMax: 770000,
    dropChance: 1,
    drops: [...VALAKAS_EPIC_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: 264 * H,
    respawnLabelUkr: "11 діб (264 год), стабільно",
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_11",
  },
  ...XML_GRAND_RAID_BOSS_EPICS,
];

const EPIC_BY_ZONE = new Map<string, RaidBoss[]>();
for (const rb of L2_EPIC_RAID_BOSSES) {
  const z = rb.zoneId;
  const list = EPIC_BY_ZONE.get(z) ?? [];
  list.push(rb);
  EPIC_BY_ZONE.set(z, list);
}

/** Назви епік-РБ у зоні (для підказки в UI: повний дроп лише в їх картці). */
export function getEpicRaidBossNamesForZone(zoneId: string): string[] {
  return (EPIC_BY_ZONE.get(zoneId) ?? []).map((b) => b.name);
}

/** Епік L2 у списку локації / бою (за id або прапорцем). */
export function isL2EpicRaidBossMob(mob: { id?: string; isEpicRaidBoss?: boolean }): boolean {
  return mob.isEpicRaidBoss === true || (typeof mob.id === "string" && mob.id.startsWith("rb_epic_l2_"));
}

/** Додати епік-РБ для цієї зони (якщо є) до вже зібраного списку зонних РБ. */
export function appendEpicRaidBosses(zoneId: string, existing: RaidBoss[]): RaidBoss[] {
  const extra = EPIC_BY_ZONE.get(zoneId);
  if (!extra?.length) return existing;
  return [...existing, ...extra.map((b) => ({ ...b, zoneId }))];
}
