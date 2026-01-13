import { SkillDefinition } from "../../../types";

// Drain Health - transfers HP from opponent to yourself
export const skill_0070_DrainHealth: SkillDefinition = {
  id: 70,
  code: "DKF_0070",
  name: "Drain Health",
  description: "Transfers HP from an opponent to yourself. Power 20. Absorbs 20% of damage dealt.\n\nПереводит HP от противника к себе. Сила 20. Поглощает 20% нанесенного урона.",
  icon: "/skills/skill0070.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 15,
  effects: [
    { stat: "vampirism", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 15, spCost: 1400, mpCost: 12, power: 20 },
    { level: 2, requiredLevel: 15, spCost: 1400, mpCost: 13, power: 22 },
  ],
};

