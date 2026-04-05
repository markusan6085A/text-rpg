/**
 * Generates server/src/data/pveAttackSkillMeta.generated.json for server-side PvE attack skills.
 * Run: npx tsx tools/buildAttackSkillMetaForServer.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillDefinition } from "../src/data/skills/types";
import { PROFESSION_OPTIONS, getSkillsForProfession, skillsDB } from "../src/data/skills/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type LevelMeta = { mpCost: number; power: number };
type SkillOut = {
  id: number;
  category: string;
  element?: string;
  levels: Record<string, LevelMeta>;
};

function eligible(def: SkillDefinition): boolean {
  return def.category === "physical_attack" || def.category === "magic_attack";
}

function main() {
  const professionToSkillIds: Record<string, number[]> = {};
  const ids = new Set<number>();

  for (const { id: professionId } of PROFESSION_OPTIONS) {
    const skills = getSkillsForProfession(professionId);
    const row: number[] = [];
    for (const s of skills) {
      if (!eligible(s)) continue;
      row.push(s.id);
      ids.add(s.id);
    }
    if (row.length) professionToSkillIds[professionId] = [...new Set(row)].sort((a, b) => a - b);
  }

  const skillsOut: Record<string, SkillOut> = {};
  for (const sid of ids) {
    const def = skillsDB[sid];
    if (!def || !eligible(def)) continue;
    const levels: Record<string, LevelMeta> = {};
    for (const lv of def.levels || []) {
      levels[String(lv.level)] = {
        mpCost: Number(lv.mpCost ?? 0) || 0,
        power: Number(lv.power ?? 1) || 1,
      };
    }
    skillsOut[String(sid)] = {
      id: def.id,
      category: String(def.category),
      ...(def.element ? { element: String(def.element) } : {}),
      levels,
    };
  }

  const payload = { version: 1, skills: skillsOut, professionToSkillIds };
  const outPath = path.join(__dirname, "..", "server", "src", "data", "pveAttackSkillMeta.generated.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath} (${Object.keys(skillsOut).length} skills)`);
}

main();
