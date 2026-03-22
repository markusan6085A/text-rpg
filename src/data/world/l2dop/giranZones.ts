// Зони Giran (L2): кілька L2-околиць в одній ігровій локації; моби з XML (giranMobs.generated).

import type { Mob, Zone } from "../types";
import type { RaidBoss } from "../../bosses/floran_overlord";
import type { DropEntry } from "../../combat/types";
import { L2DOP_GIRAN_POOL } from "./giranMobs.generated";
import { fillZoneMobs, shuffleMobsRandomly, makeChampion } from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";

function giranRbDrops(): DropEntry[] {
  return [];
}

/** Шість РБ з різним рівнем у межах зони, без дропу. */
function buildGiranRaidBosses(zoneId: string, minLvl: number, maxLvl: number): RaidBoss[] {
  const levels: number[] = [];
  for (let i = 0; i < 6; i++) {
    levels.push(Math.round(minLvl + ((maxLvl - minLvl) * i) / 5));
  }
  const suffix = zoneId.replace("l2dop_giran_", "");
  const names = [
    "Страж перехресть",
    "Володар пагорбів",
    "Тінь болота",
    "Король розбійників",
    "Титан околиць",
    "Повелитель стежок",
  ];
  const refL = 48;
  return levels.map((level, i) => {
    const m = level / refL;
    const hp = Math.round(155000 * m * m * (0.9 + (i % 3) * 0.05));
    const pAtk = Math.round(400 * m * (0.95 + i * 0.02));
    return {
      id: `rb_l2dop_giran_${suffix}_${String.fromCharCode(97 + i)}`,
      name: `Raid Boss: ${names[i]} (${suffix})`,
      level,
      hp,
      mp: 0,
      pAtk,
      mAtk: Math.round(200 * m),
      pDef: Math.round(280 * m),
      mDef: Math.round(190 * m),
      exp: Math.round(72000 * m * m),
      sp: Math.round(3800 * m),
      adenaMin: Math.round(28000 * m * m),
      adenaMax: Math.round(45000 * m * m),
      dropChance: 1,
      drops: giranRbDrops(),
      isRaidBoss: true,
      respawnTime: 5 * 60 * 60,
      dropProfileId: "rb_l2dop_aden_drop",
      aiProfileId: "rb_floran_ai",
      zoneId,
    };
  });
}

export function getGiranL2DopChampions(zoneId: string, minLvl: number, maxLvl: number): Mob[] {
  const filtered = L2DOP_GIRAN_POOL.filter((m) => m.level >= minLvl && m.level <= maxLvl);
  if (filtered.length < 2) return [];
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) | 0;
  const rand = () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };
  const count = 14 + Math.floor(rand() * 3);
  const shuffled = [...filtered].sort(() => rand() - 0.5);
  const names: Record<string, string> = {
    "01": "Гіран — Дорожній вартовий",
    "02": "Гіран — Володар луків",
    "03": "Гіран — Тінь ярів",
    "04": "Гіран — Страж розломів",
    "05": "Гіран — Король диких стежок",
    "06": "Гіран — Архонт долини",
    "07": "Гіран — Повелитель висот",
    "08": "Гіран — Титан перевалів",
    "09": "Гіран — Володар краю",
  };
  const suffixes = ["I", "II", "III", "IV", "V", "Страж", "Титан", "Лорд", "Вождь", "Вартовий", "Пастух", "Мисливець", "Скелетар", "Драконоїд", "Тінь", "Крига"];
  const zoneNum = zoneId.replace("l2dop_giran_", "");
  const baseName = names[zoneNum] ?? "Гіран — Чемпіон";
  const result: Mob[] = [];
  const n = Math.min(count, shuffled.length);
  for (let i = 0; i < n; i++) {
    result.push(makeChampion(shuffled[i], `${baseName} ${suffixes[i % suffixes.length]}`, String.fromCharCode(97 + i)));
  }
  return result;
}

function buildGiranZoneMobs(z: { id: string; min: number; max: number }) {
  const regular = fillZoneMobs(L2DOP_GIRAN_POOL, z.id, z.min, z.max, 200, 300, 22, 42).map(applyL2XmlDropsToMob);
  const champions = getGiranL2DopChampions(z.id, z.min, z.max).map(applyL2XmlDropsToMob);
  const raidBosses = buildGiranRaidBosses(z.id, z.min, z.max);
  return shuffleMobsRandomly(regular, champions, raidBosses, z.id);
}

const GIRAN_ZONE_DEFS = [
  { id: "l2dop_giran_01", name: "Giran — Дорога, луки та пагорби", min: 26, max: 38, tp: 24000 },
  { id: "l2dop_giran_02", name: "Giran — Болота й перелісся", min: 30, max: 42, tp: 25500 },
  { id: "l2dop_giran_03", name: "Giran — Яри та розломи", min: 34, max: 46, tp: 27000 },
  { id: "l2dop_giran_04", name: "Giran — Долини та ущелини", min: 38, max: 50, tp: 28500 },
  { id: "l2dop_giran_05", name: "Giran — Стежки мисливців", min: 42, max: 54, tp: 30000 },
  { id: "l2dop_giran_06", name: "Giran — Висоти та перевали", min: 46, max: 58, tp: 31500 },
  { id: "l2dop_giran_07", name: "Giran — Темні схили", min: 50, max: 62, tp: 33000 },
  { id: "l2dop_giran_08", name: "Giran — Край драконових тіней", min: 54, max: 66, tp: 34500 },
  { id: "l2dop_giran_09", name: "Giran — Верхня межа околиць", min: 56, max: 70, tp: 36000 },
] as const;

export function buildL2DopGiranZones(): Zone[] {
  return GIRAN_ZONE_DEFS.map((z) => ({
    id: z.id,
    name: z.name,
    cityId: "l2dop_giran" as const,
    minLevel: z.min,
    maxLevel: z.max,
    tpCost: z.tp,
    mobs: buildGiranZoneMobs(z),
  }));
}
