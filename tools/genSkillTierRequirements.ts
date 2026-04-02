/**
 * Генерує server/src/skillTierRequirements.json для clamp скілів по рівню героя
 * та server/src/skillLearnCosts.json (tier, req, sp) для серверного вивчення скілів.
 * Запуск з кореня репо: npx tsx tools/genSkillTierRequirements.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { skillsDB } from "../src/data/skills/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

type TierRow = { tier: number; req: number };
type LearnRow = { tier: number; req: number; sp: number };
const out: Record<string, TierRow[]> = {};
const learnOut: Record<string, LearnRow[]> = {};

for (const [idStr, def] of Object.entries(skillsDB)) {
  const id = Number(idStr);
  if (!id || !def?.levels?.length) continue;
  const tiers: TierRow[] = def.levels.map((l) => ({
    tier: Math.max(1, Number(l.level) || 1),
    req: Math.max(1, Number(l.requiredLevel ?? 1)),
  }));
  tiers.sort((a, b) => a.tier - b.tier);
  out[String(id)] = tiers;
  const learnRows: LearnRow[] = def.levels.map((l) => ({
    tier: Math.max(1, Number(l.level) || 1),
    req: Math.max(1, Number(l.requiredLevel ?? 1)),
    sp: Math.max(0, Math.floor(Number(l.spCost) || 0)),
  }));
  learnRows.sort((a, b) => a.tier - b.tier);
  learnOut[String(id)] = learnRows;
}

const target = join(__dirname, "..", "server", "src", "skillTierRequirements.json");
const learnTarget = join(__dirname, "..", "server", "src", "skillLearnCosts.json");
writeFileSync(target, JSON.stringify(out), "utf8");
writeFileSync(learnTarget, JSON.stringify(learnOut), "utf8");
console.log("Wrote", target, "skills:", Object.keys(out).length);
console.log("Wrote", learnTarget, "skills:", Object.keys(learnOut).length);
