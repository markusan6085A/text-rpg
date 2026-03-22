// Елітні локації Годдарта (L2): рівні 80–86, посилені моби, 5% засідка при вході (див. Zone.entryAmbushChance + Location.tsx).
// Без aggressiveGroup — у бій іде лише обраний моб.

import type { Mob, Zone } from "../types";
import { L2DOP_GODDARD_HIGH_POOL } from "./goddardHighMobs.generated";
import { fillZoneMobs, shuffleMobsRandomly } from "./mobs";
import { applyL2XmlDropsToMob } from "./applyXmlDrops";
import { getMobListIconSrc } from "../../../utils/mobPublicIcon";

function scaleElite(m: Mob, combatMult: number, rewardMult: number): Mob {
  return {
    ...m,
    hp: Math.max(1, Math.round(m.hp * combatMult)),
    mp: Math.round((m.mp ?? 0) * combatMult),
    pAtk: Math.round(m.pAtk * combatMult),
    mAtk: Math.round((m.mAtk ?? 0) * combatMult),
    pDef: Math.round(m.pDef * combatMult),
    mDef: Math.round(m.mDef * combatMult),
    exp: Math.round(m.exp * rewardMult),
    sp: Math.round((m.sp ?? m.level * 2) * rewardMult),
    adenaMin: Math.round(m.adenaMin * rewardMult),
    adenaMax: Math.round(m.adenaMax * rewardMult),
  };
}

function withThemeIcon(mob: Mob, theme: "dragon" | "giant" | "destroy"): Mob {
  let icon = getMobListIconSrc(mob);
  if (!icon || icon === "/mobs/98.png") {
    if (theme === "dragon") icon = "/mobs/33.png";
    else if (theme === "giant") icon = "/mobs/12.png";
    else icon = "/mobs/317.png";
  }
  return { ...mob, icon };
}

function buildEliteGoddardZone(spec: {
  id: string;
  name: string;
  tp: number;
  mobCount: number;
  combatMult: number;
  rewardMult: number;
  theme: "dragon" | "giant" | "destroy";
}): Zone {
  const raw = fillZoneMobs(
    L2DOP_GODDARD_HIGH_POOL,
    spec.id,
    80,
    86,
    spec.mobCount,
    spec.mobCount,
    26,
    48
  ).map((m) => applyL2XmlDropsToMob(scaleElite(m, spec.combatMult, spec.rewardMult)));
  const mobs = raw.map((m) => withThemeIcon(m, spec.theme));
  return {
    id: spec.id,
    name: spec.name,
    cityId: "l2dop_goddard",
    minLevel: 80,
    maxLevel: 86,
    tpCost: spec.tp,
    entryAmbushChance: 0.05,
    mobs: shuffleMobsRandomly(mobs, [], [], spec.id),
  };
}

export function buildL2DopGoddardEliteZones(): Zone[] {
  return [
    buildEliteGoddardZone({
      id: "l2dop_goddard_dragon_valley",
      name: "Годдарт — Долина Драконів",
      tp: 46000,
      mobCount: 150,
      combatMult: 2,
      rewardMult: 2,
      theme: "dragon",
    }),
    buildEliteGoddardZone({
      id: "l2dop_goddard_giants_cave",
      name: "Годдарт — Печера Гігантів",
      tp: 48000,
      mobCount: 180,
      combatMult: 3,
      rewardMult: 3,
      theme: "giant",
    }),
    buildEliteGoddardZone({
      id: "l2dop_goddard_seed_destruction",
      name: "Годдарт — Насіння Знищення",
      tp: 51000,
      mobCount: 120,
      combatMult: 4,
      rewardMult: 4,
      theme: "destroy",
    }),
  ];
}
