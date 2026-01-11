import { SkillDefinition } from "../../../types";
import { heroRequiredLevel } from "./utils";

const levels = [
  { level: 2, spCost: 23000, mpCost: 30, power: 0 },
].map((entry) => ({
  level: entry.level,
  requiredLevel: heroRequiredLevel(entry.level),
  spCost: entry.spCost,
  mpCost: entry.mpCost,
  power: entry.power,
}));

export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "DMO_1012",
  name: "Cure Poison",
  description: "Cures poison effects up to power 7 on a single ally.",
  icon: "/skills/Skill1012_0.jpg",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels,
};

