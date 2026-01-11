import { SkillDefinition } from "../../../types";
import { heroRequiredLevel } from "./utils";

const levels = [
  { level: 2, spCost: 3300, mpCost: 20, power: 12 },
].map((entry) => ({
  level: entry.level,
  requiredLevel: heroRequiredLevel(entry.level),
  spCost: entry.spCost,
  mpCost: entry.mpCost,
  power: entry.power,
}));

export const skill_1068: SkillDefinition = {
  id: 1068,
  code: "DMO_1068",
  name: "Might",
  description: "Boosts physical attack for the caster and allies in range.",
  icon: "/skills/skill1068.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  duration: 1200,
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels,
};

