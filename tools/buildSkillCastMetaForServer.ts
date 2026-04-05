/**
 * Generates server/src/data/skillCastMeta.generated.json for PvE self-buff casts (buff/toggle only).
 * Run: npx tsx tools/buildSkillCastMetaForServer.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillDefinition, SkillLevelDefinition } from "../src/data/skills/types";
import { AdditionalSkills } from "../src/data/skills/additional";
import { PROFESSION_OPTIONS, getSkillsForProfession, skillsDB } from "../src/data/skills/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Mirrors client buffHelpers.processSkillEffects (no import.meta / battle deps). */
function processSkillEffectsForMeta(def: SkillDefinition, levelDef: SkillLevelDefinition): any[] {
  const effects = Array.isArray(def.effects) ? def.effects : [];
  const effList =
    effects.length > 0
      ? effects.map((eff: any) => {
          const mode =
            eff.mode ??
            (def.powerType === "multiplier"
              ? "multiplier"
              : def.powerType === "percent"
                ? "percent"
                : "flat");
          if (mode === "multiplier") {
            let multiplier: number;
            if (eff.multiplier !== undefined) multiplier = eff.multiplier;
            else if (levelDef.power !== undefined && !isNaN(Number(levelDef.power)))
              multiplier = levelDef.power >= 1 ? levelDef.power : 1 + levelDef.power / 100;
            else multiplier = 1;
            return { ...eff, multiplier, mode: "multiplier" };
          }
          const base =
            typeof eff.value === "number"
              ? eff.value
              : typeof levelDef.power === "number"
                ? levelDef.power
                : 0;
          const finalValue =
            def.category === "debuff" && mode === "percent"
              ? -Math.abs(base * (eff.multiplier ?? 1))
              : base * (eff.multiplier ?? 1);
          return { ...eff, value: finalValue, mode };
        })
      : typeof levelDef.power === "number"
        ? [{ stat: "pAtk", mode: def.powerType === "percent" ? "percent" : "flat", value: levelDef.power }]
        : [];
  return effList;
}

function skillDefIsBuff(def: { category?: string }): boolean {
  return def?.category === "buff";
}

function skillDefIsToggle(def: { category?: string; toggle?: unknown } | null | undefined): boolean {
  if (!def || skillDefIsBuff(def)) return false;
  return (
    def.toggle === true ||
    def.toggle === "true" ||
    (typeof def.category === "string" && def.category === "toggle")
  );
}

const SUMMON_SKILL_IDS = new Set([1128, 1129, 1154, 1228, 1334]);

/** Хіли по призваному — з battle state, не з heroJson; лишаються клієнтським шляхом до окремого server snapshot. */
const HEAL_SERVER_EXCLUDE_IDS = new Set([1126, 1127]);

function isEligibleSelfCast(def: SkillDefinition): boolean {
  if (SUMMON_SKILL_IDS.has(def.id)) return false;
  if (def.itemConsume) return false;
  if (def.category === "debuff") return false;
  if (def.category === "heal") {
    return !HEAL_SERVER_EXCLUDE_IDS.has(def.id);
  }
  if (def.category === "physical_attack" || def.category === "magic_attack") return false;
  if (def.category === "special") return false;
  if (skillDefIsBuff(def)) return true;
  if (skillDefIsToggle(def)) return true;
  return false;
}

type LevelMeta = {
  mpCost: number;
  power: number;
  requiredLevel?: number;
};

type SkillMetaOut = {
  id: number;
  name: string;
  category: string;
  isToggle: boolean;
  duration: number;
  cooldown: number;
  code?: string;
  icon?: string;
  stackType?: string;
  buffGroup?: string;
  powerType?: string;
  resourceHeal?: SkillDefinition["resourceHeal"];
  hpPerTick?: number;
  mpPerTick?: number;
  tickInterval?: number;
  levels: Record<string, LevelMeta>;
  effectsByLevel: Record<string, any[]>;
};

function buildMeta(def: SkillDefinition): SkillMetaOut {
  const levels: Record<string, LevelMeta> = {};
  const effectsByLevel: Record<string, any[]> = {};
  for (const lv of def.levels || []) {
    const k = String(lv.level);
    levels[k] = {
      mpCost: Number(lv.mpCost ?? 0) || 0,
      power: Number(lv.power ?? 0) || 0,
      ...(lv.requiredLevel !== undefined ? { requiredLevel: Number(lv.requiredLevel) } : {}),
    };
    effectsByLevel[k] = processSkillEffectsForMeta(def, lv);
  }
  return {
    id: def.id,
    name: def.name,
    category: String(def.category ?? ""),
    isToggle: skillDefIsToggle(def),
    duration: Number(def.duration ?? 10) || 10,
    cooldown: Number(def.cooldown ?? 5) || 5,
    ...(def.code ? { code: def.code } : {}),
    ...(def.icon ? { icon: def.icon } : {}),
    ...(def.stackType ? { stackType: def.stackType } : {}),
    ...(def.buffGroup ? { buffGroup: def.buffGroup } : {}),
    ...(def.powerType ? { powerType: def.powerType } : {}),
    ...(def.resourceHeal ? { resourceHeal: def.resourceHeal } : {}),
    ...(def.hpPerTick !== undefined ? { hpPerTick: def.hpPerTick } : {}),
    ...(def.mpPerTick !== undefined ? { mpPerTick: def.mpPerTick } : {}),
    ...(def.tickInterval !== undefined ? { tickInterval: def.tickInterval } : {}),
    levels,
    effectsByLevel,
  };
}

function main() {
  const professionToSkillIds: Record<string, number[]> = {};
  const skillUnion = new Set<number>();

  for (const { id: professionId } of PROFESSION_OPTIONS) {
    const skills = getSkillsForProfession(professionId);
    const ids: number[] = [];
    for (const s of skills) {
      if (!isEligibleSelfCast(s)) continue;
      ids.push(s.id);
      skillUnion.add(s.id);
    }
    if (ids.length) professionToSkillIds[professionId] = [...new Set(ids)].sort((a, b) => a - b);
  }

  const skillsOut: Record<string, SkillMetaOut> = {};
  for (const sid of skillUnion) {
    const def = skillsDB[sid];
    if (!def) continue;
    skillsOut[String(sid)] = buildMeta(def);
  }

  const extraIds = Object.values(AdditionalSkills)
    .map((s) => s.id)
    .filter((id) => isEligibleSelfCast(skillsDB[id]));
  for (const sid of extraIds) {
    const def = skillsDB[sid];
    if (!def) continue;
    skillsOut[String(sid)] = buildMeta(def);
    for (const prof of Object.keys(professionToSkillIds)) {
      const arr = professionToSkillIds[prof];
      if (!arr.includes(sid)) arr.push(sid);
      arr.sort((a, b) => a - b);
    }
  }

  const payload = {
    version: 1,
    skills: skillsOut,
    professionToSkillIds,
  };

  const outPath = path.join(__dirname, "..", "server", "src", "data", "skillCastMeta.generated.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath} (${Object.keys(skillsOut).length} skills)`);
}

main();
