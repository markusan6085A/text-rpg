import { SkillDefinition } from "../../../types";

export const skill_1016: SkillDefinition = {
  id: 1016,
  code: "HM_1016",
  name: "Resurrection",
  description: "Resurrects a corpse.\n\nВоскрешает труп. Восстанавливает 0-20% опыта (зависит от уровня).",
  icon: "/skills/skill1016.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 120,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 59, power: 0 },
    { level: 2, requiredLevel: 30, spCost: 13000, mpCost: 88, power: 20 },
  ],
};

