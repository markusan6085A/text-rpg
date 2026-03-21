/**
 * Генерує server/src/skillTierRequirements.json для адмінського clamp скілів по рівню героя.
 * Запуск з кореня репо: npx tsx tools/genSkillTierRequirements.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { skillsDB } from "../src/data/skills/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

type TierRow = { tier: number; req: number };
const out: Record<string, TierRow[]> = {};

for (const [idStr, def] of Object.entries(skillsDB)) {
  const id = Number(idStr);
  if (!id || !def?.levels?.length) continue;
  const tiers: TierRow[] = def.levels.map((l) => ({
    tier: Math.max(1, Number(l.level) || 1),
    req: Math.max(1, Number(l.requiredLevel ?? 1)),
  }));
  tiers.sort((a, b) => a.tier - b.tier);
  out[String(id)] = tiers;
}

const target = join(__dirname, "..", "server", "src", "skillTierRequirements.json");
writeFileSync(target, JSON.stringify(out), "utf8");
console.log("Wrote", target, "skills:", Object.keys(out).length);
