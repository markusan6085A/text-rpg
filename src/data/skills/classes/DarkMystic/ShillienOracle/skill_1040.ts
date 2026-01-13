import { SkillDefinition } from "../../../types";
import { heroRequiredLevel } from "./utils";

const levels = [
  { level: 2, spCost: 6500, mpCost: 23, power: 12 },
].map((entry) => ({
  level: entry.level,
  requiredLevel: heroRequiredLevel(entry.level),
  spCost: entry.spCost,
  mpCost: entry.mpCost,
  power: entry.power,
}));

export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "DMO_1040",
  name: "Shield",
  description: "Raises physical defense for 20 minutes on the caster or another ally.",
  icon: "/skills/skill1040.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  duration: 1200,
  effects: [{ stat: "pDef", mode: "percent" }],
  levels,
};

