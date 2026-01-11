import { SkillDefinition } from "../../../types";

export const Skill_0083: SkillDefinition = {
  id: 83,
  code: "OM_0083",
  name: "Totem Spirit Wolf",
  description: "Projects the spirit of the wolf. Temporarily increases Speed.\n\nПроецирует дух волка. Временно увеличивает скорость.",
  icon: "/skills/skill0083.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 120,
  duration: 300,
  stackType: "totem_spirit",
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 1.15, duration: 300 },
    { stat: "accuracy", mode: "flat", value: 3, duration: 300 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 5300, mpCost: 2, power: 0 },
  ],
};

