import { SkillDefinition } from "../../../types";

// Arcane Power
export const skill_0337: SkillDefinition = {
  id: 337,
  code: "ST_0337",
  name: "Arcane Power",
  description: "Significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect. Аура: - Увеличивает магическую атаку на 30%. - Увеличивает расход MP на магию на 10%. - Расходует по 250 HP раз в 5 сек.",
  category: "buff",
  powerType: "none",
  icon: "/skills/skill0337.gif",
  scope: "single",
  target: "self",
  duration: 300,
  tickInterval: 5,
  hpPerTick: -250,
  effects: [
    { stat: "mAtk", mode: "percent", value: 30 },
  ],
  levels: [{ level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 36, power: 0 }],
};
